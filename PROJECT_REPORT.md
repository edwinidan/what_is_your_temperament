# Temperament Insight Project Report

Date: February 21, 2026  
Project type: Static educational web app (no backend, no build step)

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
- `styles.css`
  - Shared styling system for homepage, selection screen, assessment, and results.
  - Responsive navigation, hero, card components, forms, and footer.
- `app.js`
  - Assessment data, state machine, pagination, scoring, confidence logic, persistence.
  - Privacy-friendly analytics event instrumentation.
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

## 5. Question Delivery and Validation

### 5.1 Question Set Construction

`buildQuestionSet(depth)`:

- Uses equal counts per temperament (`depth / 4`).
- Slices the per-temperament banks.
- Interleaves temperament questions for variety.
- Adds ordinal numbers for display.

Depth behavior:

- 20 mode: 5 per temperament
- 40 mode: 10 per temperament
- 60 mode: 15 per temperament

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
- Add to that question's temperament score.
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

## 7. Results UX

Results panel includes:

- Primary + secondary statement
- Short interpretation
- Confidence statement
- Expandable detailed sections:
  - strengths
  - weaknesses
  - communication style

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
- `startedAt`

Recovery safeguards:

- Validate saved depth against allowed values.
- Validate response IDs and response range.
- Clamp current page to valid bounds.
- Fall back to current time if `startedAt` is missing/invalid.
- Handle storage errors gracefully via `try/catch`.

## 9. Design and Frontend Direction

The current UI follows a modern blue-neutral visual language inspired by the provided design reference, implemented in pure HTML/CSS for low risk:

- Fixed translucent nav
- Gradient hero with soft animated blobs
- Card-based sections
- Unified CTA treatment
- Shared footer across pages
- Mobile-responsive behavior with no framework dependency

Implementation decision:

- A React/TypeScript reference folder was reviewed but not integrated to avoid introducing build tooling and dependency risk.
- Equivalent aesthetics were implemented in the existing static architecture.

## 10. Privacy-Respecting Analytics

Analytics is implemented with Plausible in a privacy-focused way:

- No backend/database added.
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
- Balanced multi-temperament question distribution
- 5-question pagination and validation gates
- Progress indicator and local persistence
- Primary/secondary result model
- Confidence labeling
- Detailed expandable interpretation
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
