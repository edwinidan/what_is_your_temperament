# Temperament Insight Project Report

Date: March 8, 2026  
Project type: Static-first educational web app with Vercel serverless APIs (no database)

## 1. Executive Summary

Temperament Insight is an educational self-reflection assessment based on four classic temperaments:

- Sanguine
- Choleric
- Melancholic
- Phlegmatic

The product is explicitly non-clinical. It uses local browser storage for in-progress assessment state and serverless APIs for premium AI chat/reflections.

## 2. Current Live User Flow

1. User lands on `index.html` and clicks a test CTA.
2. User is routed to `test-options.html#choose-depth`.
3. User selects test depth: `20`, `40`, `60`, or `80` questions (`20` default).
4. Questions appear in one scrollable list and unlock sequentially as each answer is committed.
5. Sliders commit answers on `touchend` / `mouseup` (not during drag).
6. On completion, results hero is shown with primary + secondary temperament and confidence.
7. Results sections marked `data-premium-lock="true"` are premium gated.
8. If user opens AI chat without premium token, paywall modal opens.
9. User can complete Paystack checkout, then token verification unlocks premium content.
10. Share actions (copy link, card generation/download/share, report PDF) are in premium-locked UI.

## 3. Current Project Structure

- `index.html`: marketing homepage and CTA entry.
- `test-options.html`: assessment flow, premium paywall modal, chat modal/FAB, results dashboard.
- `styles.css`: all shared styles (assessment, results, modal chat, paywall, responsive behavior).
- `app.js`: question bank, scoring, assessment state machine, premium gating, chat flow, share/report generation, analytics hooks.
- `report.html` + `report.js`: printable/shareable report renderer from `#result=` payload.
- `temperaments.html` + `temperament-content.js`: educational temperament reference content.
- `api/_lib/auth.ts`: JWT signing/verification and premium auth guard.
- `api/paywall-config.ts`: returns public Paystack config (`GET`).
- `api/verify-payment.ts`: verifies Paystack reference and issues signed premium JWT (`POST`).
- `api/chat.ts`: premium-protected multi-turn chat endpoint (`POST`).
- `api/reflect.ts`: premium-protected structured reflection endpoint (`POST`).
- `vercel.json`: function timeout config for `chat` and `reflect` (30s).

## 4. Runtime Architecture

### 4.1 Client State (`app.js`)

Core client state:

- `state`: selected depth, question order, responses, timing metadata, result metadata, share state.
- `premiumState`: token + expiry for paid unlock.
- `assistantState`: chat modal state, message usage cap, chat history.

### 4.2 Assessment Engine

- 240-question bank (`T001`-`T240`), 3 dimensions per temperament.
- Depth-balanced sampling by temperament + dimension.
- Saved `questionOrder` restores exact resumed sequence.
- Sequential unlock progression with local persistence.

### 4.3 Scoring and Confidence

- Score transform per item: `response - 3` (range `-2` to `+2`).
- Reverse-scored items invert sign.
- Primary/secondary selected by score, then tie-break rules.
- Confidence derived from normalized top-two score gap.
- Mix percentages are separately normalized for visualization/share output.

### 4.4 Result Rendering

Rendered sections include:

- Hero summary (always visible)
- Profile cards, strengths/watch-outs, growth focus
- Secondary influence card
- Donut mix chart + legend
- Scenario snapshots
- Communication style cards
- Confidence meter
- AI chat entry point and result actions

Chart.js behavior:

- Loaded lazily from CDN on demand via `loadChartJs()`.
- No static `<script>` Chart.js include in `test-options.html`.

## 5. Premium Unlock + Payment Architecture

### 5.1 Frontend Paywall

- Paywall modal and overlay in `test-options.html`.
- Uses Paystack Inline (`https://js.paystack.co/v2/inline.js`).
- Flow:
  - `GET /api/paywall-config`
  - Open Paystack checkout
  - `POST /api/verify-payment` with transaction reference
  - Save JWT to `localStorage` key `temperamentInsight.premiumToken`
  - Unlock premium-locked sections and open chat

### 5.2 JWT Auth Model

- JWT payload includes payment reference, amount, currency, optional email, `iat`, `exp`.
- Token validity checked both client-side (expiry parse) and server-side (signature + expiry).
- `api/chat.ts` and `api/reflect.ts` reject missing/invalid tokens with `401 UNAUTHORIZED`.

### 5.3 Serverless Endpoints

- `GET /api/paywall-config`
  - Requires `PAYSTACK_PUBLIC_KEY`
  - Returns `{ publicKey, amount, currency }`
- `POST /api/verify-payment`
  - Requires `PAYSTACK_SECRET_KEY` and `JWT_SECRET`
  - Verifies reference with Paystack API
  - Validates amount/currency
  - Returns signed JWT + `expires_at`
- `POST /api/chat`
  - Requires premium token + Groq env
  - Validates context and chat history
  - Soft rate limit: 12 requests / 60s per hashed IP key
- `POST /api/reflect`
  - Requires premium token + Groq env
  - Structured reflection contract (JSON)
  - Soft rate limit: 12 requests / 60s per hashed IP key

## 6. AI Assistant Behavior (Current)

- UI quick-start chips: `Result Summary`, `Strengths in Action`, `Communication Prep`.
- Quick-start currently prefills chat textarea; submission goes through `/api/chat`.
- Session cap: 10 assistant replies.
- Chat history is sent to backend with validation:
  - max 20 entries
  - user message max 400 chars
  - assistant entry max 2,000 chars
  - total transcript max 8,000 chars
- Chat response style target: short conversational replies (50-80 words guidance in backend prompt).

Note: `/api/reflect` is implemented and protected but is not the primary live path for quick-starts in current UI.

## 7. Persistence, Sharing, and Reporting

Local storage keys:

- `temperamentInsight.progress.v1`: in-progress assessment state.
- `temperamentInsight.premiumToken`: premium JWT + expiry metadata.

Share/report flow:

- Results can be serialized to URL hash (`#result=...`) using validated payload schema.
- Shared URLs can hydrate results view directly.
- Share card (canvas PNG), native share, and print report (`report.html`) are generated client-side.

## 8. Analytics Inventory (Plausible)

Tracked from `app.js`:

- `assessment_started`
- `assessment_page_viewed`
- `assessment_completed`
- `assessment_abandoned`
- `confidence_tooltip_viewed`
- `ai_prompt_sent`
- `ai_chat_opened`
- `ai_limit_reached`
- `paywall_viewed`
- `checkout_started`
- `payment_successful`
- `share_link_copied`
- `shared_result_viewed`
- `retake_test_clicked`
- `share_card_generated`
- `share_card_downloaded`
- `share_card_shared`
- `share_card_pdf_downloaded`

Tracked from `report.js`:

- `report_opened`
- `report_print_clicked`

## 9. Environment Variables

Current environment usage across APIs:

- `GROQ_API_KEY`
- `GROQ_MODEL` (optional default in code)
- `TRG_SYSTEM_PROMPT`
- `TRG_CHAT_SYSTEM_PROMPT` (optional override for chat)
- `JWT_SECRET`
- `PAYSTACK_PUBLIC_KEY`
- `PAYSTACK_SECRET_KEY`
- `PAYWALL_AMOUNT_KOBO` (set to `2000` for 20 GHS in live pricing)
- `PAYWALL_CURRENCY` (default `GHS`)

## 10. Scope Status (As Of March 8, 2026)

Implemented:

- Public assessment flow with 20/40/60/80 depth options
- Sequential unlock slider UX
- Local progress persistence and resume
- Primary/secondary temperament scoring + confidence
- Results dashboard with premium-locked deep sections
- Paystack checkout + payment verification + JWT unlock
- Premium-protected `/api/chat` and `/api/reflect`
- Share URL, share card generation, native sharing, printable report page
- Privacy-oriented Plausible event instrumentation

Not implemented:

- User accounts
- Database-backed purchase restore across devices
- Historical retake comparison
- Automated integration tests for API + frontend flows

## 11. Gaps and Drift Found During This Report Update

1. Pricing alignment resolved:
- UI paywall copy and backend-configured amount now both use `20 GHS` (`2000` kobo).
- This removes the previously reported amount mismatch risk.

2. Shared-link premium enforcement resolved:
- `renderSharedResults()` now applies `applyPremiumLocks()`, so lock/unlock is based on the current viewer's token.
- Shared payloads do not carry premium entitlement.

3. Quick-start/reflection contract drift:
- Frontend quick-starts use chat-prefill path.
- `/api/reflect` supports six structured modes and remains available but not primary in current UI.

4. Legacy analytics/config references remain in code comments/constants:
- `detail_view_opened` constant exists but is not currently emitted.

5. Documentation drift outside this report:
- Some repo docs still reference older behavior (e.g., 20/40/60 only, paginated questions, Gemini-era API notes).

## 12. Recommended Next Actions

1. Decide whether to re-wire `/api/reflect` into UI or remove dead frontend reflection code paths.
2. Refresh README and API docs to remove outdated behavior/provider references.
3. Add integration tests for payment verification, premium auth, and chat error/limit flows.
