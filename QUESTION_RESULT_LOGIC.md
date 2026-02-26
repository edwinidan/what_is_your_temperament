# Question Generation and Result Logic

This document explains how the assessment currently works in `app.js`: how questions are generated for each test, and how results are calculated.

## 1. Core Constants

- `VALID_DEPTHS = [20, 40, 60]`
- `TEMPERAMENTS = ["Sanguine", "Choleric", "Melancholic", "Phlegmatic"]`
- `PAGE_SIZE = 5` (questions shown per page)

## 2. Question Source

Questions are defined in `QUESTION_BANK_CSV` and parsed at startup into `QUESTION_BANK_ROWS`.

Each question has:

- `id` (format: `T001` ... `T240`)
- `temperament`
- `dimension`
- `text` (from `item_text`)
- `reverseScored` (boolean)
- `scoringRule` (`Likert 1-5`)

Derived indexes:

- `QUESTION_BY_ID`
- `QUESTION_BANK_BY_TEMPERAMENT`
- `QUESTION_BANK_BY_TEMPERAMENT_DIMENSION`

## 3. Startup Validation

`validateQuestionBank()` runs at load time and throws on invalid data.

It validates:

- total item count is exactly `240`
- all IDs are unique
- all expected IDs `T001` through `T240` exist
- temperament is one of the four supported types
- `reverseScored` is boolean
- `scoringRule` is `Likert 1-5`
- each temperament has `60` items
- each temperament has exactly `3` dimensions with `20` items each

## 4. How Questions Are Generated Per Test

Function: `buildQuestionSet(depth, questionOrder)`

### 4.1 Resume-first restore behavior

If `questionOrder` is valid, questions are rebuilt directly by ID in that saved order.

`questionOrder` is valid when:

- it is an array
- length equals `depth`
- IDs are unique
- every ID exists in `QUESTION_BY_ID`

This prevents resume breakage when selection is randomized.

### 4.2 Balanced distribution by temperament

`perTemperament = depth / 4`

So:

- 20-question test -> 5 per temperament
- 40-question test -> 10 per temperament
- 60-question test -> 15 per temperament

### 4.3 Balanced sampling by dimension

Within each temperament:

- dimensions are shuffled
- `base = floor(perTemperament / 3)`
- `remainder = perTemperament % 3`
- each dimension receives `base`
- the first `remainder` shuffled dimensions receive `+1`
- items are sampled without replacement from each dimension pool

Resulting per-temperament dimension splits:

- 20 depth (`5`) -> `2 / 2 / 1` (dimension order varies)
- 40 depth (`10`) -> `4 / 3 / 3`
- 60 depth (`15`) -> `5 / 5 / 5`

### 4.4 Random order on new tests

After per-temperament selection, all selected items are shuffled with Fisher-Yates (`shuffleArray`).

### 4.5 Display ordinal

After ordering, each question is assigned `ordinal: index + 1` for display (`Q1`, `Q2`, etc.).

## 5. Progress Persistence (Resume Behavior)

Storage key: `temperamentInsight.progress.v1`

Saved payload includes:

- `selectedDepth`
- `responses`
- `currentPage`
- `questionOrder` (array of question IDs like `T001`)
- `startedAt`

On restore:

- depth is validated against `VALID_DEPTHS`
- question set is rebuilt with `buildQuestionSet(savedDepth, savedOrder)`
- responses are filtered to valid IDs in `1..5`
- page index is clamped to valid bounds

Legacy saved IDs not present in the new bank are ignored safely.

## 6. Response Model

Each question is answered on a 1..5 slider using Likert labels:

- Strongly disagree
- Disagree
- Neutral
- Agree
- Strongly agree

Centered score:

- `toCenteredValue(value) = value - 3`
- mapping:
  - `1 -> -2`
  - `2 -> -1`
  - `3 -> 0`
  - `4 -> +1`
  - `5 -> +2`

## 7. Reverse-Scored Contribution

For each response:

- `centered = value - 3`
- `signed = question.reverseScored ? -centered : centered`

`signed` is used for temperament score accumulation.

## 8. Result Scoring

Function: `scoreAssessment()`

For each answered question:

1. compute `signed` score (reverse-aware)
2. add to temperament total (`scores[temperament]`)
3. add absolute contribution to temperament signal (`signal[temperament]`)

`signal` is used for tie-break strength.

## 9. Ranking Logic

Temperaments are ranked by:

1. `score` descending
2. `signal` descending (tie-break 1)
3. fixed temperament order from `TEMPERAMENTS` (tie-break 2)

Output:

- `primary` = rank 1 temperament
- `secondary` = rank 2 temperament
- full `ranked` array

## 10. Confidence Logic

Function: `getConfidenceLevel(scoreGap, depth)`

- `scoreGap = ranked[0].score - ranked[1].score`
- `maxGap = (depth / 4) * 4`
- `normalizedGap = scoreGap / maxGap`

Thresholds:

- `High` if `normalizedGap >= 0.25`
- `Medium` if `normalizedGap >= 0.12`
- `Low` otherwise

## 11. Mix Percentage Model (for Result Visuals)

Function: `buildTemperamentMixPercentages(ranked)`

This is for chart display only (not core ranking).

Steps:

1. transform each temperament score into a non-negative weight
2. normalize weights to percentages totaling ~100
3. floor values
4. distribute remainder to highest fractional parts

Result: integer percentages summing to exactly `100`.

## 12. Completion Rule

The user cannot move to the next page unless all questions on the current page are answered (`isCurrentPageComplete()`).

When the final page is complete:

1. scoring runs
2. results are rendered with primary/secondary/confidence
3. progress storage is cleared

## 13. Version 2 Updates (Recent Enhancements)

Date: February 22, 2026

During the transition to Version 2, the core mathematical models, question generation algorithms, and score ranking logic *remained entirely unchanged*. 

The specific updates that touch upon the assessment flow are primarily UI-focused:

- **Response Model UI (Section 6 Update):** The interface for gathering responses was updated from discrete clickable buttons to interactive **sliders**. 
- **Underlying Likert Scale Unchanged:** Despite the visual change to sliders, the underlying data structure remains a strict 5-point Likert scale (`1` to `5`).
- **Scoring Translation Unchanged:** The mathematical translation of slider values (`toCenteredValue(value) = value - 3`) and the handling of reverse-scored items function exactly as they did in Version 1.
- **Detailed Profiles:** While not affecting the calculation logic, the `temperaments.html` page was added to offer much more comprehensive descriptions of the final results calculated by the aforementioned logic.


## 14. Paystack Premium Unlock (Version 2.1)

To support the "Premium Unlock" feature, the following changes were implemented:

### 14.1 New Environment Variables

- `PAYSTACK_PUBLIC_KEY`: Paystack public key (test or live).
- `PAYSTACK_SECRET_KEY`: Paystack secret key (test or live).
- `JWT_SECRET`: Secret for signing premium JWT tokens.
- `PAYWALL_AMOUNT_KOBO`: Amount in cents (default: `500` for $5).
- `PAYWALL_CURRENCY`: Currency code (default: `"USD"`).

### 14.2 Backend API Endpoints

- **`POST /api/verify-payment`**
  - Verifies a Paystack payment reference via Paystack's API.
  - Validates that the amount and currency match the expected values.
  - Returns a signed JWT token and `expires_at` timestamp if verification succeeds.
  - Returns `401 UNAUTHORIZED` with code `unauthorized` if verification fails.

- **`GET /api/paywall-config`**
  - Returns public configuration for the paywall modal:
    - `publicKey`
    - `amount`
    - `currency`

- **`GET /api/chat` and `GET /api/reflect`**
  - Now require a valid `Authorization: Bearer <jwt>` header.
  - Return `401 UNAUTHORIZED` with code `unauthorized` if no valid token is provided.

### 14.3 Frontend Paywall Modal

- A "Premium Unlock" button is added to the UI.
- Clicking it opens a modal that:
  - Displays the Paystack checkout inline.
  - Calls `startPaystackCheckout()` on button click.
  - Calls `verifyPayment(reference)` on successful Paystack transaction.

### 14.4 Token Management

- Premium tokens are stored in `localStorage` under the key `temperamentInsight.premiumToken`.
- Tokens are automatically validated on page load and before accessing premium features.
- Expired tokens are cleared automatically.
- The token is valid for **48 hours** from issuance.

### 14.5 Terms and Limitations

- The unlock is **per device/browser** only (no user accounts).
- Clearing storage or switching devices requires a new unlock.
- This limitation is documented in `terms.html`.

### 14.6 Plausible Events

- `paywall_viewed`
- `checkout_started`
- `payment_successful`
