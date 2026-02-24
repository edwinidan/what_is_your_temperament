# Temperament Insight API Documentation (Vercel /api/reflect)

**Overview**
The `/api/reflect` endpoint is a Vercel Node.js serverless function that powers the Temperament Reflection Guide assistant on the results page. It accepts a reflection mode, a validated temperament context, and an optional user question. The handler injects a strict system prompt, calls the Gemini API, and normalizes the response into a stable JSON contract.

Key design decisions:
- Privacy-first: no logging of user content. Only coarse error category and status are logged.
- Strict prompt enforcement: the user prompt mandates JSON-only output with a fixed schema and length constraints.
- Soft rate limiting: best-effort in-memory limiter (per instance) to reduce abuse without persistent storage.

Architecture summary:
- Runtime: Vercel Node.js serverless function (`api/reflect.ts`).
- Upstream: Google Gemini API via `fetch`.
- Input validation: whitelist of modes, temperaments, and confidence values.
- Output normalization: parses JSON or falls back to safe text, enforces word count and safety constraints.

**Request And Response Contract**
Request (POST `/api/reflect`):
```json
{
  "mode": "Result Summary",
  "context": {
    "primary": "Sanguine",
    "secondary": "Phlegmatic",
    "confidence": "high",
    "mix": {
      "sanguine": 38,
      "choleric": 21,
      "melancholic": 17,
      "phlegmatic": 24
    }
  },
  "user_question": "How can I lean on my strengths this week?"
}
```

Success response:
```json
{
  "ok": true,
  "data": {
    "title": "Result Summary",
    "body": "150-200 word reflection body...",
    "suggested_next": [
      "What feels most energizing this week?",
      "Where could you set a gentle boundary?"
    ]
  }
}
```

Error response (examples):
```json
{
  "ok": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Mode must match one of the six allowed reflection modes."
  }
}
```

HTTP status behavior:
- `400` for validation errors.
- `429` for soft rate limiting.
- `502` for upstream or normalization failures.

**Development Setup**
Prerequisites:
- Node.js 18+ (global `fetch` support in runtime).
- Vercel CLI.

Steps:
1. Install dependencies.
```bash
npm install
```
2. Create `.env.local` from `.env.example` and provide values.
```bash
cp .env.example .env.local
```
3. Populate environment variables in `.env.local`.
- `GEMINI_API_KEY` is required.
- `GEMINI_MODEL` is optional but recommended for consistency.
- `TRG_SYSTEM_PROMPT` must contain the full system prompt text.

Optional helper to embed the prompt as a single-line value:
```bash
python3 - <<'PY'
import pathlib
prompt = pathlib.Path("TEMPERAMENT_REFLECTION_GUIDE_SYSTEM_PROMPT.txt").read_text()
escaped = prompt.replace("\\", "\\\\").replace("\n", "\\n")
print(f'TRG_SYSTEM_PROMPT="{escaped}"')
PY
```
Copy the output into `.env.local`.

4. Run the API locally with Vercel.
```bash
npx vercel dev
```

5. Test the endpoint locally.
```bash
curl -X POST http://localhost:3000/api/reflect \
  -H "Content-Type: application/json" \
  -d '{"mode":"Result Summary","context":{"primary":"Sanguine","secondary":"Phlegmatic","confidence":"high","mix":{"sanguine":38,"choleric":21,"melancholic":17,"phlegmatic":24}},"user_question":"How can I lean on my strengths this week?"}'
```

Notes:
- Running static files only (for example, `python3 -m http.server`) will not serve the `/api/reflect` function. Use `vercel dev` for local QA of the assistant.

**Problem: Local Type-Check Failure (fetch not found)**
Error (example):
```text
api/reflect.ts:114:21 - error TS2304: Cannot find name 'fetch'.
```

Root cause:
- Node 18+ includes a global `fetch` at runtime, but TypeScript does not automatically include the DOM lib definitions or Node 18 types that declare it.
- Current `tsconfig.json` uses only `lib: ["ES2020"]`, and `@types/node` is not listed in `devDependencies`.

Diagnostics:
1. Confirm Node version.
```bash
node -v
```
2. Check `tsconfig.json` for `lib` and `types`.
3. Check whether `@types/node` is installed.
```bash
npm ls @types/node
```

Solutions:
Option A (recommended): add Node types and DOM lib definitions.
- Install `@types/node` (version 18+).
- Update `tsconfig.json` to include `types: ["node"]` and `lib: ["ES2020", "DOM", "DOM.Iterable"]`.

Example `tsconfig.json` (known-good for Node 18+ fetch):
```jsonc
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "types": ["node"],
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["api/**/*"],
  "exclude": ["node_modules"]
}
```

Option B (compatibility fallback): use a polyfill or `node-fetch` and import it explicitly. This is only necessary if you must support older Node runtimes or avoid DOM lib usage.

Verification:
1. Run the TypeScript checker (or rely on editor diagnostics).
2. Confirm `fetch` is no longer reported as missing in `api/reflect.ts`.

**Related Issues And Risks**

**Assistant Response Contract Drift**
Issue:
- The user prompt requires `body` to be 150-200 words, but normalization accepts 100-250 words (`normalizeModelOutput` in `api/reflect.ts`).
Impact:
- Responses can be too short or too long, diverging from product boundaries and UX expectations.
Current mitigation:
- The user prompt sets the correct range, but enforcement is inconsistent.
Recommendations:
1. Align normalization to 150-200 words to match the prompt.
2. Update any documentation that still references the 100-250 range.
3. Add a lightweight test to assert the accepted word range.

**Model Default And Version Drift**
Issue:
- Some documentation or hardening notes mention `gemini-2.5-flash`, while the code default and `.env.example` use `gemini-2.0-flash`.
Impact:
- Unexpected cost, latency, or quality differences across environments.
Current mitigation:
- Optional `GEMINI_MODEL` env var; default is `gemini-2.0-flash`.
Recommendations:
1. Choose a single default model and update `api/reflect.ts`, `.env.example`, and any docs.
2. Consider requiring `GEMINI_MODEL` in production to avoid silent defaults.
3. Track model changes in a short changelog section.

**Environment And Deployment Config Not Yet Stabilized**
Issue:
- Runtime/config files and function code changes can drift or stay uncommitted, making local setup non-reproducible.
Impact:
- New contributors cannot reliably run or debug `/api/reflect`.
Current mitigation:
- `.env.example` and `vercel.json` exist, but completeness varies.
Recommendations:
1. Ensure `package.json`, `tsconfig.json`, `vercel.json`, `.gitignore`, and `.env.example` are committed and kept current.
2. Add a brief setup section to `README.md` pointing to this document.
3. Add a small CI check to validate `tsc` and basic linting.

**Secret-Handling Operational Risk**
Issue:
- `.env.local` contains credentials or tokens that must never be committed or logged.
Impact:
- Accidental leakage via commits, logs, or screenshots.
Current mitigation:
- `.gitignore` excludes `.env.local` and `.env` patterns.
Recommendations:
1. Reaffirm that `.env.local` is strictly local and not for sharing.
2. Use Vercel Environment Variables for deployed environments.
3. Avoid logging request bodies, prompts, or API keys.
4. Consider a pre-commit hook that blocks `.env.local` or keys.

**Local Run-Path Mismatch**
Issue:
- The assistant calls `/api/reflect`, but running only static files does not provide the serverless function.
Impact:
- Local QA of the assistant fails unless Vercel runtime is used.
Current mitigation:
- `npm run local` uses `vercel dev`.
Recommendations:
1. Update `README.md` to distinguish static-only preview vs. full local API testing.
2. Provide a fallback UI message when `/api/reflect` is unavailable.

**No Automated Integration Test Coverage**
Issue:
- No tests validate frontend-to-API flow, error handling, or word-count enforcement.
Impact:
- Higher regression risk when changing prompts, models, or validation.
Current mitigation:
- Manual testing via local calls.
Recommendations:
1. Add a minimal integration test runner that hits `/api/reflect` on `vercel dev`.
2. Include tests for bad requests, rate limiting, and upstream failures.

**Testing Strategy**
Goal: provide fast, repeatable integration coverage of the API contract and normalization.

Suggested approach:
- Use Node's built-in test runner or Jest.
- Spin up `vercel dev` in CI (or call a deployed preview URL) and run HTTP tests against `/api/reflect`.

Example test cases:
1. Successful reflection request returns `ok: true` and `data.title === mode`.
2. Missing `context` returns `400` with `BAD_REQUEST`.
3. Invalid `mode` returns `400` with `BAD_REQUEST`.
4. Soft rate limiting returns `429` after 12 requests/minute (can be tested with a shortened window in test-only mode).
5. Upstream failure returns `502` with `UPSTREAM_ERROR`.
6. Word-count validation rejects out-of-range responses (mock or stub Gemini).

Minimal test pseudo-flow:
```bash
# Start in one terminal
npx vercel dev

# Run tests in another
node --test tests/reflect.integration.test.js
```

**Reproducible Configuration**
Checklist of files to commit:
- `package.json`
- `tsconfig.json`
- `vercel.json`
- `.gitignore`
- `.env.example`
- `api/reflect.ts`
- `TEMPERAMENT_REFLECTION_GUIDE_SYSTEM_PROMPT.txt`

Sample `package.json`:
```json
{
  "name": "temperament-insight",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "local": "vercel dev",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "@vercel/node": "^3.0.0",
    "vercel": "^43.0.0",
    "typescript": "^5.0.0"
  }
}
```

Sample `tsconfig.json` (Node 18+ fetch):
```jsonc
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "types": ["node"],
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["api/**/*"],
  "exclude": ["node_modules"]
}
```

Sample `vercel.json`:
```json
{
  "functions": {
    "api/reflect.ts": {
      "maxDuration": 30
    }
  }
}
```

Sample `.env.example`:
```dotenv
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
TRG_SYSTEM_PROMPT=
```

Sample `.gitignore`:
```gitignore
node_modules/
.env.local
.env.*.local
.env
.vercel/
.vercel
```

**Operational Guidelines**
Secrets and environment variables:
- Keep `.env.local` local-only and out of version control.
- Configure `GEMINI_API_KEY`, `GEMINI_MODEL`, and `TRG_SYSTEM_PROMPT` in Vercel Environment Variables for deployed environments.
- Avoid logging user content and credentials.

Model versioning:
- Decide on a single default model and document it.
- Require `GEMINI_MODEL` in production to avoid silent drift.
- Track model changes with dates in a short changelog section.

Post-deployment verification:
1. Confirm environment variables are set in Vercel for the target environment.
2. Send a known-good request to `/api/reflect` and verify `ok: true` response.
3. Verify `body` word count and `title` match the requested mode.
4. Check Vercel logs only for error categories and status codes.

**Conclusion And Next Steps**
This document captures the current `/api/reflect` architecture, setup, and key risks. Immediate actions to stabilize the API:
1. Fix TypeScript `fetch` types by updating `tsconfig.json` and adding `@types/node`.
2. Align word-count enforcement to 150-200 words in normalization.
3. Standardize the Gemini model version across code and documentation.
4. Add a minimal integration test harness to cover the core API contract.

If you want, I can implement the configuration and code changes described above, or add the integration test harness.
