# Temperament Insight Project Report

Date: February 23, 2026  
Project type: Static-first educational web app with a Vercel serverless AI proxy (no build step, no database)

## 1. Executive Summary

Temperament Insight is a browser-based educational assessment that helps users reflect on four classic temperament patterns:

- Sanguine
- Choleric
- Melancholic
- Phlegmatic

The product is intentionally non-diagnostic and includes explicit disclaimers in the assessment experience and results view.

## 2. Current User Flow (Live Behavior)

1. User lands on `index.html` (marketing homepage).
2. User clicks a CTA such as `Start Free Test`.
3. CTA opens `test-options.html#choose-depth` directly.
4. User selects assessment length: `20`, `40`, or `60` questions.
5. User starts the assessment on the same page.
6. Questions are delivered in pages of 5.
7. User cannot advance until all questions on the current page are answered.
8. Final results show primary and secondary temperament plus confidence level.
9. User can toggle detailed interpretation and optionally retake.

Notable UX update: the intermediate "Pick Your Test Length" hero step was removed; users now land directly on "Select Number of Questions."

## 3. Current Project Structure

- `index.html`
  - Marketing homepage UI and CTAs.
  - Loads Plausible analytics script in `<head>`.
  - Links directly to `test-options.html#choose-depth`.
- `test-options.html`
  - Test depth selector section (`#choose-depth`).
  - Assessment panel container (`#assessment-panel`).
  - Results panel container (`#results-panel`).
  - Back Home button and shared footer.
  - Loads Plausible analytics script in `<head>`.
  - Loads Chart.js in `<head>` for the temperament mix donut chart.
- `styles.css`
  - Shared styling system for homepage, selection screen, assessment, and results.
  - Responsive navigation, hero, card components, forms, and footer.
- `app.js`
  - Assessment data, state machine, pagination, scoring, confidence logic, persistence.
  - Privacy-friendly analytics event instrumentation.
- `AI_ASSISTANT_SPEC.md`
  - Product specification for the optional Results-page assistant ("Temperament Reflection Guide").
  - Defines scope boundaries, allowed modes, forbidden topics, limits, input constraints, and output format.
- `TEMPERAMENT_REFLECTION_GUIDE_SYSTEM_PROMPT.txt`
  - Copy-paste-ready strict system prompt for the assistant.
  - Encodes non-clinical guardrails, refusal style, prompt-injection resistance, and response structure rules.
- `api/reflect.ts`
  - Vercel serverless endpoint (`POST /api/reflect`) for Gemini-backed reflections.
  - Validates mode/context/user question payloads, applies soft rate limiting, injects system prompt from env, and returns normalized safe JSON.
- `README.md`
  - Run instructions and high-level scope.

## 4. Runtime Architecture

### 4.1 State Model

`app.js` maintains a client-side state object:

- `selectedDepth`
- `questions`
- `responses`
- `currentPage`
- `detailVisible`
- `startedAt`
- `completionTracked`
- `abandonmentTracked`
- `resultMeta`

### 4.2 Initialization

On load:

- DOM nodes are captured (`intro-panel`, `assessment-panel`, `results-panel`, controls, and result containers).
- Event listeners are attached.
- `pagehide` listener is attached for abandonment tracking.
- `restoreProgressIfAvailable()` attempts to recover an in-progress assessment.

### 4.3 Assessment Start

`startAssessment()`:

- Reads selected radio depth (`20`, `40`, `60`).
- Builds the question set.
- Resets assessment state.
- Switches visible panel from intro to assessment.
- Saves progress, scrolls to active panel.
- Fires analytics event: `assessment_started`.

### 4.4 Serverless Reflection Proxy (`/api/reflect`)

- Runs as a Vercel Node.js serverless function (`runtime = "nodejs"`).
- Uses environment variables only: `GEMINI_API_KEY`, `GEMINI_MODEL` (default `gemini-2.5-flash`), and `TRG_SYSTEM_PROMPT`.
- Enforces request contract (`mode`, `context`, optional `user_question`) and validates the context schema.
- Accepts `mix` sum rounding variance (`99-101`) while preserving relative-emphasis use.
- Applies best-effort in-memory soft rate limiting keyed by a short-lived hashed client identifier.
- Normalizes model output to `{ title, body, suggested_next }`, including a safe non-JSON fallback path when output can be validated.
- Stores no user payloads and logs only error category/status metadata.

## 5. Question Delivery and Validation

### 5.1 Question Set Construction

`buildQuestionSet(depth)`:

- Uses equal counts per temperament (`depth / 4`).
- Uses a 240-item bank (`T001`-`T240`) with 3 dimensions per temperament.
- Samples each temperament with dimension-balanced quotas (`2/2/1`, `4/3/3`, `5/5/5` by depth).
- Samples without replacement from shuffled dimension pools.
- Shuffles the final selected set for variety.
- Adds ordinal numbers for display.

Depth behavior:

- 20 mode: 5 per temperament
- 40 mode: 10 per temperament
- 60 mode: 15 per temperament

Resume behavior:

- If a valid saved `questionOrder` exists, the question set is rebuilt directly from saved IDs instead of re-sampling.

### 5.2 Pagination and Rendering

- Fixed `PAGE_SIZE = 5`.
- `renderCurrentPage()` updates heading, metadata, progress bar, and 5 question cards.
- Slider responses update labels live and persist to state/localStorage.
- Fires analytics event on page render: `assessment_page_viewed`.

### 5.3 Completion Guard

`isCurrentPageComplete()` enforces that all visible questions are answered before `Next` can proceed.

## 6. Scoring and Interpretation

### 6.1 Scoring Logic

For each response (1 to 5):

- Convert to centered value: `response - 3`.
- Mapping is `-2` to `+2`.
- If `reverseScored` is true, invert centered contribution sign before accumulation.
- Add signed contribution to that question's temperament score.
- Track absolute signal for tie handling.

Ranking:

- Primary sort: score descending
- Tie-breaker 1: signal descending
- Tie-breaker 2: fixed temperament order

Output:

- Primary temperament
- Secondary temperament

### 6.2 Confidence Logic

`normalizedGap = (primary - secondary) / maxGap` where `maxGap = (depth / 4) * 4`

- High: `>= 0.25`
- Medium: `>= 0.12`
- Low: otherwise

### 6.3 Mix Percentage Model (Results Visualization)

For results visualization only (not scoring), temperament scores are transformed into normalized percentages:

- Scores are shifted/scaled into safe non-negative weights.
- Weights are normalized to 100%.
- Integer rounding is handled with remainder distribution so totals remain exactly 100%.

Display order is dominance-first:

- Temperament Mix legend: highest percentage to lowest.
- Temperament Mix donut dataset/labels: highest to lowest.
- Score Breakdown bars: highest to lowest.

Tie handling uses ranked temperament order for stable deterministic output.

## 7. Results UX

Results panel includes:

- Hero-style primary result summary (name, tagline, short interpretation, confidence badge)
- Profile section with dynamic temperament image and growth focus
- Strengths and watch-outs lists
- Secondary influence card (name, description, key traits)
- Temperament Mix donut + legend
- Score Breakdown bars
- Communication style cards
- Confidence indicator ring
- Expandable detailed communication explanation
- Optional guided assistant module ("Temperament Reflection Guide") with collapsed default state, mode-based reflections, and session-only history
- Bottom-positioned result action controls (copy link, share card, detailed explanation toggle, retake, back home)
- Educational disclaimer

On completion:

- Fires `assessment_completed` with depth, duration, confidence level.
- Clears persisted progress.

On detailed interpretation open:

- Fires `detail_view_opened` with primary temperament.

## 8. Local Persistence and Recovery

Storage key: `temperamentInsight.progress.v1`

Persisted fields:

- `selectedDepth`
- `responses`
- `currentPage`
- `questionOrder` (question IDs in active order)
- `startedAt`

Recovery safeguards:

- Validate saved depth against allowed values.
- Validate response IDs and response range.
- Clamp current page to valid bounds.
- Fall back to current time if `startedAt` is missing/invalid.
- Handle storage errors gracefully via `try/catch`.

## 9. Design and Frontend Direction

The current UI follows a modern green/earth visual language aligned to the existing project branding, while adopting the richer results-page composition from the provided reference, implemented in pure HTML/CSS for low risk:

- Fixed translucent nav
- Gradient hero with soft animated blobs
- Card-based sections
- Unified CTA treatment
- Shared footer across pages
- Mobile-responsive behavior with no framework dependency
- Results dashboard components integrated into the same visual system

Implementation decision:

- A React/TypeScript reference folder was reviewed but not integrated to avoid introducing build tooling and dependency risk.
- Equivalent aesthetics were implemented in the existing static architecture.

## 10. Privacy-Respecting Analytics

Analytics is implemented with Plausible in a privacy-focused way:

- No analytics backend/database added.
- No user accounts.
- No PII fields collected.
- Tracking calls fail silently if blocked.

Tracked events:

1. `assessment_started`
   - `depth`
2. `assessment_page_viewed`
   - `depth`, `page_index`
3. `assessment_completed`
   - `depth`, `duration_seconds`, `confidence_level`
4. `assessment_abandoned`
   - `depth`, `last_page_index`
5. `detail_view_opened`
   - `primary_temperament`

Abandonment detection:

- Uses `pagehide` while assessment is active and not already completed.

## 11. Safety and Positioning

The product consistently frames output as educational reflection, not diagnosis. Disclaimers are present in the test experience and result page to reduce over-interpretation.

## 12. Current Scope Status

Implemented:

- Public static assessment flow
- Depth options (20/40/60)
- 240-item temperament question bank with dimension-balanced sampling
- Reverse-scored item handling in scoring
- 5-question pagination and validation gates
- Progress indicator and local persistence
- Primary/secondary result model
- Confidence labeling
- Rich results dashboard (hero/profile/mix chart/breakdown/comms/confidence)
- Dominance-first ordering in Mix and Score Breakdown sections
- Mobile result breakdown optimization (2-column cards and smaller percentage labels)
- Detailed expandable interpretation
- Optional Results-page AI reflection UX with mode-based guidance, session-only history, and non-clinical boundaries
- Vercel serverless Gemini proxy endpoint (`POST /api/reflect`) with strict validation, prompt enforcement, soft rate limiting, and safe output normalization
- Frontend integration from assistant UI to `/api/reflect` with API-first responses and controlled fallback for upstream errors
- Responsive redesign and direct-to-selection CTA flow
- Privacy-friendly product analytics events

Not implemented:

- User accounts or backend storage
- Historical retake comparison
- Monetization/premium segmentation
- Clinical/diagnostic claims or outputs

## 13. Operational Notes

- No build pipeline required.
- Run by opening `index.html` directly or via a local static server.
- Browser support relies on standard modern DOM/CSS features.
- Ensure Plausible script remains present in both HTML files for analytics continuity.
- Ensure Chart.js script remains present in `test-options.html` for donut chart rendering.
- For Vercel deployments using AI reflections, configure `GEMINI_API_KEY`, `GEMINI_MODEL`, and `TRG_SYSTEM_PROMPT`.

## 14. Version 2 Updates (Recent Enhancements)

Date: February 22 - 23, 2026

The project has undergone several significant User Experience (UX) and content upgrades to form Version 2:

### 14.1 Interactive Input Modernization (Feb 22)

- **Slider-based Question Selection:** The previous button-based inputs for question responses have been replaced with smooth, interactive slider inputs.
- **Improved Styling:** The styling of the questions and slider track has been refined to provide better visual feedback and a more engaging assessment experience. The question text is now clearly presented above the corresponding slider.

### 14.2 Comprehensive Temperament Profiles (Feb 22)

- **New Page Addition (`temperaments.html`):** A dedicated HTML page has been added to house in-depth information about each temperament.
- **Detailed Psychological Profiles:** The brief summaries for Choleric, Melancholic, and Phlegmatic temperaments have been expanded into comprehensive, detailed psychological profiles.
- **CSS Enhancements:** `styles.css` was updated to properly style these new, longer profile sections, ensuring readability and visual consistency across all temperament details.

### 14.3 Result Sharing & Exports (Feb 22 - Feb 23)

- **Encoded URL Deep-Links:** Results are now serialized into a tiny JSON payload, dynamically base64url-encoded, and attached to the browser URL hash (`#result=...`). When users click this link, the app seamlessly hydrates directly into the Results Panel without prompting a new test, acting as an instant, privacy-respecting shareable profile.
- **Clipboard Generation:** Users can quickly capture their results onto their clipboard using physical buttons mapping to the Web Clipboard API. The "Copy Result Summary" provides a human-readable text block summarizing leading temperaments, while the "Copy Share Link" copies the raw URL.
- **HTML Canvas Share Cards:** By extracting the result state, a stylish 1080x1350 High-DPI "Share Card" PNG is generated completely client-side. The image draws the temperament breakdown dynamically and overlays the personal URL.
- **Native OS Sharing Pipeline:** Extended to allow users to trigger their native device share-sheets with the generated Share Card image natively injected using the `navigator.share` API.
- **Dedicated Print-to-PDF Pipeline:** Clicking "Download PDF" leverages the active URL hash dataset and invokes a brand new standalone file (`report.html`). This cleanly renders a black-and-white optimized, physical assessment document containing full Strengths, Watch-outs, and mixed distribution details without firing a single server request, triggering the native print dialog on launch.

### 14.4 Production Readiness & Privacy (Feb 23)

- **Privacy Policy (`privacy.html`):** Created a clear, accessible privacy policy explicitly stating the app's offline-first nature, with no PII collection, no user accounts, and local-only storage.
- **Terms & Educational Disclaimer (`terms.html`):** Added clear educational terms emphasizing that the tool provides an educational framework for self-reflection and explicitly stating that it is not intended for clinical or diagnostic use.
- **Global Footer Navigation:** Added a clean footprint linking the new privacy and terms pages universally across all touchpoints (`index.html`, `test-options.html`, `temperaments.html`, and `report.html`).

### 14.5 Error Hardening & Edge-Case Safety (Feb 23)

- **`localStorage` Resilience:** Encapsulated storage operations (`setItem`, `getItem`, `removeItem`) within `try/catch` wrappers. The application degrades gracefully, functioning fully in-memory if browser storage is blocked or quota is exceeded.
- **Mid-Assessment Refresh Recovery:** State hydration is now strictly validated. The app structurally verifies saved constraints (selected depth, page numbers, answer counts). Corrupted sessions are instantly dropped, quietly returning the user to a clean homepage state.
- **URL Hash Bulletproofing:** The decoding parser now strictly verifies the shape, boundaries, and mathematical integrity of the `Mix Percentages` JSON payload returning `null` automatically upon any tampering, which triggers a silent fallback to `localStorage` recovery.
- **Defensive UI Rendering:** Sliders sanitize unexpected non-integer DOM interactions by falling back to neutral values. Built-in defaults on math equations ensure components like Chart.js or Confidence meters never encounter `NaN` division or unhandled exceptions, operating 100% crash-free.

### 14.6 Frontend Performance Tuning (Feb 23)

- **Script Offloading:** Third-party scripts like Plausible Analytics have been mapped with `defer` attributes, pushing their execution out of the critical rendering path to accelerate time-to-first-paint.
- **Debounced Save Cycles:** Rapid, continuous user interactions via the likert sliders dynamically sync with the DOM natively, but disk writes (`localStorage.setItem`) are strictly funneled through a `250ms` debouncer, stripping blocking I/O jitter from mobile scrub interactions.
- **Dynamic Dependency Injection:** `Chart.js` is no longer loaded universally in the header. Instead, the `renderTemperamentDonut()` invokes a promise-based DOM injector, lazily retrieving the script only when the dashboard opens. The loader behaves as a strict singleton to avoid duplicate network requests.
- **Asynchronous UI Yields:** Rendering the high-fidelity High-DPI Share Cards frames main-thread execution aggressively. To solve this, `requestAnimationFrame` is forced to yield execution prior to generation, permitting the interface to rapidly paint "Generating..." states without locking.
- **Slider Reflow Elimination:** `labelDisplay.innerHTML` mutations were rebuilt to exclusively utilize `textContent` combined with inline CSS variable (`--thumb-scale`) property updates during slider scrubbing. This totally mitigates heavy HTML re-parsing and layout recalculations (`getBoundingClientRect`), keeping animation streams perfectly smooth at 60fps.
- **Memory & Lifecycle Cleanup:** Deep un-mount behaviors were enforced upon restart routines (`startAssessment()`). Native memory destructors (`clearTimeout(saveProgressTimeout)` and `temperamentDonutChart.destroy()`) are explicitly fired to reliably garbage collect the active state before spawning new iterations, ensuring repeated retakes do not degrade device performance or trigger orphan network events.

### 14.7 Product Clarity & Boundary Copy (Feb 23)

- **Homepage Restructure:** Replaced generic marketing sections with explicitly engineered clarity blocks. The homepage now features a scannable "What You'll Learn" list, a precise 4-card "Who It's For" target audience breakdown, and a clean 3-step numbered "How It Works" pipeline.
- **Trust Architecture:** Integrated a strict "Privacy & Safety" UI section directly above the main call to action. This explicitly guarantees Local-only storage, No Accounts, No PII tracking, and roots the tool as an educational framework, eliminating clinical/diagnostic liability immediately for new visitors.
- **Frictionless Onboarding:** Contextual helpers were added to the depth selector (20/40/60 questions) to set depth and reflection expectations. The 60-question helper now uses educational framing: "Highest depth of insight (educational)." A "What you're getting" mini-note was positioned next to the start button to clarify the exact deliverable (primary/secondary mix chart).
- **Premium Expansion Boundaries:** The final results dashboard was upgraded with a "What to do next" actionable list to encourage sharing, and a dashed "Deep Dives (Coming Soon)" block planted inside the sticky sidebar. This establishes premium value (growth planning, conflict tips) and frames future monetization boundaries entirely without requiring gated paywalls or auth yet.

### 14.8 Results Layout & Readability Polish (Feb 23)

- **Action Controls Relocated:** Result action controls (`Copy Share Link`, `Generate Share Card`, `Show Detailed Explanation`, `Take Another Test`, `Back Home`) were moved from the sidebar to the bottom of the results section so they appear only after users review the full report content.
- **"What to do next" Bullet Stability:** The list item markup was adjusted so each bullet is treated as a single content block, preventing narrow-column per-letter wrapping and restoring normal word-level line wrapping.
- **Behavior Preserved:** Button IDs, link targets, and JavaScript bindings remained unchanged, so existing sharing, detail toggling, and navigation actions continue to work without logic changes.

### 14.9 Temperament Reflection Guide UX (Feb 23)

- **Optional Assistant Placement:** Implemented an optional assistant panel directly in `test-options.html` Results flow, positioned below the educational disclaimer and above the bottom result action controls.
- **Guided Mode-Based Interaction:** Added a collapsed-first UX that expands into exactly six reflection modes (`Result Summary`, `Strengths in Action`, `Watch-outs & Reframes`, `7-Day Reflection Plan`, `Communication Prep`, `Journaling Prompts`) with a visible 5-message session counter.
- **Stateful Frontend Logic:** Added dedicated in-memory assistant state (`assistantOpen`, `messagesUsed`, `activeMode`, `loading`, `history`) to control loading, response history, retries, and session limits.
- **Safety & Boundary Handling:** Added loading, limit, and error states (network unavailable, boundary/refusal, unexpected failure) with calm educational copy and non-clinical positioning.
- **Spec/Prompt Foundation Added:** Introduced `AI_ASSISTANT_SPEC.md` and `TEMPERAMENT_REFLECTION_GUIDE_SYSTEM_PROMPT.txt` to lock behavior, constraints, and future integration readiness before API wiring.

### 14.10 Vercel Gemini Proxy Hardening (Feb 23)

- **Serverless Endpoint Added:** Created `api/reflect.ts` with `POST /api/reflect` contract for assistant reflections on Vercel.
- **Vercel Runtime Compatibility:** Updated the handler to use official `@vercel/node` types (`VercelRequest`, `VercelResponse`) and Node runtime configuration.
- **Cost/Latency Tuning:** Lowered Gemini output budget to `maxOutputTokens: 350` (temperature kept low at `0.4`) for stable 150-200 word targets with lower overhead.
- **Formatting Resilience:** Kept strict JSON-first parsing while adding a safe fallback path that accepts non-JSON text only when it passes sanitation, word-count validation, and safety boundary checks.
- **Validation Robustness:** Relaxed `context.mix` sum acceptance to `99-101` to tolerate real-world rounding variance without weakening schema checks.
- **Privacy-Safe Error Logging:** Logging now records only coarse error category/status; no raw user content, payloads, or model output is logged.

### 14.11 Assistant UI-to-API Integration (Feb 23)

- **API-First Reflection Calls:** The Results assistant now posts mode/context payloads from `app.js` to `/api/reflect` using `fetch` (`POST`, JSON), with no frontend exposure of secrets.
- **Preserved UX States:** Existing loading state (`Thinking thoughtfully...`), mode-button disabling, history rendering, and 5-message counter behavior were preserved during integration.
- **Controlled Fallback Rule:** Local deterministic generation is retained as a fallback only when the API returns `UPSTREAM_ERROR` (including missing backend configuration), maintaining continuity without weakening boundaries.
- **Retry-Safe Error Handling:** For network failures and non-upstream API errors (`RATE_LIMITED`, `BAD_REQUEST`), the assistant shows friendly errors, does not decrement messages, and allows immediate retry by selecting a mode again.
- **Limit Integrity:** The assistant still transitions to limit state at 5 successful responses (API success and eligible fallback responses count as successful).

## 15. Data & Stats Inventory (Privacy Profile)

To maintain trust and production-safety, Temperament Insight operates with strict data minimization principles:

- **What data exists?** Only the user's answers to the assessment (values 1-5), the computed result (temperament percentages), and their current progress state.
- **Where is it stored?** Assessment progress remains local in browser `localStorage` (key: `temperamentInsight.progress.v1`), with URL hashes (`#result=...`) for deep-link sharing. The serverless proxy stores no request data and has no database layer.
- **How long does it exist?** `localStorage` is cleared immediately when the user finishes the assessment.
- **Is it identifiable?** **No persistent identifiers are collected.** We do not collect names, emails, or user accounts, and there is no backend database. The proxy uses a short-lived in-memory hashed IP key for soft rate limiting only (not persisted or logged as raw IP).
- **Analytics:** We use **Plausible Analytics**. It is cookie-less, anonymized, and tracks only aggregate events (e.g., `assessment_started`, `assessment_completed`, `report_opened`) to understand broad usage trends without tracking individual users.
