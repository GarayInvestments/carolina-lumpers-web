# Current State Matrix (Pre-Variant-A Baseline)

Date: 2026-04-24
Status: Active baseline for architecture and deployment decisions.

## Purpose

This document defines the current production reality before any Variant A rollout. It is the source-of-truth checkpoint for:

- where the website is hosted and served
- where deployments originate
- what is React vs legacy
- what still depends on Google Apps Script

## Infrastructure Baseline

### Domain and DNS

- Domain: carolinalumpers.com
- Registrar: Squarespace (domain ownership)
- DNS host: Vercel DNS (nameservers delegated to Vercel)

### Production Serving Layer

- Current live traffic is served through Vercel (HTTP response server header observed as Vercel).
- GitHub Pages is configured in repository settings, but DNS is not currently pointing to a GitHub Pages DNS pattern.

### Repository and Deployment Source

- Repository: GarayInvestments/carolina-lumpers-web
- Default branch: main
- Primary code source: this repository
- Current delivery authority for production traffic: Vercel + Vercel DNS

## Application Ownership Matrix

| Area                         | Current Runtime                       | Code Location                                                          | Source of Truth                | Notes                                                      |
| ---------------------------- | ------------------------------------- | ---------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------- |
| Public marketing pages       | Static site on production domain      | root HTML/CSS/JS                                                       | Root project                   | Includes index/services/about/contact/apply                |
| Quote request form           | Frontend static + Apps Script backend | contact.html + GoogleAppsScripts/QuoteRequestHandler                   | Hybrid                         | Form transport currently tuned for Apps Script constraints |
| Legacy employee portal (PWA) | Static frontend + Apps Script APIs    | employeelogin.html, employeeDashboard.html, service-worker-employee.js | Legacy root app                | Still operational and sensitive to regressions             |
| React CLS Hub portal         | React app (in-progress migration)     | react-portal/                                                          | React portal                   | Not full replacement for all legacy flows yet              |
| Backend operational APIs     | Google Apps Script web apps           | GoogleAppsScripts/                                                     | Apps Script projects           | Time tracking/payroll/admin and quote-related handlers     |
| Data storage (legacy ops)    | Google Sheets                         | Backend-managed                                                        | CLS_Hub_Backend spreadsheet    | Used by multiple Apps Script projects                      |
| Data storage (new portal)    | Supabase (partial migration)          | react-portal services + SQL/migrations                                 | Supabase for migrated features | Migration progress tracked in react-portal docs            |

## React Migration Snapshot

Reference: react-portal/docs/migration/MIGRATION_PROGRESS.md

- React migration is active and partially complete.
- Some capabilities have moved to React + Supabase.
- Legacy root app and Apps Script remain required for multiple production flows.

## Deployment Reality vs Configuration

### Current Reality (Observed)

- Production DNS and edge delivery are controlled in Vercel.
- Live domain responses indicate Vercel serving path.

### Concurrent Configuration Present

- GitHub Pages is also configured in repo settings (main/root + custom domain).
- This introduces dual-platform ambiguity unless one platform is designated as authoritative.

## Production Authority Decision (Resolved 2026-04-24)

**Vercel is the sole production authority.**

- GitHub Pages custom domain (`carolinalumpers.com`) must be removed from repo settings → Settings > Pages > clear custom domain field
- Squarespace remains domain registrar until Feb 2027 renewal — transfer domain to Vercel at that time (Jan 2027)
- No DNS changes required — Vercel nameservers already authoritative

## External Backend Services Inventory

| Service                    | Account                                | Identity                                                       | Purpose                                             | Source Code                                  |
| -------------------------- | -------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------- |
| Fly.io                     | personal (s.garay@carolinalumpers.com) | cls-hub.fly.dev                                                | QuickBooks Online API backend                       | Not in this workspace — separate project     |
| Supabase (active)          | GarayInvestments org                   | dxbybjxpglpslmoenqyg                                           | React portal employee data (workers, W9s)           | react-portal/                                |
| Supabase (transfer target) | GarayInvestments org                   | celubbvmoqpsmioapzlg                                           | Planned migration destination                       | react-portal/                                |
| Cloudflare Worker          | s.garay@carolinalumpers.com            | cls-proxy.s-garay.workers.dev                                  | CORS proxy → EmployeeLogin Apps Script              | Not in this workspace — Cloudflare dashboard |
| GCP Service Account        | cls-operations-hub project             | react-portal-sheets@cls-operations-hub.iam.gserviceaccount.com | Read-only Google Sheets API access for React portal | react-portal/server/                         |

### cls-hub (Fly.io) Notes

- App: `cls-hub`, region: `iad`, status: deployed, v260
- Last deployed: Dec 31, 2025 (heavy build day — 260 releases)
- Secrets configured: DATABASE_URL, QBO_CLIENT_ID/SECRET (sandbox), QBO_PROD_CLIENT_ID/SECRET/REALM_ID/REFRESH_TOKEN, SECRET_KEY, FLY_APP_ENV
- Purpose: QBO integration backend — **not** a CLS employee portal backend
- Source project: separate, not committed in this workspace
- One machine running (iad), one stopped

## Suggested Next Artifacts

- Hosting/Deployment baseline doc with approved authority and exact rollback path.
- Cutover map: page-by-page ownership (Legacy vs React vs Variant A target).
- Release checklist tied to chosen production authority.

## Verification Checklist (Repeatable)

- Confirm DNS nameservers for domain
- Confirm apex and www DNS target records
- Confirm HTTP(S) response server headers on production domain
- Confirm active project linkage in chosen platform dashboard
- Confirm repository branch and release trigger
- Confirm rollback method for the same platform
