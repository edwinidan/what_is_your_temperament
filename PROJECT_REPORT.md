# Temperament Insight Project Report

Date: February 21, 2026  
Project type: Static educational web app (no backend/build step)

## 1. Project Overview

Temperament Insight is a browser-based self-awareness assessment that helps users reflect on four classic temperament patterns:

- Sanguine
- Choleric
- Melancholic
- Phlegmatic

The app is positioned as educational only, not diagnostic. It uses neutral language and includes disclaimers to avoid fixed-label framing.

## 2. What the App Does

The app provides an end-to-end assessment flow:

1. User chooses a test depth: 20, 40, or 60 questions.
2. Questions are shown in pages of 5 items.
3. Each item uses a 5-point response scale.
4. User cannot continue without answering all 5 items on the page.
5. Progress is displayed and persisted locally.
6. At completion, the app calculates:
- Primary temperament
- Secondary temperament
- Confidence level (High/Medium/Low)
7. Results show:
- Short summary by default
- Optional detailed view: strengths, weaknesses, communication style

## 3. Project Structure

- `index.html`
  - Defines three main views: intro, assessment, results.
  - Contains disclaimers, depth selector, progress UI, and results containers.
- `styles.css`
  - Provides layout, responsive behavior, visual identity, and component styling.
- `app.js`
  - Contains question bank, state management, pagination, scoring, persistence, and results rendering.
- `README.md`
  - Setup and scope summary.

## 4. Core Runtime Flow

### Start

- `startAssessment()` reads selected depth and builds the question set.
- Assessment panel is shown and state is initialized.

### Question delivery

- `buildQuestionSet(depth)`:
  - Takes equal counts per temperament (`depth / 4`).
  - Interleaves temperament questions for variety.
  - Adds display ordinals.

### Page rendering

- `renderCurrentPage()`:
  - Renders exactly 5 questions.
  - Shows dynamic progress metadata.
  - Updates progress bar percentage from answered count.

### Validation guard

- `isCurrentPageComplete()` ensures all 5 visible questions are answered.
- If not complete, `goToNextPage()` shows warning and blocks advance.

### Result generation

- `scoreAssessment()` computes temperament scores.
- `renderResults()` presents primary/secondary pattern and confidence.
- `toggleDetailView()` expands/collapses detailed interpretation.

## 5. Assessment Content Logic

Question bank is grouped by temperament and includes mixed item types:

- Situational
- Behavioral
- Emotional

Each temperament has 15 authored seed questions in `QUESTION_SEEDS`.  
Depth behavior:

- 20-question mode: first 5 per temperament
- 40-question mode: first 10 per temperament
- 60-question mode: all 15 per temperament

This keeps temperament counts balanced at each depth.

## 6. Temperament Calculation Logic

The scoring model in `app.js` is centered and non-diagnostic.

### Step-by-step algorithm

1. Initialize temperament totals to zero.
2. For each answered question:
- Read raw response on a 1-5 scale.
- Convert to centered value:
  - `centered = response - 3`
  - Mapping: `1 -> -2`, `2 -> -1`, `3 -> 0`, `4 -> +1`, `5 -> +2`
- Add centered value to that question’s mapped temperament only.
3. Also track signal per temperament:
- `signal += abs(centered)` for tie handling.
4. Rank temperaments:
- Primary sort: score descending
- Tie-break 1: signal descending
- Tie-break 2: fixed temperament order in array
5. Final result:
- Primary temperament = ranked[0]
- Secondary temperament = ranked[1]

### Why this matters

- Neutral responses (`3`) add `0`, so they do not bias results.
- No cross-temperament double-counting in the current model.
- Stronger directional responses increase separation naturally.

## 7. Confidence Calculation

Confidence is derived from the gap between primary and secondary scores.

1. `topGap = primaryScore - secondaryScore`
2. `perTemperamentCount = depth / 4`
3. `maxGap = perTemperamentCount * 4`
4. `normalizedGap = topGap / maxGap`
5. Label:
- `High` if `normalizedGap >= 0.25`
- `Medium` if `normalizedGap >= 0.12`
- `Low` otherwise

This is shown as reflective guidance, not technical certainty.

## 8. Progress Persistence Logic

The app persists in-progress assessment data to `localStorage` (`STORAGE_KEY = temperamentInsight.progress.v1`):

- `selectedDepth`
- `responses`
- `currentPage`

Behavior:

- Save on answer changes and page navigation.
- Restore automatically on reload if payload is valid.
- Validate depth and response values during restore.
- Clamp page index to valid range.
- Clear stored progress on successful result render.
- Storage access is wrapped in `try/catch` to avoid runtime errors in restricted environments.

## 9. Ethics and Safety Framing

The app includes explicit non-diagnostic language in intro and results:

- “Educational reflection tool”
- “Not a medical or psychological diagnosis”
- “Temperament can change across context and growth”

Result language focuses on tendencies and adaptation, not fixed identity.

## 10. Current Scope Boundaries

Implemented:

- Public assessment flow
- 20/40/60 depth options
- Mixed question types
- 5-point scale
- 5-per-page pagination
- Progress indicator + persistence
- Primary/secondary output
- Confidence indicator
- Short + detailed results
- Disclaimers

Not implemented:

- Retake history/comparison
- Monetization/premium layers
- Backend or account system

## 11. Technical Summary

This project is a clean, dependency-light static app with deterministic client-side logic.  
Its core reliability comes from:

- strict page-completion gating
- centered scoring (`-2..+2`)
- balanced depth slicing across temperaments
- transparent but non-technical result framing
- resilient local persistence
