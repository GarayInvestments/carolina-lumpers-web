# Quote Form — Improvement Plan

**File:** `contact.html`  
**Date:** April 23, 2026  
**Status:** Planned — not started

---

## Issues to Fix

### 1. 🔴 API Endpoint — Workspace-Scoped URL (Verify First)

**Current:**

```javascript
var API_BASE =
  "https://script.google.com/a/macros/carolinalumpers.com/s/AKfycbwWsIE5HwHzfZX2V6kh8SvUXZMhthPeEY3I1p0oGbdU3tp3-T6Q7tgEEgLJ-p9VZu1o/exec";
```

The `/a/macros/carolinalumpers.com/` path is a **Google Workspace-scoped URL**. External visitors (not signed into a carolinalumpers.com Google account) may be redirected to a Google login wall instead of reaching the script.

**Compare with apply form (correct public URL):**

```javascript
action = "https://script.google.com/macros/s/AKfycbxdD80YrBa6wa271_.../exec";
```

**Action:**

1. Open the Quote Request Apps Script project in Google Apps Script
2. Go to Deploy → Manage Deployments
3. Confirm "Who has access" is set to **Anyone** (not "Anyone in carolinalumpers.com")
4. If deploy is scoped to org, redeploy as public
5. Update `API_BASE` in `contact.html` to use the standard `/macros/s/` path (no `/a/`)

**Risk:** High — external B2B leads may be silently failing right now.

---

### 2. 🟠 Add Spam Protection — Honeypot + Timing

Apply form has both; quote form has neither. Bots can spam the form with no friction.

**Add to `<form id="basicQuoteForm">`:**

```html
<!-- Timing: set on page load -->
<input type="hidden" name="startedAt" id="startedAt" value="" />

<!-- Honeypot: hidden from real users, filled by bots -->
<div
  class="honeypot"
  aria-hidden="true"
  style="display:none !important; position:absolute; left:-9999px;"
>
  <label for="hp_website">Leave this blank</label>
  <input
    type="text"
    id="hp_website"
    name="website"
    tabindex="-1"
    autocomplete="off"
  />
</div>
```

**Set `startedAt` on page load (inline script):**

```javascript
document.getElementById("startedAt").value = String(Date.now());
```

**Backend can then check:**

- `website` field is non-empty → reject as bot
- `Date.now() - startedAt < 3000` → reject as bot (submitted too fast)

---

### 3. 🟡 Fix Success/Error Message Copy

**Current (developer-style, not user-facing):**

```javascript
successMsg.textContent =
  "SUCCESS: Your quote request has been submitted. We will contact you soon.";
// ...
successMsg.textContent =
  "ERROR: Unable to submit request right now. Please try again.";
```

**Replace with:**

```javascript
successMsg.textContent =
  "Your quote request has been submitted. Our team will follow up with you shortly.";
// ...
successMsg.textContent =
  "Unable to submit right now. Please try again or call us at (828) 781-0002.";
```

---

### 4. 🟡 Fix Button Re-Enable on Error

**Current bug:** `submitBtn.disabled = true` is set on submit but only re-enabled in the `catch` block's error path. If submission succeeds, the button stays permanently disabled and the user can't re-submit (e.g., if they want to send a second inquiry).

**Current flow:**

```javascript
submitBtn.disabled = true; // set on submit
// success path: never re-enabled ← BUG
// catch path: submitBtn.disabled = false; ← only on error
```

**Fix:** Add `submitBtn.disabled = false` in the success path after showing the success message. (Or leave it disabled on success intentionally and add `form.reset()` — see item 5.)

---

### 5. 🟡 Add `form.reset()` on Success

After a successful submission the form fields stay populated. Apply form calls `form.reset()` after success. Add the same here so the form is clean after submission.

```javascript
// After successMsg is shown:
form.reset();
document.getElementById("startedAt").value = String(Date.now()); // reset timing too
```

---

### 6. 🟡 Add Missing Fields — Volume and Start Date

The `details` textarea currently hints at these but they're optional freeform. Making them structured fields improves the quality of leads you receive.

**Add to the `grid grid-2` section:**

```html
<div class="field">
  <label for="estimatedVolume">Estimated Volume</label>
  <select id="estimatedVolume" name="estimatedVolume">
    <option value="">Select range...</option>
    <option value="1-5 loads/week">1–5 loads/week</option>
    <option value="6-15 loads/week">6–15 loads/week</option>
    <option value="16+ loads/week">16+ loads/week</option>
    <option value="One-time / Project">One-time / Project</option>
    <option value="Not sure">Not sure yet</option>
  </select>
</div>

<div class="field">
  <label for="preferredStartDate">Preferred Start Date</label>
  <input id="preferredStartDate" name="preferredStartDate" type="date" />
</div>
```

---

### 7. 🟡 Add Phone Placeholder

The phone input has no placeholder. All other text inputs on the form have one. Minor polish but consistent.

```html
<!-- Before -->
<input id="phone" name="phone" type="tel" autocomplete="tel" required />

<!-- After -->
<input
  id="phone"
  name="phone"
  type="tel"
  autocomplete="tel"
  required
  placeholder="(xxx) xxx-xxxx"
/>
```

---

### 8. 🟢 Improve "Additional Support" Service Option Label

**Current options:**

```
Inbound Services
Outbound Services
Floor-Loaded Freight
Additional Support       ← vague
```

**Suggested:**

```
Inbound Services
Outbound Services
Floor-Loaded Freight
Overflow / Surge Support
Other
```

---

### 9. 🟢 Add `formType` to Submission Payload

The apply form appends `formType: 'careers-application'` and `submissionMeta` JSON to help the backend route and tag records. The quote form appends `formType: 'quote-request-basic'` already — but it does not include `submissionMeta`.

**Add to the `FormData` build block:**

```javascript
fd.append(
  "submissionMeta",
  JSON.stringify({
    clientTime: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    device: navigator.userAgent.includes("Mobile") ? "mobile" : "desktop",
  }),
);
```

---

## Fix Order / Checklist

- [ ] **1. Verify API endpoint** — check Apps Script deploy settings, update URL if needed
- [ ] **2. Add honeypot + startedAt** — HTML fields + page-load timing init
- [ ] **3. Fix success/error copy** — remove "SUCCESS:" / "ERROR:" prefixes, add phone in error
- [ ] **4. Fix button re-enable** — add `submitBtn.disabled = false` in success path
- [ ] **5. Add `form.reset()`** — clear fields after successful submit
- [ ] **6. Add Volume + Start Date fields** — structured dropdowns in the grid
- [ ] **7. Add phone placeholder** — `(xxx) xxx-xxxx`
- [ ] **8. Update service option** — replace "Additional Support" with clearer label
- [ ] **9. Add `submissionMeta`** — append to FormData on submit

---

## Files to Edit

| File                               | Changes                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------- |
| `contact.html`                     | All 9 items above (HTML + inline script)                                        |
| Google Apps Script (Quote project) | Verify deploy access setting (item 1) — done in GAS dashboard, not in this repo |
