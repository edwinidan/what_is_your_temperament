import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";

export type PremiumJwtPayload = {
  ref: string;
  amount: number;
  currency: string;
  email?: string;
  iat: number;
  exp: number;
};

const BEARER_PREFIX = "Bearer ";

export function signPremiumJwt(input: {
  reference: string;
  amount: number;
  currency: string;
  email?: string;
  jwtSecret: string;
  expiresInSeconds: number;
}): { token: string; payload: PremiumJwtPayload } {
  const issuedAt = Math.floor(Date.now() / 1000);
  const exp = issuedAt + input.expiresInSeconds;

  const header = { alg: "HS256", typ: "JWT" };
  const payload: PremiumJwtPayload = {
    ref: input.reference,
    amount: input.amount,
    currency: input.currency,
    email: input.email,
    iat: issuedAt,
    exp,
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signature = hmacSha256(`${encodedHeader}.${encodedPayload}`, input.jwtSecret);

  return { token: `${encodedHeader}.${encodedPayload}.${signature}`, payload };
}

export function verifyPremiumJwt(token: string, secret: string): PremiumJwtPayload {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("invalid_format");
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSig = hmacSha256(`${encodedHeader}.${encodedPayload}`, secret);

  if (!safeCompare(signature, expectedSig)) {
    throw new Error("invalid_signature");
  }

  const header = safeJsonParse<{ alg?: string; typ?: string }>(
    base64urlDecode(encodedHeader),
  );
  if (!header || header.alg !== "HS256" || header.typ !== "JWT") {
    throw new Error("invalid_header");
  }

  const payload = safeJsonParse<PremiumJwtPayload>(base64urlDecode(encodedPayload));
  if (!payload || typeof payload.exp !== "number" || typeof payload.iat !== "number") {
    throw new Error("invalid_payload");
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    throw new Error("token_expired");
  }

  return payload;
}

export function requirePremiumAuth(
  req: VercelRequest,
  res: VercelResponse,
  jwtSecret: string,
): { ok: true; payload: PremiumJwtPayload } | { ok: false } {
  const authHeader = getAuthHeader(req);
  if (!authHeader || !authHeader.startsWith(BEARER_PREFIX)) {
    sendUnauthorized(res);
    return { ok: false };
  }

  const token = authHeader.slice(BEARER_PREFIX.length).trim();
  if (!token) {
    sendUnauthorized(res);
    return { ok: false };
  }

  try {
    const payload = verifyPremiumJwt(token, jwtSecret);
    return { ok: true, payload };
  } catch (_error) {
    sendUnauthorized(res);
    return { ok: false };
  }
}

function getAuthHeader(req: VercelRequest): string | undefined {
  const header = req.headers["authorization"] || req.headers["Authorization"];
  if (Array.isArray(header)) return header[0];
  return header as string | undefined;
}

function sendUnauthorized(res: VercelResponse) {
  res.status(401).json({
    ok: false,
    error: {
      code: "UNAUTHORIZED",
      message: "Premium unlock required.",
    },
  });
}

function hmacSha256(content: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(content)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlEncode(raw: string): string {
  return Buffer.from(raw, "utf8")
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecode(encoded: string): string {
  const pad = encoded.length % 4 === 0 ? 0 : 4 - (encoded.length % 4);
  const normalized = `${encoded}${"=".repeat(pad)}`.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function safeJsonParse<T>(input: string): T | null {
  try {
    return JSON.parse(input) as T;
  } catch (_error) {
    return null;
  }
}
