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
- Mixed question types: situational, behavioral, emotional
- Five-point response scale (label style varies by item type)
- Pagination with 5 questions per page
- Progress indicator
- In-progress assessment persistence via `localStorage`
- Internal weighted score accumulation
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

- `index.html` - structure and semantic sections
- `styles.css` - styling, layout, responsive behavior
- `app.js` - question content, flow logic, scoring, and results rendering
