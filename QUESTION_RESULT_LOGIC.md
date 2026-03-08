# Question Generation and Result Logic (Current Implementation)

Last updated: March 8, 2026

This document explains how assessment and scoring logic currently work in `app.js`.

## 1. Core Constants

- `VALID_DEPTHS = [20, 40, 60, 80]`
- `TEMPERAMENTS = ["Sanguine", "Choleric", "Melancholic", "Phlegmatic"]`
- Question bank size: `240` (`T001` to `T240`)

There is no paginated `PAGE_SIZE` flow in current implementation. Questions render in one list and unlock sequentially.

## 2. Question Source and Parsing

Questions are stored in `QUESTION_BANK_CSV` and parsed into `QUESTION_BANK_ROWS`.

Each parsed question contains:

- `id`
- `temperament`
- `dimension`
- `text`
- `reverseScored`
- `scoringRule`

Derived indexes:

- `QUESTION_BY_ID`
- `QUESTION_BANK_BY_TEMPERAMENT`
- `QUESTION_BANK_BY_TEMPERAMENT_DIMENSION`

## 3. Startup Validation

`validateQuestionBank()` enforces:

- exactly `240` items
- unique IDs
- complete ID range `T001..T240`
- valid temperament values
- boolean `reverseScored`
- scoring rule equals `Likert 1-5`
- each temperament has `60` items
- each temperament has `3` dimensions with `20` items each

## 4. Question Set Generation

Function: `buildQuestionSet(depth, questionOrder)`

### 4.1 Resume-first behavior
If `questionOrder` is valid, questions are restored by saved IDs in saved order.

`questionOrder` validity:
- array
- length equals selected depth
- unique IDs
- IDs exist in `QUESTION_BY_ID`

### 4.2 Balanced temperament distribution
`perTemperament = depth / 4`

- depth 20 -> 5 per temperament
- depth 40 -> 10 per temperament
- depth 60 -> 15 per temperament
- depth 80 -> 20 per temperament

### 4.3 Dimension-balanced sampling
Within a temperament, `sampleBalancedQuestions()`:
- shuffles dimension keys
- assigns base quota + remainder spread
- samples without replacement from each dimension pool

Typical splits:
- 20-depth: `2/2/1`
- 40-depth: `4/3/3`
- 60-depth: `5/5/5`
- 80-depth: typically `7/7/6` (dimension order varies)

### 4.4 Final ordering
Selected questions are shuffled (Fisher-Yates), then assigned display ordinals.

## 5. Render and Unlock Flow

Questions are rendered as one scrollable list (`#question-page`).

Unlock rule:
- only next unanswered question unlocks
- answering a question unlocks the next card

Slider commit rule:
- visual label updates during `input`
- response is committed to state on `touchend` / `mouseup`

Assessment completion rule:
- finish button stays disabled until all questions have committed responses

## 6. Persistence and Resume

Storage key: `temperamentInsight.progress.v1`

Saved fields:
- `selectedDepth`
- `responses`
- `currentPage` (legacy field retained in state/persistence)
- `questionOrder`
- `startedAt`

Restore behavior:
- validates depth against `VALID_DEPTHS`
- validates question order
- filters responses to valid IDs and range `1..5`
- restores question set from saved order when valid

## 7. Scoring Logic

Function: `scoreAssessment()`

For each answered question:

1. centered value = `response - 3` (`-2..+2`)
2. if reverse-scored, sign is inverted
3. signed value accumulates into temperament score
4. absolute contribution accumulates into temperament signal for tie-breaks

## 8. Ranking and Confidence

Ranking order:
1. score (desc)
2. signal (desc)
3. fixed temperament order (desc tie-break fallback)

Outputs:
- `primary`
- `secondary`
- `ranked`

Confidence from normalized top-two gap:
- High: `>= 0.25`
- Medium: `>= 0.12`
- Low: otherwise

## 9. Mix Percentages (Visualization)

Mix percentages are for display/share payloads, not raw score ranking.

Process:
- transform signed scores into safe non-negative weights
- normalize to 100
- integer rounding with remainder distribution

Output totals are deterministic and sum to exactly `100`.

## 10. Result and Share Behavior

On completion:
- results render in `#results-panel`
- share payload may be encoded into URL hash (`#result=...`)

Shared-link behavior:
- share hash carries result payload only
- premium entitlement is not transferred via link
- premium lock state is applied viewer-side based on local token validity

## 11. Premium + API Touchpoints (As Implemented)

- `GET /api/paywall-config`: returns public checkout config
- `POST /api/verify-payment`: verifies payment and returns JWT
- `POST /api/chat`: premium JWT required
- `POST /api/reflect`: premium JWT required

Unauthorized API behavior:
- `401`
- error code `UNAUTHORIZED`

## 12. Known Logic Caveats

- Frontend paywall fallback values in `app.js` are `2000` + `GHS`.
- Backend API handlers default to `PAYWALL_AMOUNT_KOBO=5000` and `PAYWALL_CURRENCY=GHS` unless env values are set.
- Keep env configuration explicit to avoid amount drift.
