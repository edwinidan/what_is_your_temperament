# Temperament Insight MVP

Educational web app for self-awareness using the four classic temperaments:

- Sanguine
- Choleric
- Melancholic
- Phlegmatic

This MVP is for reflection and learning, not diagnosis.

## Included in MVP

- Public-use assessment flow
- Test depth options: 20, 40, or 60 questions
- 240-item question bank (`T001` to `T240`) across 4 temperaments
- Dimension-based item model (3 dimensions per temperament, 20 items per dimension)
- Five-point Likert response scale (`Strongly disagree` to `Strongly agree`)
- Balanced-by-dimension sampling for each run
- Pagination with 5 questions per page
- Progress indicator
- In-progress assessment persistence via `localStorage`
- Reverse-scored item handling in score accumulation
- Primary and secondary temperament result output
- Reflective confidence indicator (High / Medium / Low) based on score gap
- Short summary by default
- Optional detailed explanation:
  - strengths
  - weaknesses
  - communication style
- Non-diagnostic disclaimers and growth-oriented language

## Out of Scope (Future Versions)

- Retake history and comparison
- Premium in-depth monetized analysis

## Run Locally

No build step is required.

1. Open `index.html` directly in a browser, or
2. Run a local static server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Project Files

- `index.html` - marketing-style homepage
- `test-options.html` - test-length selection page and assessment/results UI
- `styles.css` - shared styling for homepage, selection, and assessment views
- `app.js` - question content, flow logic, scoring, and results rendering
