# Functional / Integration Findings — Variant A

**Date:** April 23, 2026  
**Scope:** Full codebase audit — login flow, dashboard, admin modules, backend contracts, quote form, apply form  
**Status:** Analysis only — no fixes applied yet

---

## Summary

| #   | Severity    | Area       | Issue                                                                               |
| --- | ----------- | ---------- | ----------------------------------------------------------------------------------- |
| 1   | 🔴 Critical | Login      | Successful login redirects back to login page (loop)                                |
| 2   | 🔴 Critical | Login      | `checkOfflineAccess()` called but never defined                                     |
| 3   | 🟠 High     | Admin      | `getAllWorkers` action not implemented in backend                                   |
| 4   | 🟠 High     | Admin      | Time-edit API calls missing `requesterId` — backend returns Unauthorized            |
| 5   | 🟠 High     | Admin      | View As redirects to login instead of dashboard                                     |
| 6   | 🟡 Medium   | Backend    | Role name mismatch: frontend uses `Lead`, backend checks `Supervisor`               |
| 7   | 🟡 Medium   | Admin      | `approveTimeEdit`/`denyTimeEdit` check `data.ok` but backend returns `data.success` |
| 8   | 🟢 Low      | Quote form | Success/error text uses developer-style prefixes ("SUCCESS:", "ERROR:")             |
| 9   | 🟢 Low      | Quote form | No multilingual support — English only                                              |
| 10  | 🟢 Low      | Apply form | Consent error div hardcoded in English in HTML markup (line 335)                    |

---

## 1. 🔴 Critical — Login Redirect Loop

**File:** `js/script.js` line ~1319  
**Function:** `initLoginForm()`  
**Bug:** On successful login, code does:

```javascript
window.location.href = "employeelogin.html"; // ← WRONG
```

Should be:

```javascript
window.location.href = "employeeDashboard.html";
```

Users complete login successfully and are immediately sent back to the login page. Core flow is broken.

---

## 2. 🔴 Critical — `checkOfflineAccess` Not Defined

**File:** `employeelogin.html` line ~535  
**Bug:** Calls `checkOfflineAccess()` inside the `offline` event listener. Function does not exist anywhere in the codebase — throws a `ReferenceError` every time the device goes offline on the login page.  
**Fix:** Remove the call. Offline status is already handled by `updateOfflineStatus()` which is defined and works correctly.

---

## 3. 🟠 High — `getAllWorkers` Action Not Implemented in Backend

**File:** `js/admin/clockin-manager.js` line ~43  
**Function:** `populateWorkerFilter()`  
**Bug:** Calls `?action=getAllWorkers`. This action does not exist in `CLS_EmployeeLogin_Main.js`. The request will receive a "Unknown action" error response, the worker dropdown in the admin clock-in manager will always be empty.  
**Fix options:**

- Option A: Implement `getAllWorkers` in the backend (reads Workers sheet, returns `[{id, name}]` array)
- Option B: Derive the list from the existing `action=reportAll` response, which already includes per-worker records

---

## 4. 🟠 High — Admin Time-Edit API Calls Missing `requesterId`

**File:** `js/admin/time-edit-requests.js`  
**Bug:** All three API calls omit `requesterId`, which the backend requires to authorize admin actions:

- Line ~40: `action=getTimeEditRequests` — no requesterId → backend returns Unauthorized
- Line ~117: `action=approveTimeEdit` — no requesterId → same
- Line ~139: `action=denyTimeEdit` — no requesterId → same

**Fix:** Add `requesterId=<localStorage.getItem('CLS_WorkerID')>` as query param to all three calls.

---

## 5. 🟠 High — View As Redirects to Login Instead of Dashboard

**File:** `js/admin/view-as.js` line ~59  
**Function:** `activateViewAs()`  
**Bug:**

```javascript
window.location.href = "employeelogin.html"; // ← WRONG
```

After impersonating a worker, admin is sent to the login page instead of the dashboard. Same typo pattern as Bug #1.  
**Fix:** Change to `"employeeDashboard.html"`.

---

## 6. 🟡 Medium — Role Name Mismatch: `Lead` vs `Supervisor`

**Frontend** (`js/admin/admin-tools.js`): checks `role === 'Admin' || role === 'Lead'`  
**Backend** (`CLS_EmployeeLogin_Admin.js` line ~13): checks `role !== "Admin" && role !== "Supervisor"`

Workers with role `Lead` will be denied by the `reportAll` endpoint — they can pass the frontend role guard but hit a backend Unauthorized wall.

**Fix:** Pick one name and normalize across both. Recommend changing the backend guard from `"Supervisor"` to `"Lead"` to match the frontend and the actual Workers sheet values.

---

## 7. 🟡 Medium — Approve/Deny Check Wrong Success Key

**File:** `js/admin/time-edit-requests.js`  
**Bug:** `approve()` and `deny()` handlers check `data.ok` for success, but `approveTimeEdit` and `denyTimeEdit` in the backend return `data.success`.  
**Fix:** Change `data.ok` to `data.success` in the approve and deny response handlers.

---

## 8. 🟢 Low — Quote Form: Developer-Style Message Copy

**File:** `contact.html` (inline script)  
**Bug:** User-facing success and error messages use raw developer-style text:

```
"SUCCESS: Your quote request has been submitted. We will contact you soon."
"ERROR: Unable to submit request right now. Please try again."
```

The `"SUCCESS:"` and `"ERROR:"` prefixes are not appropriate for end users.  
**Fix:** Rewrite to natural language without the prefixes, e.g.:

- Success: `"Your quote request has been submitted. We'll be in touch soon."`
- Error: `"Unable to submit right now. Please try again or call us directly."`

---

## 9. 🟢 Low — Quote Form: English Only

**File:** `contact.html`  
**Note:** The quote form has no multilingual (`data-en`/`data-es`/`data-pt`) support. All labels, placeholders, and messages are English only. The apply form is fully trilingual.  
**Decision needed:** Is the quote form intentionally English-only (B2B clients) or should it get the same i18n treatment as apply? Leaving as-is is acceptable if B2B context is English-dominant.

---

## 10. 🟢 Low — Apply Form: Consent Error Hardcoded in English

**File:** `apply.html` line ~335  
**Bug:** The consent checkbox error `<div>` is hardcoded in English in the HTML:

```html
<div class="error">You must agree before submitting.</div>
```

The JS i18n object (`APPLY_FORM_I18N`) does have `consent` error strings for en/es/pt, but the static HTML error div always shows English. JS-triggered validation errors do use i18n keys correctly — this is only the static fallback.  
**Fix:** Either remove the hardcoded text and rely on JS rendering, or localize it with `data-en`/`data-es`/`data-pt` attributes.

---

## Forms: What Checked Out Fine ✅

### Apply Form (`apply.html`)

- Submits to correct Job Application Apps Script endpoint (direct, not proxied — correct per architecture)
- Honeypot spam field present (`<div class="honeypot">`)
- `startedAt` timing hidden field — set on submit if empty (bot timing check)
- `submissionMeta` JSON appended (clientTime, timezone, device, language)
- Proper `res.json()` + `json.success` check against backend response shape
- `form.reset()` after success — clean state
- `gtag` events fired for both success and error (generate_lead / submit_error)
- Full trilingual: en/es/pt APPLY_MSGS + APPLY_FORM_I18N

### Quote Form (`contact.html`)

- Correct Apps Script endpoint for the Quote Request project (separate from EmployeeLogin proxy — acceptable)
- Client-side validation on all required fields (contactName, phone, email, facilityLocation, serviceType)
- `fetch` POST with `FormData` — correct pattern for Apps Script
- `startedAt: Date.now()` appended to FormData
- `formType: 'quote-request-basic'` label included
- `gtag` events fire for both success and error
- `submitBtn.disabled = true` after success (prevents double-submit)

---

## Recommended Fix Order

### Do First (core login is broken)

1. Fix login redirect loop (`js/script.js` line ~1319)
2. Remove `checkOfflineAccess()` call (`employeelogin.html` line ~535)

### Do Next (admin features non-functional)

3. Fix View As redirect (`js/admin/view-as.js` line ~59)
4. Add `requesterId` to time-edit API calls (`js/admin/time-edit-requests.js`)
5. Fix approve/deny `data.ok` → `data.success` key
6. Fix role name — `Supervisor` → `Lead` in backend guard

### Then (admin worker filter broken)

7. Implement `getAllWorkers` backend action or derive from `reportAll`

### Polish (low priority)

8. Clean up quote form success/error copy
9. Localize apply form consent error div
10. Decide on quote form multilingual scope

---

## Files to Touch

| File                                                         | Bugs                                       |
| ------------------------------------------------------------ | ------------------------------------------ |
| `js/script.js`                                               | #1 (login redirect)                        |
| `employeelogin.html`                                         | #2 (checkOfflineAccess)                    |
| `js/admin/view-as.js`                                        | #5 (View As redirect)                      |
| `js/admin/time-edit-requests.js`                             | #4, #7 (requesterId, data.ok)              |
| `js/admin/clockin-manager.js`                                | #3 (getAllWorkers)                         |
| `GoogleAppsScripts/EmployeeLogin/CLS_EmployeeLogin_Admin.js` | #6 (Supervisor → Lead)                     |
| `contact.html`                                               | #8, #9 (quote copy, multilingual decision) |
| `apply.html`                                                 | #10 (consent error i18n)                   |
