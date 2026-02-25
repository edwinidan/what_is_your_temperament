import type { VercelRequest, VercelResponse } from "@vercel/node";

// ─── Constants ───────────────────────────────────────────────────────────────

const ALLOWED_TEMPERAMENTS = [
    "Sanguine",
    "Choleric",
    "Melancholic",
    "Phlegmatic",
] as const;

const ALLOWED_CONFIDENCE = ["high", "medium", "low"] as const;

/** Max conversation turns (user + assistant messages combined). */
const MAX_HISTORY_ENTRIES = 20;
/** Max characters per individual message in history. */
const MAX_MESSAGE_CHARS = 400;
/** Max total characters across all history messages combined. */
const MAX_TOTAL_CHARS = 8_000;

const SOFT_RATE_LIMIT_WINDOW_MS = 60_000;
const SOFT_RATE_LIMIT_MAX = 12;
const softRateLimitStore = new Map<string, { count: number; resetAt: number }>();

// ─── Types ────────────────────────────────────────────────────────────────────

type TemperamentName = (typeof ALLOWED_TEMPERAMENTS)[number];
type ConfidenceLevel = (typeof ALLOWED_CONFIDENCE)[number];

type MixPayload = {
    sanguine: number;
    choleric: number;
    melancholic: number;
    phlegmatic: number;
};

type ChatContext = {
    primary: TemperamentName;
    secondary: TemperamentName;
    confidence: ConfidenceLevel;
    mix: MixPayload;
};

type ChatTurn = {
    role: "user" | "assistant";
    content: string;
};

type ChatRequest = {
    context: ChatContext;
    history: ChatTurn[];
};

// ─── Vercel config ────────────────────────────────────────────────────────────

export const config = {
    runtime: "nodejs",
};

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(
    req: VercelRequest,
    res: VercelResponse,
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
            "Too many chat requests right now. Please pause briefly and try again.",
        );
    }

    let parsedBody: unknown;
    try {
        parsedBody = parseBody(req.body);
    } catch {
        return sendError(res, 400, "BAD_REQUEST", "Request body must be valid JSON.");
    }

    const validation = validateChatRequest(parsedBody);
    if (validation.ok === false) {
        return sendError(res, 400, "BAD_REQUEST", validation.message);
    }

    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
    const systemPrompt =
        process.env.TRG_CHAT_SYSTEM_PROMPT || process.env.TRG_SYSTEM_PROMPT;

    if (!apiKey || !systemPrompt) {
        logError("missing_env_configuration", 500);
        return sendError(
            res,
            500,
            "UPSTREAM_ERROR",
            "Chat service is not configured yet. Please try again later.",
        );
    }

    let replyText = "";
    try {
        replyText = await callGroq({
            apiKey,
            model,
            systemPrompt,
            context: validation.data.context,
            history: validation.data.history,
        });
    } catch (error) {
        const meta = parseUpstreamError(error);
        logError(meta.category, meta.status);
        return sendError(
            res,
            502,
            "UPSTREAM_ERROR",
            "We could not generate a reply right now. Please try again in a moment.",
        );
    }

    const body = sanitizeWhitespace(replyText);
    if (!body) {
        logError("upstream_empty_response", 502);
        return sendError(
            res,
            502,
            "UPSTREAM_ERROR",
            "We received an empty reply from the AI. Please try again.",
        );
    }

    return res.status(200).json({
        ok: true,
        data: { body },
    });
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateChatRequest(
    payload: unknown,
): { ok: true; data: ChatRequest } | { ok: false; message: string } {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return { ok: false, message: "Request must include context and history." };
    }

    const data = payload as Record<string, unknown>;

    const contextResult = validateContext(data.context);
    if (contextResult.ok === false) {
        return { ok: false, message: contextResult.message };
    }

    const historyResult = validateHistory(data.history);
    if (historyResult.ok === false) {
        return { ok: false, message: historyResult.message };
    }

    return {
        ok: true,
        data: {
            context: contextResult.context,
            history: historyResult.history,
        },
    };
}

function validateContext(
    context: unknown,
): { ok: true; context: ChatContext } | { ok: false; message: string } {
    if (!context || typeof context !== "object" || Array.isArray(context)) {
        return {
            ok: false,
            message: "context must include primary, secondary, confidence, and mix.",
        };
    }

    const c = context as Record<string, unknown>;

    if (
        typeof c.primary !== "string" ||
        !ALLOWED_TEMPERAMENTS.includes(c.primary as TemperamentName)
    ) {
        return { ok: false, message: "context.primary must be a valid temperament." };
    }

    if (
        typeof c.secondary !== "string" ||
        !ALLOWED_TEMPERAMENTS.includes(c.secondary as TemperamentName)
    ) {
        return { ok: false, message: "context.secondary must be a valid temperament." };
    }

    if (
        typeof c.confidence !== "string" ||
        !ALLOWED_CONFIDENCE.includes(c.confidence as ConfidenceLevel)
    ) {
        return { ok: false, message: "context.confidence must be high, medium, or low." };
    }

    const mixResult = validateMix(c.mix);
    if (mixResult.ok === false) {
        return { ok: false, message: mixResult.message };
    }

    return {
        ok: true,
        context: {
            primary: c.primary as TemperamentName,
            secondary: c.secondary as TemperamentName,
            confidence: c.confidence as ConfidenceLevel,
            mix: mixResult.mix,
        },
    };
}

function validateMix(
    mix: unknown,
): { ok: true; mix: MixPayload } | { ok: false; message: string } {
    if (!mix || typeof mix !== "object" || Array.isArray(mix)) {
        return {
            ok: false,
            message: "context.mix must include sanguine, choleric, melancholic, and phlegmatic values.",
        };
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

    const sum =
        values.sanguine + values.choleric + values.melancholic + values.phlegmatic;
    if (sum < 99 || sum > 101) {
        return {
            ok: false,
            message: "context.mix values must sum to approximately 100 (99–101 accepted).",
        };
    }

    return { ok: true, mix: values };
}

function validateHistory(
    history: unknown,
): { ok: true; history: ChatTurn[] } | { ok: false; message: string } {
    if (!Array.isArray(history)) {
        return { ok: false, message: "history must be an array." };
    }

    if (history.length === 0) {
        return { ok: false, message: "history must contain at least one message." };
    }

    if (history.length > MAX_HISTORY_ENTRIES) {
        return {
            ok: false,
            message: `history must not exceed ${MAX_HISTORY_ENTRIES} entries.`,
        };
    }

    let totalChars = 0;
    const turns: ChatTurn[] = [];

    for (let i = 0; i < history.length; i += 1) {
        const entry = history[i];
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
            return { ok: false, message: `history[${i}] must be an object.` };
        }

        const e = entry as Record<string, unknown>;
        if (e.role !== "user" && e.role !== "assistant") {
            return {
                ok: false,
                message: `history[${i}].role must be "user" or "assistant".`,
            };
        }

        if (typeof e.content !== "string") {
            return { ok: false, message: `history[${i}].content must be a string.` };
        }

        const content = sanitizeWhitespace(e.content);
        if (!content) {
            return { ok: false, message: `history[${i}].content must not be empty.` };
        }

        if (content.length > MAX_MESSAGE_CHARS) {
            return {
                ok: false,
                message: `history[${i}].content must be ${MAX_MESSAGE_CHARS} characters or fewer.`,
            };
        }

        totalChars += content.length;
        if (totalChars > MAX_TOTAL_CHARS) {
            return {
                ok: false,
                message: "Total history content exceeds the allowed size limit.",
            };
        }

        turns.push({ role: e.role as "user" | "assistant", content });
    }

    // Last entry must be from the user (the current message being sent)
    if (turns[turns.length - 1].role !== "user") {
        return { ok: false, message: "The last history entry must be from the user." };
    }

    return { ok: true, history: turns };
}

// ─── Groq call ────────────────────────────────────────────────────────────────

async function callGroq(input: {
    apiKey: string;
    model: string;
    systemPrompt: string;
    context: ChatContext;
    history: ChatTurn[];
}): Promise<string> {
    const endpoint = "https://api.groq.com/openai/v1/chat/completions";

    // Build a context-enriched system prompt
    const enrichedSystem = [
        input.systemPrompt,
        "",
        "User's temperament result context:",
        `Primary: ${input.context.primary}`,
        `Secondary: ${input.context.secondary}`,
        `Confidence: ${input.context.confidence}`,
        `Mix: Sanguine ${input.context.mix.sanguine}%, Choleric ${input.context.mix.choleric}%, Melancholic ${input.context.mix.melancholic}%, Phlegmatic ${input.context.mix.phlegmatic}%`,
        "",
        "You are in conversational chat mode. Respond naturally and conversationally (100–180 words). Do not use JSON or structured output. Ground every response in the user's temperament profile above.",
    ].join("\n");

    const messages = [
        { role: "system", content: enrichedSystem },
        ...input.history.map((turn) => ({
            role: turn.role,
            content: turn.content,
        })),
    ];

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${input.apiKey}`,
        },
        body: JSON.stringify({
            model: input.model,
            messages,
            temperature: 0.5,
            max_tokens: 400,
        }),
    });

    if (!response.ok) {
        throw { category: "upstream_http_error", status: response.status };
    }

    const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();

    if (!text) {
        throw { category: "upstream_empty_response", status: 502 };
    }

    return text;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sendError(
    res: VercelResponse,
    httpStatus: number,
    code: "BAD_REQUEST" | "RATE_LIMITED" | "UPSTREAM_ERROR",
    message: string,
) {
    return res.status(httpStatus).json({ ok: false, error: { code, message } });
}

function parseBody(raw: unknown): unknown {
    if (typeof raw === "string") return JSON.parse(raw);
    if (raw instanceof Uint8Array) return JSON.parse(Buffer.from(raw).toString("utf8"));
    return raw;
}

function sanitizeWhitespace(value: string): string {
    return value.replace(/\s+/g, " ").trim();
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
    if (typeof realIp === "string" && realIp.trim()) return realIp.trim();
    return req.socket?.remoteAddress || "unknown";
}

function isSoftRateLimited(ip: string): boolean {
    const now = Date.now();
    Array.from(softRateLimitStore.entries()).forEach(([key, entry]) => {
        if (entry.resetAt <= now) softRateLimitStore.delete(key);
    });

    const current = softRateLimitStore.get(ip);
    if (!current) {
        softRateLimitStore.set(ip, { count: 1, resetAt: now + SOFT_RATE_LIMIT_WINDOW_MS });
        return false;
    }
    if (current.resetAt <= now) {
        softRateLimitStore.set(ip, { count: 1, resetAt: now + SOFT_RATE_LIMIT_WINDOW_MS });
        return false;
    }
    if (current.count >= SOFT_RATE_LIMIT_MAX) return true;
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
    return { category: "upstream_unknown_error", status: 502 };
}

function logError(category: string, status: number) {
    console.error(`[chat] category=${category} status=${status}`);
}

function hashRateKey(ip: string): string {
    let hash = 2166136261;
    for (let i = 0; i < ip.length; i += 1) {
        hash ^= ip.charCodeAt(i);
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return `ip_${(hash >>> 0).toString(16)}`;
}
