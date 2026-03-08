# Temperament Insight

Temperament Insight is a static-first educational web app for self-reflection using four classic temperaments:

- Sanguine
- Choleric
- Melancholic
- Phlegmatic

It is explicitly non-clinical and not a diagnostic tool.

## Current Product Behavior

### Assessment flow
1. User starts from `index.html`.
2. CTA routes to `test-options.html#choose-depth`.
3. User selects depth: `20`, `40`, `60`, or `80` questions.
4. Questions render in one scrollable list.
5. Items unlock sequentially as answers are committed.
6. Answer commit occurs on slider release (`touchend` / `mouseup`).
7. Results render with primary + secondary temperament and confidence.

### Premium model
- Deep results sections are marked with `data-premium-lock="true"` and require premium access.
- Unlock flow uses Paystack checkout plus server-side verification.
- Successful verification returns a signed JWT stored in local storage (`temperamentInsight.premiumToken`).
- `/api/chat` and `/api/reflect` require `Authorization: Bearer <jwt>`.

### Shared-link rule (important)
- Shared URLs (`#result=...`) contain result data only.
- Premium entitlement is never embedded in the shared link.
- Premium lock/unlock is always determined by the current viewer's local token.

### AI assistant behavior
- Quick-start chips in UI: `Result Summary`, `Strengths in Action`, `Communication Prep`.
- Quick-starts currently prefill chat input and submit through `/api/chat`.
- `/api/reflect` remains implemented and protected, but is not the primary quick-start path in current UI.
- Session cap: `10` assistant replies.

### Sharing and reporting
- Copy share link
- Generate share card (canvas PNG)
- Native share (`navigator.share`)
- Printable report page (`report.html`)
- Share/report actions are inside premium-locked results actions.

## Architecture Summary

- Frontend: static HTML/CSS/JS (`index.html`, `test-options.html`, `app.js`)
- APIs: Vercel serverless Node handlers in `api/`
- Data storage: browser localStorage only
- Database: none
- Analytics: Plausible events (privacy-oriented, no app-side user accounts)

Key backend endpoints:
- `GET /api/paywall-config`
- `POST /api/verify-payment`
- `POST /api/chat` (premium JWT required)
- `POST /api/reflect` (premium JWT required)

## Local Development

### 1) Static-only preview (no serverless APIs)
Use for UI checks that do not require payment/chat APIs.

```bash
npx serve .
# or
python3 -m http.server 8000
```

### 2) Full local app (includes Vercel APIs)
Use for premium flow and AI endpoint testing.

```bash
npm install
npm run local
# equivalent: npx vercel dev
```

## Environment Variables

Create `.env.local` from `.env.example` and fill values.

Required for API-enabled behavior:

- `GROQ_API_KEY`
- `TRG_SYSTEM_PROMPT`
- `JWT_SECRET`
- `PAYSTACK_PUBLIC_KEY`
- `PAYSTACK_SECRET_KEY`

Optional:

- `GROQ_MODEL` (defaults to `llama-3.3-70b-versatile`)
- `TRG_CHAT_SYSTEM_PROMPT` (falls back to `TRG_SYSTEM_PROMPT`)
- `PAYWALL_AMOUNT_KOBO` (API default in code is `5000`; set to `2000` for 20 GHS pricing)
- `PAYWALL_CURRENCY` (defaults to `GHS`)

## Repo Map

- `index.html`: marketing entry page + test CTAs
- `test-options.html`: depth selection, assessment flow, results, paywall modal, assistant modal/FAB
- `app.js`: question logic, scoring, locking, payments, chat calls, sharing
- `report.html` / `report.js`: printable report from shared payload
- `api/paywall-config.ts`: public Paystack config
- `api/verify-payment.ts`: Paystack verification + JWT issue
- `api/chat.ts`: premium conversational chat endpoint
- `api/reflect.ts`: premium structured reflection endpoint
- `api/_lib/auth.ts`: JWT sign/verify + auth guard
- `PROJECT_REPORT.md`: implementation status and architecture notes
- `VERCEL_API_DOCUMENTATION.md`: endpoint contracts and ops notes

## Known Limitations

- No user accounts
- No purchase restore across devices/browsers
- No database persistence
- No automated integration test suite for end-to-end API + frontend flows
