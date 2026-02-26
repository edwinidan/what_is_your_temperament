import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: { code: "BAD_REQUEST", message: "Use GET for this endpoint." },
    });
  }

  const publicKey = process.env.PAYSTACK_PUBLIC_KEY;
  if (!publicKey) {
    return res.status(500).json({
      ok: false,
      error: { code: "UPSTREAM_ERROR", message: "Payment config missing." },
    });
  }

  const amount = Number(process.env.PAYWALL_AMOUNT_KOBO || 5000);
  const currency = process.env.PAYWALL_CURRENCY || "GHS";

  return res.status(200).json({
    ok: true,
    data: {
      publicKey,
      amount,
      currency,
    },
  });
}
