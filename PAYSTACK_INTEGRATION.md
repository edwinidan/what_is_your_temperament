This is a massive step for Temperament Insight! Writing a Product Requirements Document (PRD) before you write the code is exactly how professional computer engineers tackle new features. It keeps the scope locked down so you don't get lost in the weeds.

Here is a detailed, beginner-friendly PRD tailored specifically to your static-first, Vercel-backed architecture.

---

# Product Requirements Document: Premium AI Unlock

## 1. Executive Summary

**Objective:** Monetize the existing "Temperament Reflection Guide" (the AI Chat and Reflection features) by introducing a one-time payment wall, while strictly maintaining the application's static-first, database-free architecture.
**Monetization Strategy:** A single, one-time flat fee (e.g., 50 GHS) processed via Paystack.
**Value Proposition:** Users take the 20/40/60 question assessment for free to see their core mix, but must pay to unlock deep-dive AI reflections and unlimited contextual chat for that session.

## 2. Core User Flow (The "Happy Path")

1. User completes the assessment and views the free Results Panel.
2. User clicks the "Open Chat" floating action button (FAB) or "Deep Dives" inline CTA.
3. Instead of the AI modal opening immediately, a clean **Premium Unlock Modal** appears, explaining the value of the AI guide and displaying the price.
4. User clicks "Unlock Now."
5. The Paystack Inline checkout iframe opens over the page.
6. User completes payment successfully (via Card, Mobile Money, etc.).
7. The Paystack iframe closes, and the UI shows a "Verifying Payment..." loading state.
8. The frontend pings a new Vercel endpoint to verify the transaction.
9. Upon successful verification, a secure token is saved to the browser's `localStorage`.
10. The AI Chat modal unlocks and opens natively, allowing the user to send prompts.

## 3. Technical Architecture & Security

Since there is no backend database to store "User X has paid," we will use **JSON Web Tokens (JWT)**.

* **The Lock:** `/api/reflect` and `/api/chat` will be updated to reject any request that doesn't include a valid JWT.
* **The Key Maker:** A new Vercel endpoint (`/api/verify-payment.ts`) will securely talk to the Paystack API. If Paystack confirms the money was received, this endpoint creates and signs a JWT and sends it back to the browser.
* **The Wallet:** The frontend (`app.js`) will store this JWT in `localStorage` (e.g., `temperamentInsight.premiumToken`) and attach it to all future AI requests.

## 4. Scope of Work (New & Modified Files)

### A. Frontend Updates (`test-options.html` & `app.js`)

* **Dependency:** Add the Paystack Inline JS script to the `<head>`.
* **UI Components:** * Create a "Premium Paywall" UI state for the chat modal.
* Add a "Verifying Payment..." spinner UI.


* **State Management:** Update `app.js` to check for `localStorage.getItem('premiumToken')` before attempting to open the AI chat.
* **Payment Logic:** Implement `PaystackPop.setup()` triggered by the CTA buttons.

### B. Backend Updates (Vercel Serverless Functions)

| Endpoint | Action Required | Description |
| --- | --- | --- |
| `POST /api/verify-payment` | **NEW** | Receives a `reference` string from the frontend. Calls Paystack API securely using a secret environment variable. If valid, signs and returns a JWT. |
| `POST /api/reflect` | **MODIFY** | Add middleware to check the request headers for a valid JWT before forwarding the prompt to Groq. Return `401 Unauthorized` if missing/invalid. |
| `POST /api/chat` | **MODIFY** | Add the exact same JWT verification middleware as above to protect the conversational endpoint. |

### C. Environment Variables (Vercel Dashboard)

* `PAYSTACK_SECRET_KEY`: To communicate securely with Paystack.
* `JWT_SECRET`: A random, long string used to cryptographically sign the tokens so users can't forge them.

## 5. Edge Cases & Risk Mitigation

* **Storage Clearing:** If a user pays, closes the browser, and clears their `localStorage`, they will lose their token and have to pay again. *Mitigation:* The "Terms" page must explicitly state that this is a single-session/device unlock, matching your current offline-first privacy model.
* **Fake Success Responses:** A user might try to spoof the Paystack success callback in the browser console. *Mitigation:* The Vercel `/api/verify-payment` endpoint prevents this by doing a server-to-server check directly with Paystack.
* **Token Expiry:** The JWT should be set to expire (e.g., after 24 or 48 hours) to prevent users from copying their token and sharing it online for others to use for free.
* **Dropped Connection / Verification Failure:** If the user pays but loses connection before the frontend receives the JWT. *Mitigation:* Potentially implement a simple "Restore Purchase" fallback later if needed, allowing users to verify a past payment via their email address.

## 6. Analytics Integration (Plausible)

Add the following new tracking events to monitor conversion rates:

* `paywall_viewed`: Fired when the premium prompt appears.
* `checkout_started`: Fired when the Paystack iframe opens.
* `payment_successful`: Fired when Vercel successfully verifies the transaction.

## 7. Environments and Rollout

We will adopt a phased rollout to ensure safety and correctness:

* **Phase 1: Test Environment:** Build and verify the entire payment flow using **Paystack Test Keys**. This allows us to use test credit cards without spending real money.
* **Phase 2: Production Release:** Once verified and fully functional, we will switch out the Vercel Environment Variables to **Live Keys**, set the specific real price (e.g., 50 GHS), and start accepting real transactions.

---

This document gives you a complete roadmap. You can literally check these items off one by one as you code.

Would you like me to generate the Vercel backend code for the new `/api/verify-payment.ts` endpoint next, or would you prefer to start by building the "Premium Paywall" UI in your HTML/CSS?
