import type { VercelRequest, VercelResponse } from "@vercel/node";

const ALLOWED_MODES = [
  "Result Summary",
  "Strengths in Action",
  "Watch-outs & Reframes",
  "7-Day Reflection Plan",
  "Communication Prep",
  "Journaling Prompts",
] as const;

const ALLOWED_TEMPERAMENTS = [
  "Sanguine",
  "Choleric",
  "Melancholic",
  "Phlegmatic",
] as const;

const ALLOWED_CONFIDENCE = ["high", "medium", "low"] as const;

const SOFT_RATE_LIMIT_WINDOW_MS = 60_000;
const SOFT_RATE_LIMIT_MAX = 12;
// Best-effort soft limiter only:
// - in-memory per function instance
// - not shared across serverless instances
// - may reset on cold starts
const softRateLimitStore = new Map<string, { count: number; resetAt: number }>();

type MixPayload = {
  sanguine: number;
  choleric: number;
  melancholic: number;
  phlegmatic: number;
};

type ReflectContext = {
  primary: (typeof ALLOWED_TEMPERAMENTS)[number];
  secondary: (typeof ALLOWED_TEMPERAMENTS)[number];
  confidence: (typeof ALLOWED_CONFIDENCE)[number];
  mix: MixPayload;
};

type ReflectRequest = {
  mode: (typeof ALLOWED_MODES)[number];
  context: ReflectContext;
  user_question?: string;
};

type ReflectSuccess = {
  ok: true;
  data: {
    title: string;
    body: string;
    suggested_next: string[];
  };
};

type ReflectError = {
  ok: false;
  error: {
    code: "BAD_REQUEST" | "RATE_LIMITED" | "UPSTREAM_ERROR";
    message: string;
  };
};

export const config = {
  runtime: "nodejs",
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse<ReflectSuccess | ReflectError>,
) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return sendError(res, 405, "BAD_REQUEST", "Use POST for this endpoint.");
  }

  const clientIp = getClientIp(req);
  if (isSoftRateLimited(hashRateKey(clientIp))) {
    return sendError(
      res,
      429,
      "RATE_LIMITED",
      "Too many reflection requests right now. Please pause briefly and try again.",
    );
  }

  let parsedBody: unknown;
  try {
    parsedBody = parseBody(req.body);
  } catch {
    return sendError(res, 400, "BAD_REQUEST", "Request body must be valid JSON.");
  }

  const validation = validateReflectRequest(parsedBody);
  if (validation.ok === false) {
    return sendError(res, 400, "BAD_REQUEST", validation.message);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const systemPrompt = process.env.TRG_SYSTEM_PROMPT;

  if (!apiKey || !systemPrompt) {
    logProxyError("missing_env_configuration", 500);
    return sendError(
      res,
      500,
      "UPSTREAM_ERROR",
      "Reflection service is not configured yet. Please try again later.",
    );
  }

  const promptInput = buildUserPrompt(validation.data);

  let modelText = "";
  try {
    modelText = await callGemini({
      apiKey,
      model,
      systemPrompt,
      userPrompt: promptInput,
    });
  } catch (error) {
    const upstreamMeta = parseUpstreamError(error);
    logProxyError(upstreamMeta.category, upstreamMeta.status);
    return sendError(
      res,
      502,
      "UPSTREAM_ERROR",
      "We could not generate a reflection right now. Please try again in a moment.",
    );
  }

  const normalized = normalizeModelOutput(modelText, validation.data.mode);
  if (normalized.ok === false) {
    logProxyError("upstream_shape_invalid", 502);
    return sendError(
      res,
      502,
      "UPSTREAM_ERROR",
      "We could not safely format this reflection. Please try again.",
    );
  }

  return res.status(200).json({
    ok: true,
    data: normalized.data,
  });
}

function sendError(
  res: VercelResponse<ReflectSuccess | ReflectError>,
  httpStatus: number,
  code: ReflectError["error"]["code"],
  message: string,
) {
  return res.status(httpStatus).json({
    ok: false,
    error: { code, message },
  });
}

function parseBody(raw: unknown): unknown {
  if (typeof raw === "string") {
    return JSON.parse(raw);
  }
  if (raw instanceof Uint8Array) {
    return JSON.parse(Buffer.from(raw).toString("utf8"));
  }
  return raw;
}

function validateReflectRequest(
  payload: unknown,
): { ok: true; data: ReflectRequest } | { ok: false; message: string } {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, message: "Request must include mode and context." };
  }

  const data = payload as Record<string, unknown>;
  const mode = data.mode;
  if (
    typeof mode !== "string" ||
    ALLOWED_MODES.indexOf(mode as (typeof ALLOWED_MODES)[number]) === -1
  ) {
    return { ok: false, message: "Mode must match one of the six allowed reflection modes." };
  }

  const question = data.user_question;
  if (question !== undefined && typeof question !== "string") {
    return { ok: false, message: "user_question must be a string when provided." };
  }
  const userQuestion = typeof question === "string" ? question.trim() : undefined;
  if (userQuestion && userQuestion.length > 240) {
    return { ok: false, message: "user_question must be 240 characters or fewer." };
  }

  const contextValidation = validateContext(data.context);
  if (contextValidation.ok === false) {
    return { ok: false, message: contextValidation.message };
  }

  return {
    ok: true,
    data: {
      mode: mode as ReflectRequest["mode"],
      context: contextValidation.context,
      user_question: userQuestion,
    },
  };
}

function validateContext(
  context: unknown,
): { ok: true; context: ReflectContext } | { ok: false; message: string } {
  if (!context || typeof context !== "object" || Array.isArray(context)) {
    return { ok: false, message: "context must be an object with primary, secondary, confidence, and mix." };
  }

  const c = context as Record<string, unknown>;
  const primary = c.primary;
  const secondary = c.secondary;
  const confidence = c.confidence;

  if (
    typeof primary !== "string" ||
    ALLOWED_TEMPERAMENTS.indexOf(primary as (typeof ALLOWED_TEMPERAMENTS)[number]) === -1
  ) {
    return { ok: false, message: "context.primary must be a valid temperament." };
  }

  if (
    typeof secondary !== "string" ||
    ALLOWED_TEMPERAMENTS.indexOf(secondary as (typeof ALLOWED_TEMPERAMENTS)[number]) === -1
  ) {
    return { ok: false, message: "context.secondary must be a valid temperament." };
  }

  if (
    typeof confidence !== "string" ||
    ALLOWED_CONFIDENCE.indexOf(confidence as (typeof ALLOWED_CONFIDENCE)[number]) === -1
  ) {
    return { ok: false, message: "context.confidence must be high, medium, or low." };
  }

  const mixValidation = validateMix(c.mix);
  if (mixValidation.ok === false) {
    return { ok: false, message: mixValidation.message };
  }

  return {
    ok: true,
    context: {
      primary: primary as ReflectContext["primary"],
      secondary: secondary as ReflectContext["secondary"],
      confidence: confidence as ReflectContext["confidence"],
      mix: mixValidation.mix,
    },
  };
}

function validateMix(
  mix: unknown,
): { ok: true; mix: MixPayload } | { ok: false; message: string } {
  if (!mix || typeof mix !== "object" || Array.isArray(mix)) {
    return { ok: false, message: "context.mix must include sanguine, choleric, melancholic, and phlegmatic values." };
  }

  const source = mix as Record<string, unknown>;
  const keys: Array<keyof MixPayload> = [
    "sanguine",
    "choleric",
    "melancholic",
    "phlegmatic",
  ];
  const values = {} as MixPayload;

  for (const key of keys) {
    const value = source[key];
    if (typeof value !== "number" || !isFinite(value)) {
      return { ok: false, message: `context.mix.${key} must be a number.` };
    }
    values[key] = value;
  }

  const sum = values.sanguine + values.choleric + values.melancholic + values.phlegmatic;
  // Mix values are used for relative emphasis only; allow common rounding variance.
  if (sum < 99 || sum > 101) {
    return { ok: false, message: "context.mix values must sum to approximately 100 (99-101 accepted)." };
  }

  return { ok: true, mix: values };
}

function buildUserPrompt(input: ReflectRequest): string {
  const userQuestion = input.user_question?.trim();

  return [
    "Generate one educational reflection response using the provided mode and context.",
    `mode: ${input.mode}`,
    `context: ${JSON.stringify(input.context)}`,
    `user_question: ${userQuestion && userQuestion.length > 0 ? userQuestion : "(none)"}`,
    "Output strict JSON only with keys: title, body, suggested_next.",
    "title must exactly equal mode.",
    "body must be 150-200 words.",
    "suggested_next must be an array of 0-3 short, safe follow-up questions.",
    "Do not include markdown fences or additional keys.",
  ].join("\n");
}

async function callGemini(input: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
}): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    input.model,
  )}:generateContent?key=${encodeURIComponent(input.apiKey)}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: input.systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: input.userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 350,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    throw {
      category: "upstream_http_error",
      status: response.status,
    };
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();

  if (!text) {
    throw {
      category: "upstream_empty_response",
      status: 502,
    };
  }

  return text;
}

function normalizeModelOutput(
  modelText: string,
  mode: string,
):
  | { ok: true; data: { title: string; body: string; suggested_next: string[] } }
  | { ok: false; reason: string } {
  const parsed = parseModelJson(modelText);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const titleRaw = (parsed as Record<string, unknown>).title;
    const bodyRaw = (parsed as Record<string, unknown>).body;
    const suggestedRaw = (parsed as Record<string, unknown>).suggested_next;

    if (typeof titleRaw === "string" && titleRaw.trim().length > 0 && titleRaw.trim() !== mode) {
      return { ok: false, reason: "title_mismatch" };
    }

    const body = typeof bodyRaw === "string" ? sanitizeWhitespace(bodyRaw) : "";
    if (!body) {
      return { ok: false, reason: "missing_body" };
    }

    const bodyWords = countWords(body);
    if (bodyWords < 150 || bodyWords > 200) {
      return { ok: false, reason: `body_word_count_${bodyWords}` };
    }

    let suggestedNext: string[] = [];
    if (Array.isArray(suggestedRaw)) {
      suggestedNext = suggestedRaw
        .filter((item) => typeof item === "string")
        .map((item) => sanitizeWhitespace(item))
        .filter((item) => item.length > 0)
        .slice(0, 3);
    }

    return {
      ok: true,
      data: {
        title: mode,
        body,
        suggested_next: suggestedNext,
      },
    };
  }

  const fallbackBody = sanitizeFallbackBody(modelText);
  if (!fallbackBody) {
    return { ok: false, reason: "invalid_non_json_body" };
  }

  const fallbackWords = countWords(fallbackBody);
  if (fallbackWords < 150 || fallbackWords > 200) {
    return { ok: false, reason: `fallback_body_word_count_${fallbackWords}` };
  }

  if (violatesSafetyBoundaries(fallbackBody)) {
    return { ok: false, reason: "fallback_safety_violation" };
  }

  return {
    ok: true,
    data: {
      title: mode,
      body: fallbackBody,
      suggested_next: [],
    },
  };
}

function parseModelJson(text: string): unknown {
  const direct = tryParseJson(text);
  if (direct !== null) {
    return direct;
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return tryParseJson(text.slice(start, end + 1));
}

function tryParseJson(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function sanitizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function sanitizeFallbackBody(raw: string): string {
  const withoutLeadingFence = raw.replace(/^\s*```(?:json|text|markdown)?\s*/i, "");
  const withoutTrailingFence = withoutLeadingFence.replace(/\s*```\s*$/i, "");
  const withoutTitle = withoutTrailingFence.replace(/^\s*title\s*:\s*[^\n]+\n+/i, "");
  const withoutSuggestedNext = withoutTitle.replace(/\n+\s*suggested[_\s-]*next\s*:[\s\S]*$/i, "");
  const withoutBodyLabel = withoutSuggestedNext.replace(/^\s*body\s*:\s*/i, "");
  return sanitizeWhitespace(withoutBodyLabel);
}

function violatesSafetyBoundaries(text: string): boolean {
  const forbiddenPatterns = [
    /\b(this is a diagnosis|you are diagnosed|clinical diagnosis|medical diagnosis)\b/i,
    /\b(you have a mental disorder|you are mentally ill|personality disorder)\b/i,
    /\b(i prescribe|take .* medication|change .* dosage|treatment plan)\b/i,
    /\b(self-harm|suicide|emergency counseling)\b/i,
    /\b(legal advice|financial advice|you should sue|you should invest)\b/i,
    /\b(you are definitely|this proves|you will always|you can never)\b/i,
  ];

  return forbiddenPatterns.some((pattern) => pattern.test(text));
}

function countWords(value: string): number {
  return value.split(/\s+/).filter(Boolean).length;
}

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }

  if (Array.isArray(forwarded) && forwarded[0]) {
    return String(forwarded[0]).split(",")[0].trim();
  }

  const realIp = req.headers?.["x-real-ip"];
  if (typeof realIp === "string" && realIp.trim()) {
    return realIp.trim();
  }

  return req.socket?.remoteAddress || "unknown";
}

function isSoftRateLimited(ip: string): boolean {
  const now = Date.now();

  for (const [key, entry] of softRateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      softRateLimitStore.delete(key);
    }
  }

  const current = softRateLimitStore.get(ip);
  if (!current) {
    softRateLimitStore.set(ip, { count: 1, resetAt: now + SOFT_RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (current.resetAt <= now) {
    softRateLimitStore.set(ip, { count: 1, resetAt: now + SOFT_RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (current.count >= SOFT_RATE_LIMIT_MAX) {
    return true;
  }

  current.count += 1;
  softRateLimitStore.set(ip, current);
  return false;
}

function parseUpstreamError(error: unknown): { category: string; status: number } {
  if (
    error &&
    typeof error === "object" &&
    "category" in error &&
    typeof (error as { category?: unknown }).category === "string" &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
  ) {
    return {
      category: (error as { category: string }).category,
      status: (error as { status: number }).status,
    };
  }

  return {
    category: "upstream_unknown_error",
    status: 502,
  };
}

function logProxyError(category: string, status: number) {
  console.error(`[reflect] category=${category} status=${status}`);
}

function hashRateKey(ip: string): string {
  // Non-cryptographic hash to avoid storing raw IP values in memory.
  let hash = 2166136261;
  for (let i = 0; i < ip.length; i += 1) {
    hash ^= ip.charCodeAt(i);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `ip_${(hash >>> 0).toString(16)}`;
}
