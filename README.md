# Temperament Insight MVP

Educational web app for self-awareness using the four classic temperaments:

- Sanguine
- Choleric
- Melancholic
- Phlegmatic

This MVP is for reflection and learning, not diagnosis.

## Included Features

- Public-use assessment flow
- Test depth options: 20, 40, or 60 questions
- 240-item question bank (`T001` to `T240`) across 4 temperaments
- Dimension-based item model (3 dimensions per temperament, 20 items per dimension)
- Five-point Likert response scale (`Strongly disagree` to `Strongly agree`)
- Balanced-by-dimension sampling for each run
- Pagination with 5 questions per page via highly interactive, modern slider inputs
- Dynamic progress indicator
- In-progress assessment persistence via `localStorage`
- Reverse-scored item handling in score accumulation
- Primary and secondary temperament result output
- Reflective confidence indicator (High / Medium / Low) based on score gap
- Comprehensive, dedicated psychological profiles per temperament (`temperaments.html`)
- Rich data visualization with Temperament Mix donut charts and Score Breakdown bars
- Encoded URL Deep-Links (`#result=XYZ`) for privacy-respecting instant sharing
- Integrated Web Clipboard hooks to copy text breakdown summaries or raw share URLs
- Client-side 1080x1350 High-DPI "Share Card" PNG Generator (HTML Canvas)
- Native OS Share-Sheet pipeline injection via `navigator.share` API
- Dedicated single-click Print-to-PDF logic mapped to a raw document engine (`report.html`)
- Non-diagnostic disclaimers and growth-oriented language
- Privacy-friendly analytics hooks (Plausible)

## Out of Scope (Future Versions)

- Retake history and comparison
- Premium in-depth monetized analysis
- User Accounts / Backend Databases

## Run Locally

No build step or backend is required.

1. Open `index.html` directly in a browser, or
2. Run a local static server:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then visit `http://localhost:8000` or the provided local port.

## Project Files

- `index.html` - Marketing-style homepage
- `test-options.html` - Test-length selection and core assessment/results React-style SPA UI
- `temperaments.html` - Comprehensive tabbed reference for temperament psychology profiles 
- `report.html` - Dedicated aesthetic print layout engine for PDF exports
- `styles.css` - Unified styling system for all pages
- `app.js` - Questions, assessment flow state-machine, URL decoder, Canvas drawing script
- `report.js` - Report-specific URL payload hydration logic 
- `temperament-content.js` - Centralized static text definitions for all reading copy
