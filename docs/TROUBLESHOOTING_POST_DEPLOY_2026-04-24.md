# Post-Deploy Troubleshooting — April 24, 2026

**Deployed commit:** `827f22d` — feat: replace website with variant-a design  
**Live site:** https://carolinalumpers.com

---

## Issue Tracker

| # | Severity | Area | Issue | Status |
|---|----------|------|-------|--------|
| 1 | 🔴 Critical | Login | Successful login redirects back to login page (loop) | ✅ Fixed |
| 2 | 🔴 Critical | Login | `checkOfflineAccess()` called but never defined — throws ReferenceError on offline | ✅ Fixed |
| 3 | 🟠 High | Quote Form | Quote form POST fails — API_BASE is workspace-scoped URL (blocks external visitors) | ✅ Fixed |
| 4 | 🟠 High | Admin | View As redirects to login instead of dashboard after impersonation | ⏳ Pending |
| 5 | 🟠 High | Admin | Time-edit API calls missing `requesterId` — all return Unauthorized | ⏳ Pending |
| 6 | 🟡 Medium | Backend | Role mismatch: frontend `Lead` vs backend `Supervisor` guard | ⏳ Pending |
| 7 | 🟡 Medium | Admin | `approveTimeEdit`/`denyTimeEdit` check `data.ok` but backend returns `data.success` | ⏳ Pending |
| 8 | 🟠 High | Admin | `getAllWorkers` action not in backend — admin worker dropdown always empty | ⏳ Pending |

---

## Issue Detail

### 1. ✅ Login Redirect Loop
**File:** `js/script.js` line 1319  
**Root cause:** On successful login, code did:
```javascript
window.location.href = "employeelogin.html";  // WRONG — sent user back to login
```
**Fix applied:** Changed to `employeeDashboard.html`

---

### 2. ✅ `checkOfflineAccess` Not Defined
**File:** `employeelogin.html` line 535  
**Root cause:** `checkOfflineAccess()` called inside `offline` event listener but never defined anywhere. Threw a `ReferenceError` every time device went offline on the login page.  
**Fix applied:** Removed the call. Offline state is already handled by `updateOfflineStatus()`.

---

### 3. ✅ Quote Form — Transport Fix + Deployment Verified
**File:** `contact.html`  
**Root cause:** POST transport used `FormData` directly which can trigger CORS preflight — unreliable for Apps Script endpoints. Fixed in prior session (see `docs/QUOTE_SUBMISSION_TRANSPORT_FIX_2026-04-24.md`).  
**Fix already applied:** `URLSearchParams` + `mode: 'no-cors'` — no `res.ok` dependency.  
**Deployment verified 2026-04-24:** Apps Script "Who has access" confirmed = **Anyone** (not org-scoped). URL format is correct (`/macros/s/`). No further action needed.

---

### 4. ⏳ View As Redirect Loop
**File:** `js/admin/view-as.js` line ~59  
**Issue:** `activateViewAs()` redirects to `employeelogin.html` instead of `employeeDashboard.html`  
**Same bug pattern as Issue #1 — fix is straightforward when ready**

---

### 5. ⏳ Time-Edit API Missing `requesterId`
**File:** `js/admin/time-edit-requests.js`  
**Issue:** `getTimeEditRequests`, `approveTimeEdit`, `denyTimeEdit` all omit `requesterId` param  
**Fix:** Append `&requesterId=${localStorage.getItem('CLS_WorkerID')}` to each call

---

### 6. ⏳ Role Name Mismatch
**Frontend:** checks `role === 'Lead'`  
**Backend:** checks `role !== "Supervisor"` — Lead workers pass frontend but fail backend  
**Fix:** Change backend guard from `"Supervisor"` to `"Lead"` in `CLS_EmployeeLogin_Admin.js`

---

### 7. ⏳ Approve/Deny Wrong Response Key
**File:** `js/admin/time-edit-requests.js`  
**Issue:** Handlers check `data.ok` but backend returns `data.success`  
**Fix:** Change `data.ok` → `data.success` in approve and deny response handlers

---

### 8. ⏳ `getAllWorkers` Backend Action Missing
**File:** `js/admin/clockin-manager.js` line ~43  
**Issue:** Calls `?action=getAllWorkers` which doesn't exist — worker dropdown always empty  
**Options:**
- A: Implement `getAllWorkers` in `CLS_EmployeeLogin_Main.js` (reads Workers sheet)
- B: Derive worker list from existing `action=reportAll` response

---

## Session Log

### 2026-04-24 — Initial deploy of variant-a
- Pushed commit `827f22d` to GitHub → Vercel auto-deployed
- User reports: login not redirecting to dashboard, quote form not working
- Diagnosed issues #1 and #2 as confirmed bugs from prior audit doc
- Applied fixes for #1 and #2, committed and pushed
- Quote form issue (#3) — API URL format looks correct, deployment access level needs manual verification
