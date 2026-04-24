# CLS Infrastructure Consolidation — Full Session Closeout

**Date:** April 24, 2026  
**Author:** Steve Garay  
**Scope:** Consolidate all CLS infrastructure from personal `GarayInvestments` accounts into CLS-branded accounts, and document all active services.

---

## Current Infrastructure Inventory

_Verified April 24, 2026 — authoritative reference for all active CLS services._

### GitHub

| Repository                    | Account            | Visibility | Status                                           |
| ----------------------------- | ------------------ | ---------- | ------------------------------------------------ |
| `carolina-lumpers-web`        | `CarolinaLumpers`  | Public     | ✅ Active — main web app + GAS projects          |
| `cls-hub`                     | `CarolinaLumpers`  | Private    | ✅ Active — FastAPI backend (deployed on Fly.io) |
| `cls-system-ARCHIVED`         | `CarolinaLumpers`  | Private    | 🗄️ Archived — legacy Vite/React portal           |
| `cls_operations_hub-ARCHIVED` | `CarolinaLumpers`  | Private    | 🗄️ Archived — legacy operations system           |
| `cls_hub-ARCHIVED`            | `CarolinaLumpers`  | Private    | 🗄️ Archived — legacy hub version                 |
| `CLS_Git_Appsheet-ARCHIVED`   | `CarolinaLumpers`  | Private    | 🗄️ Archived — legacy AppSheet integration        |
| `automation-scripts-ARCHIVED` | `CarolinaLumpers`  | Private    | 🗄️ Archived — legacy Python scripts              |
| `HouseRenoAI`                 | `GarayInvestments` | Public     | Personal — stays on personal account             |
| `KreditYa`                    | `GarayInvestments` | Private    | Personal — stays on personal account             |

### Vercel

**Team:** `carolinalumpers-projects` (`team_NMAucYYKfGmitSsggQaXrjmB`)

| Project                | Project ID                         | Production URL                | Status                                             |
| ---------------------- | ---------------------------------- | ----------------------------- | -------------------------------------------------- |
| `carolina-lumpers-web` | `prj_D4wA7wCiRC538FBAAl18oddgTAG8` | https://carolinalumpers.com   | ✅ Live production                                 |
| `cls-hub`              | `prj_JXt6VDRCNXAbQpQvMgkpCu3jclXs` | https://cls-hub.vercel.app    | ⚠️ Exists but unused — actual deployment is Fly.io |
| `cls-system`           | `prj_TDXpY9JPbQFCm6ELJwIffXTq7d7J` | https://cls-system.vercel.app | 🗑️ Legacy — candidate for deletion                 |

**Domain:** `carolinalumpers.com` — verified ✅, DNS managed by Vercel (ns1/ns2.vercel-dns.com), aliased to `carolina-lumpers-web` project  
**Git integration:** `CarolinaLumpers/carolina-lumpers-web` → push-to-deploy on `main`  
**Old team:** `steve-garays-projects` (`team_OAKeQsestpXmbfVb5JD3d3dh`) — no longer production authority

### Cloudflare Workers

**Account:** `22a508357366cb3336c10c233870e97a` (`s.garay@carolinalumpers.com`)  
**Dashboard:** https://dash.cloudflare.com/22a508357366cb3336c10c233870e97a/workers-and-pages

| Worker                | URL                                         | Purpose                                           | Source Code                                 | wrangler.toml                    |
| --------------------- | ------------------------------------------- | ------------------------------------------------- | ------------------------------------------- | -------------------------------- |
| `cls-proxy`           | `cls-proxy.s-garay.workers.dev`             | CORS proxy → EmployeeLogin Apps Script            | Dashboard only (not in workspace)           | ❌ None                          |
| `sheets-direct-proxy` | `sheets-direct-proxy.steve-3d1.workers.dev` | Google Sheets API v4 proxy (service account auth) | `cloudflare-workers/sheets-direct-proxy.js` | ✅ `wrangler-sheets-direct.toml` |
| `invoice-proxy`       | `invoice-proxy.s-garay.workers.dev`         | CORS proxy → InvoiceProject Apps Script           | `cloudflare-workers/invoice-proxy.js`       | ✅ `wrangler-invoice.toml`       |
| `payroll-proxy`       | `payroll-proxy.s-garay.workers.dev`         | CORS proxy → PayrollProject Apps Script           | `cloudflare-workers/payroll-proxy.js`       | ❌ None (deployed manually)      |

**`cls-proxy`** — Primary API proxy used by `employeeDashboard.html` and `employeelogin.html` for all clock-in, login, time-edit, and report calls. CORS-enabled GET proxy with JSONP callback pass-through. Targets EmployeeLogin web app (`AKfycbwHBLEQ5QHu...`).

**`sheets-direct-proxy`** — Direct Sheets API proxy used by `admin-dashboard.js` and `invoice-management.js`. Authenticates via GCP service account (`react-portal-sheets@cls-operations-hub.iam.gserviceaccount.com`). Secrets (`GCP_PROJECT_ID`, `GCP_PRIVATE_KEY`, `GCP_CLIENT_EMAIL`, etc.) stored in Cloudflare Worker environment. Spreadsheet: `CLS_Hub_Backend` (`1U8hSNREN5fEhskp0UM-Z80iiW39beaOj3oIsaLZyFzk`).

**`invoice-proxy`** — Proxies POST requests to InvoiceProject. Handles `sendInvoiceEmail` and `QBO_Approval` actions. Targets InvoiceProject web app (`AKfycbzdxAPBjVHc...`).

**`payroll-proxy`** — Proxies POST requests to PayrollProject. Payload: `{ "Webhook Type": "Run Payroll", "Week Period": "YYYY-MM-DD" }`. Targets PayrollProject web app (`AKfycbws-MdQRQ-Z...`).

### Fly.io

**Account:** `s.garay@carolinalumpers.com`

| App       | URL                     | Purpose                                              | Last Deployed |
| --------- | ----------------------- | ---------------------------------------------------- | ------------- |
| `cls-hub` | https://cls-hub.fly.dev | FastAPI backend (QBO integration, worker management) | Dec 31, 2025  |

**Source:** `CarolinaLumpers/cls-hub` repo (separate from this workspace)  
**Status:** Step 1 of 8 complete (auth skeleton). Steps 2–8 (data models, RBAC, clock-in, QBO sync, invoices, PDFs, AWS) not started.  
**Note:** The Vercel `cls-hub` project is unused — Fly.io is the actual deployment platform.

### Supabase

**Org:** `zuzstpdxkrmbjrnkgywj` (shared personal org — no dedicated CLS organization yet)

| Project                      | Reference ID           | Region                  | Status                                             |
| ---------------------------- | ---------------------- | ----------------------- | -------------------------------------------------- |
| `cls-employee-portal`        | `dxbybjxpglpslmoenqyg` | East US (N. Virginia)   | ✅ CLS — React Portal backend (workers, W9 tables) |
| `houserenovators-db`         | `dtfjzjhxtojkgfofrmrr` | West US (N. California) | Personal — HouseRenoAI project                     |
| `GarayInvestments's Project` | `bkoumtnjkyzfzzqwbrkb` | East US (Ohio)          | ❓ Unknown — needs evaluation                      |

### Google Cloud Platform

**Project:** `cls-operations-hub` | **Account:** `s.garay@carolinalumpers.com`  
**Service Account:** `react-portal-sheets@cls-operations-hub.iam.gserviceaccount.com` — Viewer on `CLS_Hub_Backend` spreadsheet, used by `sheets-direct-proxy` Cloudflare Worker.

### Google Apps Script

All projects managed via `npx clasp` from `GoogleAppsScripts/` in this workspace:

| Project             | Purpose                                                                         |
| ------------------- | ------------------------------------------------------------------------------- |
| `EmployeeLogin`     | Core time tracking, clock-in, auth, payroll reporting — proxied via `cls-proxy` |
| `PayrollProject`    | Payroll generation — proxied via `payroll-proxy`                                |
| `InvoiceProject`    | Invoice management, QBO sync — proxied via `invoice-proxy`                      |
| `JobApplication`    | Application form processing — called directly from `apply.html`                 |
| `LoggingLibrary`    | Centralized logging library (CLLogger v1.2.0)                                   |
| `ClockinFlow`       | Batch clock-in operations                                                       |
| `ContactSync`       | Contact synchronization                                                         |
| `VendorSync`        | Vendor data sync                                                                |
| `AttendanceChecker` | Attendance validation                                                           |
| `OpsApprovalSystem` | Operations approval workflows                                                   |

---

## CLI Access Reference

_Verified April 24, 2026_

| CLI                    | Tool                   | Identity                                                       | Status                                                  |
| ---------------------- | ---------------------- | -------------------------------------------------------------- | ------------------------------------------------------- |
| **GitHub**             | `gh`                   | `CarolinaLumpers` _(active)_ / `GarayInvestments` _(inactive)_ | ✅ Both authenticated                                   |
| **Vercel**             | `npx vercel`           | `carolinalumpers` → `carolinalumpers-projects`                 | ✅ Authenticated                                        |
| **Google Apps Script** | `npx clasp` v3.3.0     | Google OAuth (stored locally)                                  | ✅ Authenticated                                        |
| **Fly.io**             | `flyctl`               | `s.garay@carolinalumpers.com`                                  | ✅ Authenticated                                        |
| **Supabase**           | `npx supabase`         | Org `zuzstpdxkrmbjrnkgywj`                                     | ✅ Authenticated                                        |
| **Cloudflare**         | `npx wrangler` v4.85.0 | `s.garay@carolinalumpers.com`                                  | ✅ Authenticated (API token via `CLOUDFLARE_API_TOKEN`) |
| **Google Cloud**       | `gcloud`               | `s.garay@carolinalumpers.com`                                  | ✅ Authenticated (PATH shim in PowerShell profile)      |

```powershell
# GitHub
gh auth switch -u CarolinaLumpers         # switch to CLS account
gh auth switch -u GarayInvestments        # switch to personal account
gh auth status                            # verify active account

# Vercel
npx vercel whoami                         # should return: carolinalumpers
npx vercel project ls --scope carolinalumpers-projects
$t = (Get-Content "$env:APPDATA\com.vercel.cli\Data\auth.json" | ConvertFrom-Json).token
$h = @{ Authorization = "Bearer $t" }     # REST API auth header

# Fly.io
flyctl auth whoami

# Supabase
npx supabase projects list

# clasp (run from a GAS project folder with .clasp.json)
npx clasp status
npx clasp push

# Cloudflare (API token in CLOUDFLARE_API_TOKEN)
npx wrangler whoami
npx wrangler deploy --config cloudflare-workers/wrangler-sheets-direct.toml
npx wrangler deploy --config cloudflare-workers/wrangler-invoice.toml
```

---

## Remaining Cleanup

| Item                                                        | Priority | Action                                                                                |
| ----------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------- |
| Delete `carolina-lumpers-web` from `steve-garays-projects`  | Low      | Vercel Dashboard → old team → project Settings → Delete                               |
| Delete `cls-hub` from `steve-garays-projects`               | Low      | Safe — unused, Fly.io is actual host                                                  |
| Delete `cls-apps-script-proxy` from `steve-garays-projects` | Low      | Safe — orphan, no linked repo, replaced by `cls-proxy` worker                         |
| Delete `cls-system` from `carolinalumpers-projects`         | Low      | Legacy, no active use case                                                            |
| Authenticate Cloudflare CLI                                 | Medium   | ~~`npx wrangler login` — enables deploying workers from terminal~~ ✅ Done            |
| Investigate `GarayInvestments's Project` Supabase           | Low      | Identify or delete unknown project in shared org                                      |
| Add `wrangler.toml` for `payroll-proxy`                     | Low      | Source exists at `cloudflare-workers/payroll-proxy.js` but no deploy config           |
| Fix `gcloud` PATH                                           | Low      | ~~Reload PATH or open Google Cloud SDK Shell~~ ✅ Done (PowerShell profile PATH shim) |

---

## Session History

### Starting State

**GitHub:** Active CLS repos (`carolina-lumpers-web`, `cls-hub`) were under `GarayInvestments`. `CarolinaLumpers` held a mix of personal repos and archived legacy repos with no naming convention.

**Vercel:** Production `carolinalumpers.com` was under personal `steve-garays-projects`. `carolinalumpers-projects` existed but had no production deployment.

**Git:** `.vercel/project.json` linked to old project under `steve-garays-projects`. CLI active account: `GarayInvestments`.

---

## Work Performed

### Phase 1 — GitHub Cleanup

| Action                                         | Result                                    |
| ---------------------------------------------- | ----------------------------------------- |
| Deleted `CarolinaLumpers/Dani-Contract`        | ✅ Removed personal repo                  |
| Deleted `CarolinaLumpers/Tia-Myriam.github.io` | ✅ Removed personal repo                  |
| Archived `CarolinaLumpers/cls-system`          | ✅ Archived (unmaintained since Oct 2025) |
| Switched GitHub CLI to `CarolinaLumpers`       | ✅ `gh auth switch -u CarolinaLumpers`    |

### Phase 2 — GitHub Repository Transfers

| Action                                                                  | Result                       |
| ----------------------------------------------------------------------- | ---------------------------- |
| Transferred `GarayInvestments/carolina-lumpers-web` → `CarolinaLumpers` | ✅ Auto-redirected by GitHub |
| Transferred `GarayInvestments/cls-hub` → `CarolinaLumpers`              | ✅ Auto-redirected by GitHub |

### Phase 3 — Vercel Production Migration

**Problem:** Hobby plan blocks cross-team project transfers.  
**Solution:** Deploy fresh to target team + move domain ownership separately.

| Action                                                                  | Result                                                              |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Fresh `vercel deploy --scope carolinalumpers-projects`                  | ✅ `carolina-lumpers-4n20i0udf-carolinalumpers-projects.vercel.app` |
| Domain move request: `carolinalumpers.com` → `carolinalumpers-projects` | ✅ Approved in dashboard                                            |
| Added domain to project via Vercel REST API                             | ✅ Attached                                                         |
| Relinked `.vercel/project.json` to `prj_D4wA7wCiRC538FBAAl18oddgTAG8`   | ✅ `vercel pull` from new scope                                     |

### Phase 4 — DNS / Domain Verification Crisis

**Problem:** `carolinalumpers.com` showed "unverified" after domain move, blocking alias assignment.

**Root cause:** Stale TXT record `rec_7ce85011eecc6ffc6d911fd5` (value: `vc-domain-verify=portal.carolinalumpers.com,532545bf2377f01039cf`) from an old `cls-hub` project conflicted with the new verification record in the same Vercel DNS zone.

| Action                                                       | Result                                                         |
| ------------------------------------------------------------ | -------------------------------------------------------------- |
| Added new `_vercel` TXT record via Vercel API                | ✅ `vc-domain-verify=carolinalumpers.com,8f7e12d29e9999daea33` |
| Deleted conflicting old TXT record                           | ✅ Removed                                                     |
| Triggered domain re-verification                             | ✅ `"verified": true`                                          |
| Assigned alias `carolinalumpers.com` → production deployment | ✅ HTTP 200 confirmed                                          |

### Phase 5 — Git Integration Verification

Vercel dashboard Git integration was already linked to `CarolinaLumpers/carolina-lumpers-web` after the GitHub repo transfer — GitHub's automatic redirect preserved the Vercel webhook link. No reconfiguration required. Push-to-deploy on `main` confirmed working.

### Phase 6 — Archived Repo Naming Convention

**Problem:** 5 archived repos had no visual indicator they were legacy.  
**Challenge:** Archived repos are GitHub read-only — `gh repo rename` returns HTTP 403. Workaround: unarchive → rename → re-archive. For repos that still failed after unarchive, used `gh api -X PATCH` directly.

| Old Name             | New Name                      | Status |
| -------------------- | ----------------------------- | ------ |
| `cls-system`         | `cls-system-ARCHIVED`         | ✅     |
| `cls_operations_hub` | `cls_operations_hub-ARCHIVED` | ✅     |
| `cls_hub`            | `cls_hub-ARCHIVED`            | ✅     |
| `CLS_Git_Appsheet`   | `CLS_Git_Appsheet-ARCHIVED`   | ✅     |
| `automation-scripts` | `automation-scripts-ARCHIVED` | ✅     |

---

## Lessons Learned

| Issue                                                     | Fix                                                                                                 |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `gh repo rename OldName NewName` fails — takes only 1 arg | Use `gh repo rename -R owner/repo NewName -y` or `gh api -X PATCH repos/owner/repo -f name=NewName` |
| Archived repos return HTTP 403 on rename                  | Unarchive → rename → re-archive                                                                     |
| Domain "unverified" after Vercel team move                | Check for conflicting TXT records in the DNS zone; delete stale ones via Vercel API                 |
| Vercel Hobby plan blocks cross-team transfers             | Deploy fresh to target team + move domain separately                                                |
| `grep` not available in PowerShell                        | Use `Select-String`                                                                                 |
| `head` not available in PowerShell                        | Use `Select-Object -First N`                                                                        |
| `npx supabase projects list` prompts to install package   | Answer `y` — one-time install, then runs                                                            |

---

_All active CLS infrastructure is consolidated under CLS-branded accounts as of April 24, 2026._
