# Documentation Lifecycle Action Plan (2026-04-24)

This plan converts the documentation audit into executable actions with exact move targets, consolidation destinations, and redirect stub content.

## Scope

- Root docs: `docs/*.md`, `docs/*.html`, `docs/*.xlsx`
- Root guidance: `README.md`, `.github/*.md`
- React portal docs: `react-portal/docs/**/*.md`, `react-portal/README.md`
- Google Apps Script docs: `GoogleAppsScripts/**/README.md` and structured docs

## Target Structure

Use this structure before moving files:

- `docs/active/` for current operational runbooks and references
- `docs/archive/historical/` for completed work reports and dated fix logs
- `docs/archive/superseded/` for replaced plans/guides
- `docs/archive/consolidated/` for source docs merged into a canonical destination
- `docs/data/exports/` for non-document artifacts currently in `docs/`

## Redirect Stub Template

For any file moved out of its current location, leave this one-page redirect stub at the old path.

```md
# Document Moved

This document has moved as part of the documentation lifecycle cleanup.

- New location: `<new-path>`
- Lifecycle status: `<historical|superseded|consolidated|active>`
- Effective date: `2026-04-24`

If you reached this file from an older link, update that link to the new location.
```

## A) Immediate Moves (No Merge Required)

| Current Path | Action | Exact Target | Stub Needed |
|---|---|---|---|
| `docs/ADMIN_MODULAR_REFACTORING_COMPLETE.md` | Archive historical | `docs/archive/historical/ADMIN_MODULAR_REFACTORING_COMPLETE.md` | Yes |
| `docs/APPROVAL_UI_COMPLETE.md` | Archive historical | `docs/archive/historical/APPROVAL_UI_COMPLETE.md` | Yes |
| `docs/BIOMETRIC_REMOVAL_QA.md` | Archive historical | `docs/archive/historical/BIOMETRIC_REMOVAL_QA.md` | Yes |
| `docs/biometric-icon-testing.md` | Archive historical | `docs/archive/historical/biometric-icon-testing.md` | Yes |
| `docs/CREATE_DEV_DASHBOARD.md` | Archive historical | `docs/archive/historical/CREATE_DEV_DASHBOARD.md` | Yes |
| `docs/css-js-organization.md` | Archive historical | `docs/archive/historical/css-js-organization.md` | Yes |
| `docs/css-refactor-summary.md` | Archive historical | `docs/archive/historical/css-refactor-summary.md` | Yes |
| `docs/DASHBOARD_FIXES_2025-01-17.md` | Archive historical | `docs/archive/historical/DASHBOARD_FIXES_2025-01-17.md` | Yes |
| `docs/dashboard-improvements-2025-10-17.md` | Archive historical | `docs/archive/historical/dashboard-improvements-2025-10-17.md` | Yes |
| `docs/DEV_ENVIRONMENT_SUMMARY.md` | Archive historical | `docs/archive/historical/DEV_ENVIRONMENT_SUMMARY.md` | Yes |
| `docs/PROJECT_SUMMARY.md` | Archive historical | `docs/archive/historical/PROJECT_SUMMARY.md` | Yes |
| `docs/SESSION_FIXES_2025-11-06.md` | Archive historical | `docs/archive/historical/SESSION_FIXES_2025-11-06.md` | Yes |
| `docs/TAILWIND_LOADING_IMPLEMENTATION.md` | Archive historical | `docs/archive/historical/TAILWIND_LOADING_IMPLEMENTATION.md` | Yes |
| `docs/biometric-login-implementation.md` | Archive superseded | `docs/archive/superseded/biometric-login-implementation.md` | Yes |
| `docs/CACHE_BUSTING_GUIDE.md` | Archive superseded | `docs/archive/superseded/CACHE_BUSTING_GUIDE.md` | Yes |
| `docs/qbo_integration_plan.md` | Archive superseded | `docs/archive/superseded/qbo_integration_plan.md` | Yes |
| `docs/qbo_integrstion_details.md` | Archive superseded | `docs/archive/superseded/qbo_integrstion_details.md` | Yes |
| `docs/CLS_Hub_Backend (4).xlsx` | Move data artifact | `docs/data/exports/CLS_Hub_Backend (4).xlsx` | Optional note-only |
| `.github/COPILOT_INSTRUCTIONS_UPDATE.md` | Archive superseded | `.github/archive/COPILOT_INSTRUCTIONS_UPDATE.md` | Yes |

## B) Consolidation Moves (Merge Then Move)

| Source | Canonical Destination | Post-Merge Target for Source | Stub Needed |
|---|---|---|---|
| `docs/CLS_ACCOUNT_CONSOLIDATION_CLOSEOUT.md` | `docs/CLS_CONSOLIDATION_FULL_CLOSEOUT.md` | `docs/archive/consolidated/CLS_ACCOUNT_CONSOLIDATION_CLOSEOUT.md` | Yes |
| `docs/PROJECT_STRUCTURE.md` | `README.md` and `docs/README-DOCS-INDEX.md` | `docs/archive/consolidated/PROJECT_STRUCTURE.md` | Yes |
| `docs/MODERNIZATION_PLAN.md` | `react-portal/docs/migration/SUPABASE_MIGRATION_PLAN.md` | `docs/archive/consolidated/MODERNIZATION_PLAN.md` | Yes |
| `docs/qbo_integration_plan_module_1.md` | `docs/QB_API_REFERENCE.md` | `docs/archive/consolidated/qbo_integration_plan_module_1.md` | Yes |
| `docs/quickbooks_integration_checklist.html` | `docs/QB_API_REFERENCE.md` (new checklist section) | `docs/archive/consolidated/quickbooks_integration_checklist.html` | Yes |
| `docs/DEPLOYMENT_GUIDE.md` | `README.md` (deploy section) and `.github/README_DOCUMENTATION.md` (links) | `docs/archive/consolidated/DEPLOYMENT_GUIDE.md` | Yes |

## C) Keep as Active Canonical or Active Reference

No move recommended now. Add a lifecycle badge at top of each file (`Canonical` or `Active Reference`) on next pass.

| File | Lifecycle |
|---|---|
| `README.md` | Canonical |
| `.github/copilot-instructions.md` | Canonical |
| `.github/README_DOCUMENTATION.md` | Canonical index |
| `docs/README-DOCS-INDEX.md` | Canonical docs index |
| `docs/CURRENT_STATE_MATRIX.md` | Canonical |
| `docs/CLS_CONSOLIDATION_FULL_CLOSEOUT.md` | Canonical |
| `docs/CACHE_BUSTING_IMPLEMENTATION.md` | Active reference |
| `docs/OFFLINE_DEV_ENVIRONMENT.md` | Active reference |
| `docs/CLS_HUB_QB_MAPPINGS.md` | Active reference |
| `docs/QB_API_REFERENCE.md` | Canonical for QBO technical reference |
| `docs/RUN_PAYROLL_INTEGRATION.md` | Active reference |
| `docs/DOCNUMBER_DESIGN_PATTERN.md` | Active reference |
| `docs/button-style-guide.md` | Active reference |
| `docs/cls-light-theme-guide.md` | Active reference |
| `docs/PWA_OFFLINE_ICONS_AND_CLOCKIN_FIX.md` | Historical reference (keep visible) |
| `docs/DASHBOARD_REDESIGN_IMPLEMENTATION_GUIDE.md` | Active reference |

## D) React Portal Docs Actions

| Current Path | Action | Exact Target |
|---|---|---|
| `react-portal/docs/migration/PHASE_1_COMPLETE.md` | Archive historical | `react-portal/docs/archived/migration/PHASE_1_COMPLETE.md` |
| `react-portal/docs/migration/PHASE_2_COMPLETE.md` | Archive historical | `react-portal/docs/archived/migration/PHASE_2_COMPLETE.md` |
| `react-portal/docs/migration/SESSION_2025-01-17_WORKERS_CRUD.md` | Archive historical | `react-portal/docs/archived/migration/SESSION_2025-01-17_WORKERS_CRUD.md` |
| `react-portal/docs/guides/PROJECT_TRANSFER.md` | Archive historical | `react-portal/docs/archived/guides/PROJECT_TRANSFER.md` |
| `react-portal/docs/completed/IMPLEMENTATION_DOCS.md` | Consolidate summary into per-feature docs, then archive | `react-portal/docs/archived/completed/IMPLEMENTATION_DOCS.md` |

Keep active without move:

- `react-portal/docs/migration/MIGRATION_PROGRESS.md`
- `react-portal/docs/migration/SUPABASE_MIGRATION_PLAN.md`
- `react-portal/docs/SETUP.md`
- `react-portal/docs/guides/DIRECT_SHEETS_ACCESS.md`
- `react-portal/docs/guides/SYNC_WORKERS_README.md`
- `react-portal/docs/guides/USER_SWITCHER.md`

## E) GoogleAppsScripts Docs Actions

Keep current structure and only apply lifecycle headers:

- Keep canonical: `GoogleAppsScripts/README.md`, `GoogleAppsScripts/EmployeeLogin/README.md`, `GoogleAppsScripts/LoggingLibrary/README.md`
- Keep active references: all project `README.md` files, `GoogleAppsScripts/LoggingLibrary/START_HERE.md`, `GoogleAppsScripts/LoggingLibrary/DEPLOYMENT_GUIDE.md`, `GoogleAppsScripts/LoggingLibrary/MIGRATION_GUIDE.md`, `GoogleAppsScripts/OpsApprovalSystem/DEPLOYMENT_CHECKLIST.md`
- Archive historical: `GoogleAppsScripts/LoggingLibrary/IMPLEMENTATION_SUMMARY.md` -> `GoogleAppsScripts/LoggingLibrary/archive/IMPLEMENTATION_SUMMARY.md`

## F) Variant Repositories Policy

Use root docs as canonical unless variant-specific behavior differs.

- `carolina-lumpers-web-variant-a`: keep only variant-specific docs; replace mirrored docs with short pointer docs linking to root canonical files.
- `carolina-lumpers-web-variant-b`: no docs detected; no action required.
- `carolina-lumpers-web-variant-c`: no docs detected; no action required.

## G) Execution Order (Low Risk)

1. Create target directories.
2. Move immediate historical/superseded files.
3. Move data artifact out of `docs/` narrative surface.
4. Perform consolidations and move consolidated sources.
5. Add redirect stubs at old paths.
6. Refresh `docs/README-DOCS-INDEX.md` and `.github/README_DOCUMENTATION.md` links.

## H) Acceptance Criteria

- No broken links from `README.md`, `docs/README-DOCS-INDEX.md`, and `.github/README_DOCUMENTATION.md`.
- All moved files have a redirect stub at the old path (except optional data artifact note).
- Superseded plans are no longer listed as active references.
- Canonical docs are clearly identifiable in indexes.