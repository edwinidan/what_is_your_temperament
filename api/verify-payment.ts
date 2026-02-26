import type { VercelRequest, VercelResponse } from "@vercel/node";
import { signPremiumJwt } from "./_lib/auth";

type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data?: {
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
    customer?: { email?: string };
  };
};

export const config = {
  runtime: "nodejs",
};

const DEFAULT_AMOUNT = Number(process.env.PAYWALL_AMOUNT_KOBO || 500);
const DEFAULT_CURRENCY = process.env.PAYWALL_CURRENCY || "USD";
const TOKEN_EXP_SECONDS = 48 * 60 * 60; // 48 hours

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: { code: "BAD_REQUEST", message: "Use POST for this endpoint." },
    });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const jwtSecret = process.env.JWT_SECRET;
  if (!secretKey || !jwtSecret) {
    return res.status(500).json({
      ok: false,
      error: { code: "UPSTREAM_ERROR", message: "Server not configured." },
    });
  }

  const parsed = parseBody(req.body);
  if (!parsed.ok) {
    return res.status(400).json({
      ok: false,
      error: { code: "BAD_REQUEST", message: parsed.message },
    });
  }

  const { reference } = parsed.data;

  let verifyData: PaystackVerifyResponse;
  try {
    verifyData = await callPaystackVerify(reference, secretKey);
  } catch (_error) {
    return res.status(502).json({
      ok: false,
      error: {
        code: "UPSTREAM_ERROR",
        message: "Could not verify payment right now. Please try again.",
      },
    });
  }

  if (!verifyData?.status || verifyData.data?.status !== "success") {
    return res.status(402).json({
      ok: false,
      error: {
        code: "PAYMENT_NOT_FOUND",
        message: verifyData?.message || "Payment not completed.",
      },
    });
  }

  const amount = Number(verifyData.data?.amount || 0);
  const currency = verifyData.data?.currency || "";
  if (amount !== DEFAULT_AMOUNT || currency !== DEFAULT_CURRENCY) {
    return res.status(402).json({
      ok: false,
      error: {
        code: "AMOUNT_MISMATCH",
        message: "Payment amount or currency did not match.",
      },
    });
  }

  const { token, payload } = signPremiumJwt({
    reference,
    amount,
    currency,
    email: verifyData.data?.customer?.email,
    jwtSecret,
    expiresInSeconds: TOKEN_EXP_SECONDS,
  });

  const expiresAtIso = new Date(payload.exp * 1000).toISOString();

  return res.status(200).json({
    ok: true,
    token,
    expires_at: expiresAtIso,
  });
}

function parseBody(
  raw: unknown,
): { ok: true; data: { reference: string } } | { ok: false; message: string } {
  let body: unknown = raw;
  try {
    if (typeof raw === "string") body = JSON.parse(raw);
    if (raw instanceof Uint8Array) body = JSON.parse(Buffer.from(raw).toString("utf8"));
  } catch (_err) {
    return { ok: false, message: "Request body must be valid JSON." };
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, message: "Request must include reference." };
  }

  const reference = (body as Record<string, unknown>).reference;
  if (typeof reference !== "string" || !reference.trim() || reference.length > 100) {
    return { ok: false, message: "reference must be a non-empty string up to 100 characters." };
  }

  return { ok: true, data: { reference: reference.trim() } };
}

async function callPaystackVerify(reference: string, secret: string): Promise<PaystackVerifyResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secret}`,
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    const json = (await response.json()) as PaystackVerifyResponse;
    return json;
  } finally {
    clearTimeout(timeout);
  }
}
