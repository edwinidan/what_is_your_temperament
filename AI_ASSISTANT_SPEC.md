# AI Assistant Spec: Temperament Reflection Guide (Current Behavior)

Last updated: March 8, 2026

## 1. Summary

`Temperament Reflection Guide` is an optional, non-clinical assistant in the results experience (`test-options.html`).

It is for educational reflection only, not diagnosis or treatment.

## 2. Placement and Availability

- Scope: Results stage only (`#results-panel`)
- Entry points:
  - inline `Open Chat` button
  - floating chat FAB
- No assistant UI on homepage, depth selection, active assessment flow, `temperaments.html`, or `report.html`

## 3. Premium Access Model

- Assistant usage is premium-gated.
- Chat open/send checks current local premium token (`temperamentInsight.premiumToken`).
- If token missing/invalid:
  - paywall modal opens
  - premium unlock is required
- Shared links never transfer premium entitlement.

## 4. Current UI Interaction Model

### 4.1 Quick-start chips in UI
Exactly three quick-start chips are shown:

1. `Result Summary`
2. `Strengths in Action`
3. `Communication Prep`

Current behavior:
- clicking a chip prefills textarea with a starter prompt
- user submits through chat
- request path is `/api/chat`

### 4.2 Free-text chat
- User types in textarea and sends.
- Full conversation history is sent to `/api/chat`.

## 5. Endpoint Roles

### `/api/chat` (primary live path)
- Premium-protected
- Conversational, short-form replies
- Uses context + history

### `/api/reflect` (implemented but not primary UI path)
- Premium-protected
- Structured reflection contract (`title`, `body`, `suggested_next`)
- Supports six reflection modes in backend validation

## 6. Limits and Validation

## 6.1 Frontend session limit
- `ASSISTANT_MAX_MESSAGES = 10`
- Counter shown as `Questions used: X / 10`

## 6.2 `/api/chat` request validation
- history required, non-empty array
- max 20 entries
- `role` must be `user` or `assistant`
- user message max 400 chars
- assistant message max 2000 chars
- total history max 8000 chars
- final history item must be `user`

## 6.3 `/api/reflect` request validation
- mode must match one of six allowed backend modes
- `user_question` optional, max 240 chars
- context required (`primary`, `secondary`, `confidence`, `mix`)
- mix sum range accepted: 99..101

## 7. Output Expectations

### `/api/chat`
- response shape: `{ ok: true, data: { body: string } }`
- backend prompt targets 50–80 words, casual conversational tone

### `/api/reflect`
- response shape:

```ts
{
  ok: true,
  data: {
    title: string;
    body: string;
    suggested_next: string[];
  }
}
```

Implementation note:
- prompt asks model for 150–200 words
- current normalization accepts 100–250 words

## 8. Safety Boundaries

Assistant must avoid:
- diagnosis or clinical labeling
- treatment/medication advice
- crisis counseling guidance
- legal/financial directives
- absolute identity/future claims

If user asks for disallowed content:
- decline briefly
- restate educational scope
- redirect to safe reflection framing

## 9. Context Contract

Both AI endpoints validate this context shape:

```ts
{
  primary: "Sanguine" | "Choleric" | "Melancholic" | "Phlegmatic";
  secondary: "Sanguine" | "Choleric" | "Melancholic" | "Phlegmatic";
  confidence: "high" | "medium" | "low";
  mix: {
    sanguine: number;
    choleric: number;
    melancholic: number;
    phlegmatic: number;
  };
}
```

`mix` is used as relative emphasis and must validate to ~100 total (`99..101`).
