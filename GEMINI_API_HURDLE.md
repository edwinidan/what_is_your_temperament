# Gemini API Hurdle — Debugging Report

**Project:** Temperament Insight — What Is My Temperament?
**Date:** February 24, 2026
**Status:** ✅ Resolved (waiting on daily API quota reset)

---

## What Was the Problem?

The Reflection Guide assistant on the results page was not returning real AI-powered responses from the Gemini API. Instead, it was silently falling back to pre-written template responses every time.

---

## How the System Works (Simple Overview)

Here's the flow when a user clicks a Reflection Guide mode button (like "Result Summary"):

```
User clicks button
      ↓
Frontend (app.js) sends a POST request to /api/reflect
      ↓
Backend (api/reflect.ts) reads environment variables
      ↓
Backend calls Google's Gemini API with the user's temperament data
      ↓
Gemini returns an AI-generated reflection
      ↓
Backend sends it back to the frontend
      ↓
User sees the AI response
```

If any step in this chain fails, the frontend has a **fallback**: it generates a template-based response locally instead of showing an error. This is why the app appeared to "work" — but it was never actually reaching Gemini.

---

## Issues Found & Fixes Applied

### Issue 1: Missing Environment Variables (Root Cause)

**What went wrong:**
The file `.env.local` is where secret configuration lives (API keys, system prompts, etc.). This file only contained a Vercel authentication token — the three variables the API actually needs were completely missing:

- `GEMINI_API_KEY` — the key to authenticate with Google's Gemini API
- `GEMINI_MODEL` — which Gemini model to use
- `TRG_SYSTEM_PROMPT` — the instructions that tell Gemini how to behave

Without these, the backend code at line 107 of `api/reflect.ts` hits this check:

```typescript
if (!apiKey || !systemPrompt) {
    return sendError(res, 500, "UPSTREAM_ERROR",
        "Reflection service is not configured yet.");
}
```

Every single request was failing here with a 500 error.

**How it was fixed:**
Added all three variables to `.env.local`:

```
GEMINI_API_KEY="your_api_key_here"
GEMINI_MODEL=gemini-2.0-flash
TRG_SYSTEM_PROMPT="the full system prompt as a single escaped line..."
```

**Important note about TRG_SYSTEM_PROMPT:**
The system prompt is a long, multi-line text file (`TEMPERAMENT_REFLECTION_GUIDE_SYSTEM_PROMPT.txt`). But `.env` files don't support multi-line values natively. So the prompt had to be **converted to a single line** with `\n` characters replacing actual line breaks. A Python script was used to do this conversion automatically.

---

### Issue 2: Missing TypeScript Dependencies

**What went wrong:**
The API function (`api/reflect.ts`) is written in TypeScript. It uses `fetch()` to call the Gemini API. But the project was missing:

- `typescript` — the TypeScript compiler itself
- `@types/node` — type definitions that tell TypeScript about Node.js built-in features like `fetch()`

Without these, TypeScript could fail to compile the API function, blocking deployment.

**How it was fixed:**
Updated `package.json` to add the missing dependencies:

```diff
  "devDependencies": {
+   "@types/node": "^18.0.0",
    "@vercel/node": "^3.0.0",
+   "typescript": "^5.0.0",
    "vercel": "^43.0.0"
  }
```

Then ran `npm install` to install them.

---

### Issue 3: Incomplete TypeScript Configuration

**What went wrong:**
The `tsconfig.json` file (which controls how TypeScript compiles your code) was missing configuration needed for `fetch()` to be recognized. Specifically:

- The `lib` array only had `"ES2020"` — it was missing `"DOM"` and `"DOM.Iterable"` which define browser-like APIs including `fetch()`, `Response`, `AbortController`, etc.
- The `types` array was missing entirely — it needed `["node"]` to include Node.js type definitions.

**How it was fixed:**
Updated `tsconfig.json`:

```diff
  "lib": [
      "ES2020",
+     "DOM",
+     "DOM.Iterable"
  ],
+ "types": [
+     "node"
+ ],
```

After this fix, running `npx tsc --noEmit` (TypeScript's type checker) passed with **zero errors**.

---

### Issue 4: Expired Vercel CLI Authentication

**What went wrong:**
The `VERCEL_OIDC_TOKEN` stored in `.env.local` had expired. This token is used by the Vercel CLI to authenticate when running `vercel dev` (the local development server). With an expired token, `vercel dev` refused to start:

```
Error: The specified token is not valid. Use `vercel login` to generate a new token.
```

**How it was fixed:**
1. Removed the expired `VERCEL_OIDC_TOKEN` from `.env.local`
2. Ran `npx vercel login` and selected "Continue with Email"
3. Entered the account email (`edwinidan07@gmail.com`)
4. Verified via the confirmation email sent by Vercel
5. Ran `npx vercel link` to re-link the local project to the Vercel project

---

### Issue 5: Vercel Dev Not Loading `.env.local`

**What went wrong:**
Even after setting up `.env.local` correctly, `vercel dev` was not passing the environment variables to the serverless function. The API kept returning "Reflection service is not configured yet."

This appears to be a quirk with Vercel CLI v43 — it was not loading `.env.local` as expected.

**How it was fixed:**
Copied `.env.local` to `.env` (same content, different filename):

```bash
cp .env.local .env
```

After this, `vercel dev` correctly loaded the variables and the API function could read them via `process.env`.

---

### Issue 6: Gemini API Free Tier Quota Exhausted

**What went wrong:**
After all configuration issues were fixed, the API function successfully called Gemini — but Google returned a **429 error** (Too Many Requests):

```
Quota exceeded for metric: generate_content_free_tier_requests
limit: 0, model: gemini-2.0-flash
```

The free tier has a daily request limit. This project's API key had used up its entire daily allowance.

**How it was fixed:**
This is a temporary issue. Options:
1. **Wait until tomorrow** — the daily quota resets automatically (midnight Pacific time)
2. **Enable billing** on the Google Cloud project for higher limits
3. **Generate a new API key** from a different project

---

## Verification

After all fixes, here's what the server log showed:

```
[reflect] category=upstream_http_error status=429
```

This confirms:
- ✅ Environment variables are loading correctly
- ✅ The API function compiles and runs
- ✅ The function successfully calls the Gemini API
- ✅ The only remaining issue is the temporary 429 quota limit

Before the fixes, the log showed:
```
[reflect] category=missing_env_configuration status=500
```

---

## For Vercel Deployment

To make the API work on the live deployed site (not just locally), set these environment variables in the **Vercel Dashboard**:

1. Go to your project on [vercel.com](https://vercel.com)
2. Navigate to **Settings → Environment Variables**
3. Add these three variables:

| Variable | Value |
|---|---|
| `GEMINI_API_KEY` | Your API key from Google AI Studio |
| `GEMINI_MODEL` | `gemini-2.0-flash` |
| `TRG_SYSTEM_PROMPT` | Full text from `TEMPERAMENT_REFLECTION_GUIDE_SYSTEM_PROMPT.txt` |

4. Redeploy the project for changes to take effect

---

## Files Changed

| File | What Changed |
|---|---|
| `tsconfig.json` | Added DOM lib, DOM.Iterable, and node types |
| `package.json` | Added typescript and @types/node dependencies |
| `.env.local` | Added GEMINI_API_KEY, GEMINI_MODEL, TRG_SYSTEM_PROMPT; removed expired OIDC token |
| `.env` | Created as copy of `.env.local` for vercel dev compatibility |

---

## Lessons Learned

1. **Always check environment variables first.** A missing `.env` variable is one of the most common reasons an API call fails silently.
2. **Fallback logic can hide real errors.** The app's built-in fallback responses made it look like everything was working, when the API was actually failing every time.
3. **Multi-line values in `.env` files need escaping.** Long text like system prompts must be converted to a single line with `\n` escape characters.
4. **Vercel CLI quirks exist.** Sometimes `.env.local` doesn't load as expected — having a `.env` file as backup helps.
5. **Free tier quotas can run out.** Always check your API usage dashboard if you get unexpected 429 errors.
