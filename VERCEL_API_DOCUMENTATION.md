# Temperament Insight API Documentation (Vercel Serverless)

Last updated: March 8, 2026

This document describes the API behavior implemented in:

- `api/paywall-config.ts`
- `api/verify-payment.ts`
- `api/chat.ts`
- `api/reflect.ts`
- `api/_lib/auth.ts`

It is based on current repository code, not historical docs.

## 1. Architecture

- Runtime: Vercel Node.js serverless functions
- Data store: none (no database)
- Auth model for premium endpoints: JWT (`Authorization: Bearer <token>`)
- AI provider: Groq OpenAI-compatible Chat Completions API

## 2. Shared API Conventions

### Response envelope
All endpoints return JSON with either:

- success: `{ ok: true, ... }`
- error: `{ ok: false, error: { code, message } }`

### Content and caching headers
Handlers set:

- `Content-Type: application/json; charset=utf-8`
- `Cache-Control: no-store`

### Premium auth behavior
`/api/chat` and `/api/reflect` call `requirePremiumAuth()` from `api/_lib/auth.ts`.

Invalid/missing token response:

```json
{
  "ok": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Premium unlock required."
  }
}
```

HTTP status: `401`

## 3. Endpoint Reference

## 3.1 `GET /api/paywall-config`

Source: `api/paywall-config.ts`

### Purpose
Returns Paystack public configuration used by the frontend checkout flow.

### Method
- Allowed: `GET`
- Other methods: `405 BAD_REQUEST`

### Environment variables
- Required: `PAYSTACK_PUBLIC_KEY`
- Optional:
  - `PAYWALL_AMOUNT_KOBO` (code fallback: `5000`)
  - `PAYWALL_CURRENCY` (code fallback: `GHS`)

### Success response (`200`)

```json
{
  "ok": true,
  "data": {
    "publicKey": "pk_...",
    "amount": 2000,
    "currency": "GHS"
  }
}
```

### Error responses
- `405` if method is not GET
- `500 UPSTREAM_ERROR` if `PAYSTACK_PUBLIC_KEY` is missing

## 3.2 `POST /api/verify-payment`

Source: `api/verify-payment.ts`

### Purpose
Verifies Paystack transaction reference server-to-server and issues premium JWT on valid payment.

### Method
- Allowed: `POST`
- Other methods: `405 BAD_REQUEST`

### Request body

```json
{
  "reference": "paystack_reference_string"
}
```

Validation:
- `reference` must be a non-empty string
- max length: 100 chars

### Environment variables
- Required:
  - `PAYSTACK_SECRET_KEY`
  - `JWT_SECRET`
- Optional:
  - `PAYWALL_AMOUNT_KOBO` (code fallback: `5000`)
  - `PAYWALL_CURRENCY` (code fallback: `GHS`)

### Success response (`200`)

```json
{
  "ok": true,
  "token": "<signed_jwt>",
  "expires_at": "2026-03-10T12:34:56.000Z"
}
```

JWT expiry in code: `48` hours.

### Error responses
- `400 BAD_REQUEST`: invalid/missing JSON or invalid `reference`
- `402 PAYMENT_NOT_FOUND`: verification says payment not successful
- `402 AMOUNT_MISMATCH`: amount/currency differs from configured values
- `405 BAD_REQUEST`: wrong method
- `500 UPSTREAM_ERROR`: missing server env configuration
- `502 UPSTREAM_ERROR`: Paystack verification call failed

## 3.3 `POST /api/chat`

Source: `api/chat.ts`

### Purpose
Returns conversational AI replies for results-context chat.

### Method
- Allowed: `POST`
- Other methods: `405 BAD_REQUEST`

### Auth
- Requires valid premium JWT via `Authorization: Bearer <token>`
- Missing/invalid token: `401 UNAUTHORIZED`

### Request body

```json
{
  "context": {
    "primary": "Sanguine",
    "secondary": "Phlegmatic",
    "confidence": "medium",
    "mix": {
      "sanguine": 35,
      "choleric": 20,
      "melancholic": 18,
      "phlegmatic": 27
    }
  },
  "history": [
    { "role": "user", "content": "How can I communicate better this week?" }
  ]
}
```

Validation highlights:
- `context.primary|secondary` must be one of the 4 temperaments
- `context.confidence` in `high|medium|low`
- `context.mix` numbers must sum to `99..101`
- `history`:
  - array required, at least 1 entry
  - max 20 entries
  - role must be `user` or `assistant`
  - user message max 400 chars
  - assistant message max 2000 chars
  - total transcript max 8000 chars
  - last history entry must be a `user` message

### Environment variables
- Required:
  - `JWT_SECRET`
  - `GROQ_API_KEY`
  - `TRG_SYSTEM_PROMPT` (or `TRG_CHAT_SYSTEM_PROMPT`)
- Optional:
  - `GROQ_MODEL` (fallback: `llama-3.3-70b-versatile`)
  - `TRG_CHAT_SYSTEM_PROMPT` (if absent, code uses `TRG_SYSTEM_PROMPT`)

### Success response (`200`)

```json
{
  "ok": true,
  "data": {
    "body": "Short conversational response..."
  }
}
```

### Error responses
- `400 BAD_REQUEST`: input validation failure
- `401 UNAUTHORIZED`: missing/invalid premium token
- `429 RATE_LIMITED`: soft limit exceeded
- `500 UPSTREAM_ERROR`: env config missing
- `502 UPSTREAM_ERROR`: Groq failure or empty upstream response

### Rate limit
Best-effort soft limiter in-memory per function instance:
- window: `60` seconds
- max: `12` requests per hashed client IP key

Not globally shared across instances; may reset on cold start.

## 3.4 `POST /api/reflect`

Source: `api/reflect.ts`

### Purpose
Returns structured reflection output for mode/context requests.

### Method
- Allowed: `POST`
- Other methods: `405 BAD_REQUEST`

### Auth
- Requires valid premium JWT via `Authorization: Bearer <token>`
- Missing/invalid token: `401 UNAUTHORIZED`

### Request body

```json
{
  "mode": "Result Summary",
  "context": {
    "primary": "Sanguine",
    "secondary": "Phlegmatic",
    "confidence": "high",
    "mix": {
      "sanguine": 38,
      "choleric": 21,
      "melancholic": 17,
      "phlegmatic": 24
    }
  },
  "user_question": "How should I use this result this week?"
}
```

Accepted modes in code:
- `Result Summary`
- `Strengths in Action`
- `Watch-outs & Reframes`
- `7-Day Reflection Plan`
- `Communication Prep`
- `Journaling Prompts`

Validation highlights:
- `user_question` optional, max 240 chars
- context validation same as `/api/chat`
- mix sum allowed range: `99..101`

### Environment variables
- Required:
  - `JWT_SECRET`
  - `GROQ_API_KEY`
  - `TRG_SYSTEM_PROMPT`
- Optional:
  - `GROQ_MODEL` (fallback: `llama-3.3-70b-versatile`)

### Success response (`200`)

```json
{
  "ok": true,
  "data": {
    "title": "Result Summary",
    "body": "Structured reflection text...",
    "suggested_next": [
      "Optional follow-up question"
    ]
  }
}
```

### Error responses
- `400 BAD_REQUEST`: input validation failure
- `401 UNAUTHORIZED`: missing/invalid premium token
- `429 RATE_LIMITED`: soft limit exceeded
- `500 UPSTREAM_ERROR`: env config missing
- `502 UPSTREAM_ERROR`: Groq failure or output normalization failure

### Output normalization note
Code asks model for 150–200 words, but current normalization accepts `100..250` words for both JSON and fallback output paths. This is implementation truth in `api/reflect.ts`.

### Rate limit
Best-effort soft limiter in-memory per function instance:
- window: `60` seconds
- max: `12` requests per hashed client IP key

## 4. Frontend Integration Notes

Current frontend behavior in `app.js`:
- Quick-start assistant chips prefill chat input and go through `/api/chat`.
- `/api/reflect` remains implemented and callable but is not currently the primary quick-start path.
- Shared result links (`#result=...`) only carry result payload; premium access is still resolved viewer-side using local JWT state.

## 5. Local Development

### Static-only preview

```bash
npx serve .
# or
python3 -m http.server 8000
```

This will not serve `/api/*` endpoints.

### Full API-enabled local runtime

```bash
npm install
npm run local
# equivalent: npx vercel dev
```

## 6. Security and Data Notes

- No database writes are performed by these endpoints.
- Soft rate limiting stores only short-lived hashed client identifiers in memory.
- Handlers set `Cache-Control: no-store`.
- Raw request payloads are not persisted.
