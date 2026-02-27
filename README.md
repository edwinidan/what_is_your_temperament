# Temperament Insight MVP

Educational web app for self-awareness using the four classic temperaments:

- Sanguine
- Choleric
- Melancholic
- Phlegmatic

This MVP is for reflection and learning, not diagnosis.

## Included Features

- Public-use assessment flow
- Test depth options: 20, 40, or 60 questions
- 240-item question bank (`T001` to `T240`) across 4 temperaments
- Dimension-based item model (3 dimensions per temperament, 20 items per dimension)
- Five-point Likert response scale (`Strongly disagree` to `Strongly agree`)
- Balanced-by-dimension sampling for each run
- Pagination with 5 questions per page via highly interactive, modern slider inputs
- Dynamic progress indicator
- In-progress assessment persistence via `localStorage`
- Reverse-scored item handling in score accumulation
- Primary and secondary temperament result output
- Reflective confidence indicator (High / Medium / Low) based on score gap
- Comprehensive, dedicated psychological profiles per temperament (`temperaments.html`)
- Rich data visualization with Temperament Mix donut charts and Score Breakdown bars
- Encoded URL Deep-Links (`#result=XYZ`) for privacy-respecting instant sharing
- Integrated Web Clipboard hooks to copy text breakdown summaries or raw share URLs
- Client-side 1080x1350 High-DPI "Share Card" PNG Generator (HTML Canvas)
- Native OS Share-Sheet pipeline injection via `navigator.share` API
- Dedicated single-click Print-to-PDF logic mapped to a raw document engine (`report.html`)
- Non-diagnostic disclaimers and growth-oriented language
- Privacy-friendly analytics hooks (Plausible)
- Paystack-gated AI assistant (reflections + 10-turn chat) using Groq (`llama-3.3-70b-versatile`), unlocked via a 48h JWT stored in `localStorage`

## Out of Scope (Future Versions)

- Retake history and comparison
- Restore-purchase flow or multi-device unlock (premium is device/browser-scoped today)
- Automated integration tests for assistant/paywall
- User Accounts / Backend Databases

## Run Locally

Static assessment and sharing work without a backend; the AI assistant + paywall require the Vercel serverless functions.

Assessment-only (no assistant/paywall):

1. Open `index.html` directly in a browser, or
2. Run a local static server:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then visit `http://localhost:8000` or the provided local port.

Assistant + Paywall (requires serverless + env vars):

```bash
npm install
npm run local   # runs `vercel dev` with the API routes
```

Make sure the environment variables below are loaded (e.g., via `.env.local`).

## Environment Variables (minimum)

- `GROQ_API_KEY` (required for `/api/reflect` + `/api/chat`)
- `GROQ_MODEL` (optional, default `llama-3.3-70b-versatile`)
- `TRG_SYSTEM_PROMPT` (structured reflections)  
  `TRG_CHAT_SYSTEM_PROMPT` (optional; falls back to `TRG_SYSTEM_PROMPT`)
- `PAYSTACK_PUBLIC_KEY`
- `PAYSTACK_SECRET_KEY`
- `JWT_SECRET`
- `PAYWALL_AMOUNT_KOBO` (default `5000`)
- `PAYWALL_CURRENCY` (default `GHS`)

Tip: keep the displayed price/currency in `test-options.html` aligned with `PAYWALL_AMOUNT_KOBO`/`PAYWALL_CURRENCY` to avoid checkout mismatches.

## API Endpoints (Vercel)

- `POST /api/reflect` — structured reflections (requires `Authorization: Bearer <premium-jwt>`)
- `POST /api/chat` — free-form chat replies (Bearer required)
- `GET /api/paywall-config` — Paystack public key, amount, currency for inline checkout
- `POST /api/verify-payment` — server-to-server Paystack verification; returns `{ token, expires_at }`

## Project Files

- `index.html` - Marketing-style homepage
- `test-options.html` - Test-length selection and core assessment/results React-style SPA UI
- `temperaments.html` - Comprehensive tabbed reference for temperament psychology profiles 
- `report.html` - Dedicated aesthetic print layout engine for PDF exports
- `styles.css` - Unified styling system for all pages
- `app.js` - Questions, assessment flow state-machine, URL decoder, Canvas drawing script
- `report.js` - Report-specific URL payload hydration logic 
- `temperament-content.js` - Centralized static text definitions for all reading copy
