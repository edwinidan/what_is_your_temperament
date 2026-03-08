# Historical / Superseded: Paystack Integration PRD

Status: Archived reference (not the live source of truth)
Original context date: February 2026

This file preserves the original planning document for premium unlock work.
Implementation has since evolved. For current behavior, use:

- `README.md` (product + setup)
- `VERCEL_API_DOCUMENTATION.md` (endpoint contracts)
- `PROJECT_REPORT.md` (architecture/status summary)

## Why this file is archived

The initial PRD was written before implementation was finalized. It includes historical assumptions (for example, earlier pricing examples and staged rollout language) that may not match current runtime defaults or production configuration.

## What remains historically useful

- Original rationale for JWT-based premium gating without a database
- Original frontend flow concept:
  - open paywall modal
  - complete Paystack checkout
  - verify payment server-side
  - receive/store JWT
- Original endpoint intent:
  - `GET /api/paywall-config`
  - `POST /api/verify-payment`
  - premium protection on `/api/chat` and `/api/reflect`

## Current implementation reminder

The live codebase (not this PRD) is authoritative for:

- exact env variables and fallbacks
- amount/currency behavior
- error codes and status codes
- frontend gating behavior
- shared-link entitlement rules

Do not treat this file as operational documentation.
