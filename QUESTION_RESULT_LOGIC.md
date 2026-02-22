# Question Generation and Result Logic

This document explains how the assessment currently works in `app.js`: how questions are generated for each test, and how results are calculated.

## 1. Core Constants

- `VALID_DEPTHS = [20, 40, 60]`
- `TEMPERAMENTS = ["Sanguine", "Choleric", "Melancholic", "Phlegmatic"]`
- `PAGE_SIZE = 5` (questions shown per page)

## 2. Question Source

Questions are defined in `QUESTION_SEEDS` by temperament.

- Each temperament has 15 seed questions.
- Each seed has:
  - `type` (`situational`, `behavioral`, `emotional`)
  - `text`

At startup, seeds are converted into `QUESTION_BANK` with:

- `id` (format: first temperament letter + index, e.g. `S-1`, `C-4`)
- `temperament` (owner of the question)

## 3. How Questions Are Generated Per Test

Function: `buildQuestionSet(depth, questionOrder)`

### 3.1 Equal distribution by temperament

`perTemperament = depth / 4`

So:

- 20-question test -> 5 per temperament
- 40-question test -> 10 per temperament
- 60-question test -> 15 per temperament

The app selects the first `perTemperament` questions from each temperament bank.

### 3.2 Random order on new tests

If there is no valid saved order, selected questions are shuffled using Fisher-Yates (`shuffleArray`).

This means each new test start gets a different question arrangement.

### 3.3 Stable order on resumed tests

If `questionOrder` is provided from localStorage and valid:

- same length as selected question count
- no duplicate IDs
- IDs map to existing selected questions

then that saved order is reused so resume behavior stays consistent.

### 3.4 Display ordinal

After ordering, each question is assigned `ordinal: index + 1` for display (`Q1`, `Q2`, etc.).

## 4. Progress Persistence (Resume Behavior)

Storage key: `temperamentInsight.progress.v1`

Saved payload includes:

- `selectedDepth`
- `responses`
- `currentPage`
- `questionOrder` (array of question IDs in active order)
- `startedAt`

On restore:

- depth is validated against `VALID_DEPTHS`
- question set is rebuilt with saved `questionOrder`
- responses are filtered to valid question IDs and numeric range `1..5`
- page index is clamped to valid bounds

## 5. Response Model

Each question is answered on a 1..5 slider.

The raw value is centered for scoring:

- `toCenteredValue(value) = value - 3`
- mapping:
  - `1 -> -2`
  - `2 -> -1`
  - `3 -> 0`
  - `4 -> +1`
  - `5 -> +2`

## 6. Result Scoring

Function: `scoreAssessment()`

For each answered question:

1. convert value to centered score
2. add to its temperament total (`scores[temperament]`)
3. add absolute contribution to temperament signal (`signal[temperament]`)

`signal` is used for tie-break strength.

## 7. Ranking Logic

Temperaments are ranked by:

1. `score` descending
2. `signal` descending (tie-break 1)
3. fixed temperament order from `TEMPERAMENTS` (tie-break 2)

Output:

- `primary` = rank 1 temperament
- `secondary` = rank 2 temperament
- full `ranked` array

## 8. Confidence Logic

Function: `getConfidenceLevel(scoreGap, depth)`

- `scoreGap = ranked[0].score - ranked[1].score`
- `maxGap = (depth / 4) * 4`
- `normalizedGap = scoreGap / maxGap`

Thresholds:

- `High` if `normalizedGap >= 0.25`
- `Medium` if `normalizedGap >= 0.12`
- `Low` otherwise

## 9. Mix Percentage Model (for Result Visuals)

Function: `buildTemperamentMixPercentages(ranked)`

This is for chart display only (not core ranking).

Steps:

1. transform each temperament score into a non-negative weight
2. normalize weights to percentages totaling ~100
3. floor values
4. distribute remainder to highest fractional parts

Result: integer percentages summing to exactly `100`.

## 10. Dominance-First Display Order

Function: `getTemperamentDisplayOrder(percentages, ranked)`

Display order for legend/chart/bars is:

1. percentage descending
2. ranked order as tie-break

Used by:

- temperament mix legend
- temperament donut chart
- score breakdown bars

## 11. Completion Rule

The user cannot move to the next page unless all questions on the current page are answered (`isCurrentPageComplete()`).

When the final page is complete:

1. scoring runs
2. results are rendered with primary/secondary/confidence
3. progress storage is cleared

