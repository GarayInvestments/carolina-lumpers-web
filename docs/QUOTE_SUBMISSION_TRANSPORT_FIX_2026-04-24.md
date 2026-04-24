# Quote Submission Transport Fix (2026-04-24)

## Issue Summary

Quote requests intermittently failed to submit when the frontend posted with request modes/body formats that triggered CORS/preflight behavior not reliably handled by the Apps Script web app endpoint.

## Root Cause

- Frontend submit logic relied on request/response assumptions that do not hold for cross-origin Apps Script calls in all browsers.
- Using payload/mode combinations that are not "simple requests" can trigger preflight or blocked responses.
- In those cases, browser-side `res.ok`/JSON handling is unreliable for this endpoint pattern.

## Required Fix Pattern

Use a no-cors-safe, simple POST request with URL-encoded payload:

1. Build payload with `URLSearchParams(new FormData(form))`
2. Add metadata fields (`startedAt`, `formType`) via `payload.set(...)`
3. Submit with:
   - `method: 'POST'`
   - `mode: 'no-cors'`
   - `body: payload`
4. Do not depend on `res.ok` or response JSON in the no-cors path

## Backend Compatibility

`GoogleAppsScripts/QuoteRequestHandler/Quote_Request_Handler.js` already supports URL-encoded bodies via:

- `parseFormUrlEncoded_(e.postData.contents)`

So no backend parser change was required for this transport fix.

## Files Updated (This Fix)

- `contact.html`
- `carolina-lumpers-web-variant-a/contact.html`

## Validation Checklist

- Submit quote request on each site variant
- Confirm success message displays
- Confirm lead event tracking still fires (`generate_lead`)
- Confirm row written to Quote Requests sheet
- Confirm confirmation email flow executes

## Regression Prevention

For quote/contact form posts to Apps Script endpoints, prefer URL-encoded no-cors simple-request transport unless the endpoint is fronted by a CORS-capable proxy with explicit response-contract guarantees.