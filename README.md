# Carolina Lumpers Service - Web Platform

## 🏗️ System Architecture

This workspace contains **two distinct web systems**:

### 1. Public Marketing Website (Static)

- **Purpose**: Public-facing marketing and information
- **Pages**: Landing page, services, about, contact
- **Technology**: Static HTML/CSS/JS hosted on GCP
- **Hosting**: Google Cloud Storage bucket (`carolina-lumpers-web`)

### 2. Employee Portal & Time Tracking System (Full-Stack)

- **Frontend** (Progressive Web App) - Employee dashboard, clock-in, time tracking
- **Backend** (Google Apps Script) - Serverless API with centralized logging
- **Database** (Google Sheets) - CLS_Hub_Backend spreadsheet

### Employee Portal System Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Employee Frontend (PWA)                                     │
│  • employeelogin.html, employeeDashboard.html               │
│  • PWA with offline clock-in support                        │
│  • Multilingual (EN/ES/PT)                                  │
│  • Device detection & biometric auth                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Cloudflare Proxy (cls-proxy.s-garay.workers.dev)          │
│  • CORS handling                                            │
│  • Request forwarding                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Backend (GoogleAppsScripts/EmployeeLogin/)                 │
│  • Google Apps Script Web App                               │
│  • Time tracking, payroll, admin reports                    │
│  • Centralized logging via CLLogger library                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Google Sheets Database (CLS_Hub_Backend)                   │
│  • 22 sheets for workers, clock-ins, clients, etc.          │
│  • Activity_Logs sheet for centralized event tracking       │
└─────────────────────────────────────────────────────────────┘
```

### Static Website Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Public Website (Static HTML/CSS/JS)                        │
│  • index.html (landing page)                                │
│  • services.html, about.html, contact.html                  │
│  • apply.html (job application form)                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  GCP Cloud Storage                                          │
│  • Bucket: carolina-lumpers-web                             │
│  • Static website hosting enabled                           │
│  • Custom domain: carolinalumpers.com                       │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Static Website Development

```powershell
# Serve locally
cd carolina-lumpers-web
python -m http.server 8010

# Open browser to:
# - http://localhost:8010/index.html (landing page)
# - http://localhost:8010/services.html
# - http://localhost:8010/contact.html
```

### Employee Portal Development

```powershell
# Serve locally (same server)
cd carolina-lumpers-web
python -m http.server 8010

# Open browser to:
# - http://localhost:8010/employeelogin.html
# - http://localhost:8010/employeeDashboard.html
```

### Backend Development

```powershell
# Deploy all Apps Script projects
cd GoogleAppsScripts
.\push-all.ps1

# OR deploy single project
cd GoogleAppsScripts\EmployeeLogin
clasp push
```

### CLI Session Reconnect (CLS)

Run this once at the start of each new terminal session:

```powershell
cd carolina-lumpers-web
.\scripts\check-cli-auth.ps1
```

What this check validates:

- GitHub (`gh`)
- Vercel (`npx vercel`)
- Fly.io (`flyctl`)
- Supabase (`npx supabase`)
- Cloudflare (`npx wrangler`)
- Google Cloud (`gcloud`)
- Google Apps Script (`npx clasp`)

Notes:

- Cloudflare uses `CLOUDFLARE_API_TOKEN` (user environment variable) for no-browser auth.
- `gcloud` availability is restored via PowerShell profile PATH shim.
- If a check fails, use the re-auth command printed by the script.

## 📁 Project Structure

```
carolina-lumpers-web/
├── STATIC WEBSITE (Public Marketing)
├── index.html                    # Landing page
├── services.html                 # Services page
├── about.html                    # About page
├── contact.html                  # Contact page
├── privacy.html                  # Privacy policy
├── eula.html                     # End user license agreement
│
├── EMPLOYEE PORTAL (Time Tracking System - Legacy)
├── employeelogin.html            # Employee login page
├── employeeSignup.html           # Employee registration
├── employeeDashboard.html        # Main dashboard (clock-in, reports, time edits)
├── apply.html                    # Job application form (6-step wizard)
├── w9Form.html                   # W-9 tax form submission
├── w9Status.html                 # W-9 submission status check
├── manifest-employee.json        # PWA manifest
├── service-worker-employee.js    # Service worker for offline support
│
├── REACT PORTAL (Modern Employee Portal - IN MIGRATION)
├── react-portal/
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── Dashboard.jsx    # Main dashboard
│   │   │   ├── UserSwitcher.jsx # Dev tool for role testing
│   │   │   └── [other components]/
│   │   ├── contexts/            # React contexts
│   │   │   └── AuthContext.jsx  # Authentication state
│   │   ├── services/
│   │   │   ├── api.js           # Apps Script API client
│   │   │   ├── sheets.js        # Direct Sheets API (fast reads)
│   │   │   └── supabase.js      # Supabase client (Phase 1-5 migration)
│   │   └── App.jsx              # Root component
│   ├── server/
│   │   ├── sheets-proxy.js      # OAuth proxy for direct Sheets access
│   │   └── service-account-key.json  # Service account credentials (gitignored)
│   ├── supabase-ready.sql       # PostgreSQL schema (workers, clients, etc.)
│   ├── MIGRATION_PROGRESS.md    # 🔥 Phase 1-5 migration tracking
│   ├── DIRECT_SHEETS_ACCESS.md  # Direct Sheets API documentation
│   ├── USER_SWITCHER.md         # Dev tool documentation
│   └── package.json
│
├── SHARED ASSETS
├── css/
│   ├── variables.css            # Design tokens (colors, spacing)
│   ├── base.css                 # Global resets & typography
│   ├── components.css           # Reusable UI components
│   ├── layout.css               # Site structure & navigation
│   ├── forms.css                # Form-specific styles
│   ├── dashboard.css            # Dashboard-specific styles
│   └── style.css                # Import coordinator
├── js/
│   ├── script.js                # Core JS (device detection, API helpers)
│   ├── cache-buster.js          # Cache management utility
│   └── admin/
│       ├── admin-tools.js       # Admin panel functionality
│       └── run-payroll.js       # Payroll generation UI
├── assets/
│   └── [images, icons, etc.]
│
├── BACKEND SERVICES (Google Apps Script)
├── GoogleAppsScripts/
│   ├── EmployeeLogin/           # Main time tracking backend (v3.0)
│   │   ├── CLS_EmployeeLogin_Main.js       # Entry point (doGet/doPost)
│   │   ├── CLS_EmployeeLogin_Config.js     # Configuration constants
│   │   ├── CLS_EmployeeLogin_ClockIn.js    # Clock-in logic & geofencing
│   │   ├── CLS_EmployeeLogin_Workers.js    # Authentication & user management
│   │   ├── CLS_EmployeeLogin_Admin.js      # Admin reports & payroll
│   │   ├── CLS_EmployeeLogin_Utils.js      # Shared utilities
│   │   ├── CLS_EmployeeLogin_Logger.js     # TT_LOGGER wrapper
│   │   └── README.md
│   ├── LoggingLibrary/          # Centralized logging (CLLogger v1.2.0)
│   │   ├── CLLogger.js          # Core logging library
│   │   ├── README.md
│   │   └── START_HERE.md
│   ├── JobApplication/          # Job application processor
│   ├── PayrollProject/          # Payroll generation
│   ├── InvoiceProject/          # Invoice management
│   ├── ContactSync/             # Contact synchronization
│   ├── VendorSync/              # Vendor data sync
│   ├── ClockinFlow/             # Batch clock-in operations
│   ├── push-all.ps1             # Deploy all projects script
│   └── [other projects]/
│
├── DOCUMENTATION
├── .github/
│   ├── copilot-instructions.md  # 🔥 COMPREHENSIVE DEVELOPER GUIDE
│   └── DATABASE_SCHEMA.md       # Complete database structure (22 sheets)
├── docs/
│   ├── ADMIN_MODULAR_REFACTORING_COMPLETE.md
│   ├── APPROVAL_UI_COMPLETE.md
│   ├── BIOMETRIC_REMOVAL_COMPLETE.md
│   ├── CACHE_BUSTING_GUIDE.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── css-refactor-summary.md
│   └── [other feature docs]/
├── README.md                    # This file
├── UNIFIED_TECHNOLOGY_STACK.md  # Tech stack strategy (Vercel + Supabase)
└── Workspace_AppsScriptEmployeeLogin.code-workspace  # VS Code workspace config
```

## ⚡ Key Features

### Static Website

- **Marketing Pages** - Professional landing page, services, about, contact
- **Job Application** - 6-step wizard form with multilingual support
- **Responsive Design** - Mobile-first, works on all devices
- **Fast Loading** - Static HTML/CSS/JS hosted on GCP
- **SEO Optimized** - Proper meta tags and structure
- **GDPR Compliant** - Privacy policy and EULA pages

### Employee Portal (PWA)

- **Progressive Web App (PWA)** - Installable, works offline
- **Offline Clock-In** - Failed clock-ins queued in IndexedDB, synced when online
- **Multilingual** - English, Spanish, Portuguese support with `data-en/es/pt` attributes
- **Device Detection** - Tracks device type (iPhone/Android/Windows) and browser
- **Biometric Auth** - WebAuthn support for Face ID/Touch ID (local only)
- **Time Edit Requests** - Workers can request time corrections, admins approve/deny
- **Admin Tools** - View all workers, generate reports, manage time entries
- **Modular CSS** - Design token system with clear component architecture

### Backend

- **Modular Architecture** - 9 distinct modules for maintainability
- **Centralized Logging** - All events logged via CLLogger library to Activity_Logs sheet
- **Geofencing** - GPS validation with 0.3 mile radius from client locations
- **Rate Limiting** - Prevent duplicate clock-ins within configurable interval
- **Email Notifications** - GmailApp integration for alerts and reports
- **Time Edit Workflow** - Request → Pending → Approved/Denied with admin controls
- **Payroll Generation** - Weekly summaries with PDF reports
- **Role-based Access** - Admin/Lead/Worker roles with different permissions

## 🔗 API Flow

**Critical**: All frontend API calls route through Cloudflare proxy:

```javascript
// Frontend (employeeDashboard.html, script.js)
const API_URL = "https://cls-proxy.s-garay.workers.dev";
const deviceInfo = getDeviceInfo(); // Always include device tracking

// Example: Clock-in with device
fetch(
  `${API_URL}?action=clockin&workerId=${id}&lat=${lat}&lng=${lng}&device=${encodeURIComponent(
    deviceInfo.displayString,
  )}`,
);
```

**Proxy Configuration**:

- Cloudflare Worker: `https://cls-proxy.s-garay.workers.dev`
- Forwards to: `https://script.google.com/macros/s/AKfycbwHBLEQ5QHuhD-O4uI4hRN_5_yS9YsFgtn_dMAdoAO2C7zHLoi3qfHO82vas3Uv0wXXpg/exec`
- Adds CORS headers for cross-origin requests

## 🛠️ Development Workflow

### Making Static Website Changes

1. Edit HTML/CSS/JS files locally (index.html, services.html, etc.)
2. Test in browser using local server
3. Deploy to GCP bucket:

```powershell
gsutil -m rsync -r -d carolina-lumpers-web gs://carolina-lumpers-web
```

### Making Employee Portal Changes

1. Edit HTML/CSS/JS files locally (employeelogin.html, employeeDashboard.html, etc.)
2. Test in browser (local server recommended)
3. Test PWA features (offline mode, service worker)
4. Deploy to GCP bucket (same command as above)

```powershell
gsutil -m rsync -r -d carolina-lumpers-web gs://carolina-lumpers-web
```

### Making Backend Changes

1. Edit `.js` files in `GoogleAppsScripts/[ProjectName]/`
2. Push to Google Apps Script:

```powershell
cd GoogleAppsScripts/EmployeeLogin
clasp push
```

3. Web app auto-updates (no republish needed with current settings)

### Testing Backend Locally

```javascript
// In Apps Script editor, run test functions:
testSystemConfig(); // Verify configuration
testClockInFlow("W001", 35.77, -78.63); // Test clock-in
testClockInLogging(); // Test centralized logging
```

## 📚 Essential Documentation

### For Developers (READ THIS FIRST)

- **`.github/copilot-instructions.md`** - Complete system guide with patterns, pitfalls, and examples

### Module-Specific

- **`GoogleAppsScripts/EmployeeLogin/README.md`** - Backend module architecture
- **`GoogleAppsScripts/LoggingLibrary/README.md`** - Centralized logging library
- **`.github/DATABASE_SCHEMA.md`** - Complete database structure (22 sheets)

### Feature Documentation

- **`DEPLOYMENT_GUIDE.md`** - Deployment workflows
- **`CACHE_BUSTING_GUIDE.md`** - CSS/JS versioning
- **`docs/css-refactor-summary.md`** - CSS architecture
- **Various `*_COMPLETE.md` files** - Feature implementation notes

## 🔐 Environment Configuration

### Frontend Constants

```javascript
// js/script.js
const API_URL = "https://cls-proxy.s-garay.workers.dev"; // Cloudflare proxy
const SIGNUP_URL = "https://script.google.com/macros/s/.../exec"; // Direct signup
```

### Backend Constants

```javascript
// GoogleAppsScripts/EmployeeLogin/CLS_EmployeeLogin_Config.js
const SHEET_ID = "1U8hSNREN5fEhskp0UM-Z80iiW39beaOj3oIsaLZyFzk"; // CLS_Hub_Backend
const GEOFENCE_RADIUS_MI = 0.3; // Geofence radius
const MIN_INTERVAL_MINUTES = 10; // Rate limit
```

## 🧪 Testing

### Static Website Testing

- Local server: `python -m http.server 8010`
- Test pages: index.html, services.html, about.html, contact.html
- Check responsive design on different screen sizes
- Test navigation and links

### Employee Portal Testing

- Local server: `python -m http.server 8010`
- Test pages: employeelogin.html, employeeDashboard.html, apply.html
- Check device detection in console
- Test offline mode by disabling network
- Verify PWA installation
- Test multilingual switching

### Backend Testing

- Use test functions in `CLS_EmployeeLogin_TestTools.js`
- Check Activity_Logs sheet for logging entries
- Verify email notifications in Gmail
- Test with different roles (Admin/Lead/Worker)

## 🎨 CSS Architecture

Modular system with design tokens:

```css
/* css/variables.css - Design tokens */
--cls-amber: #f59e0b;
--cls-charcoal: #1f2937;
--spacing-xs: 0.5rem;

/* css/components.css - Reusable UI */
.btn, .card, .status-badge

/* css/layout.css - Site structure */
.navbar, .container, responsive grids;
```

**Cache busting**: Always version CSS/JS includes:

```html
<link rel="stylesheet" href="css/style.css?v=2024-feature-name" />
```

## 🌐 Deployment

### Static Website & Employee Portal (GCP)

Both systems are hosted in the same GCP bucket and deployed together:

```powershell
# One-time setup (if not already done)
gsutil mb -l us-east1 gs://carolina-lumpers-web
gsutil web set -m index.html gs://carolina-lumpers-web

# Deploy all updates (static website + employee portal)
gsutil -m rsync -r -d carolina-lumpers-web gs://carolina-lumpers-web

# Public URLs:
# Static website: https://storage.googleapis.com/carolina-lumpers-web/index.html
# Employee portal: https://storage.googleapis.com/carolina-lumpers-web/employeelogin.html
# Custom domain: https://carolinalumpers.com
```

### Backend (Google Apps Script)

```powershell
# Deploy all projects
cd GoogleAppsScripts
.\push-all.ps1

# Deploy single project
cd EmployeeLogin
clasp push
```

### Cloudflare Worker (Proxy)

- Managed via Cloudflare dashboard
- No code changes needed (forwards requests to Apps Script)

## 🔍 Key Backend Modules

### EmployeeLogin (Main Time Tracking)

```
CLS_EmployeeLogin_Main.js      → Entry point (doGet/doPost routing)
CLS_EmployeeLogin_Config.js    → All constants
CLS_EmployeeLogin_ClockIn.js   → Clock-in logic, geofencing
CLS_EmployeeLogin_Workers.js   → Authentication, user lookup
CLS_EmployeeLogin_Admin.js     → Admin reports, payroll
CLS_EmployeeLogin_Utils.js     → Shared utilities
CLS_EmployeeLogin_Logger.js    → TT_LOGGER wrapper for centralized logging
```

### Centralized Logging (Library)

- **Library ID**: `1aAsNI4ZSFg843_MvwTUI8RgmYe-qt_njBfiPRBgOwwEjvVSS8KrBhtrv`
- **Version**: 1.2.0
- **Usage**: All projects use wrapper functions (e.g., `TT_LOGGER.logClockIn()`)
- **Target**: Activity_Logs sheet in CLS_Hub_Backend

## 📊 Database

**Primary Spreadsheet**: CLS_Hub_Backend  
**Sheet ID**: `1U8hSNREN5fEhskp0UM-Z80iiW39beaOj3oIsaLZyFzk`

**Key Sheets**:

- **ClockIn** - All clock-in/out records (with EditStatus column)
- **Workers** - Employee roster with roles
- **Clients** - Client locations for geofencing
- **Activity_Logs** - Centralized event logging (14 columns)
- **TimeEditRequests** - Time correction requests
- **Payroll** - Payroll summaries

See `.github/DATABASE_SCHEMA.md` for complete structure.

## 🐛 Common Pitfalls

### ❌ Wrong: Direct Apps Script URL

```javascript
fetch("https://script.google.com/macros/s/.../exec");
```

### ✅ Correct: Use Proxy

```javascript
fetch("https://cls-proxy.s-garay.workers.dev?action=...");
```

### ❌ Wrong: Missing Device Tracking

```javascript
fetch(`${API_URL}?action=login&email=${email}`);
```

### ✅ Correct: Include Device Info

```javascript
const deviceInfo = getDeviceInfo();
fetch(
  `${API_URL}?action=login&email=${email}&device=${encodeURIComponent(
    deviceInfo.displayString,
  )}`,
);
```

### ❌ Wrong: Old Logging Pattern

```javascript
logEvent_("ClockIn", data); // Deprecated
```

### ✅ Correct: Use Centralized Logging

```javascript
TT_LOGGER.logClockIn(workerData, locationData);
```

## 👥 Contact

For questions or support:

- **Developer**: Steve Garay - [s.garay@carolinalumpers.com](mailto:s.garay@carolinalumpers.com)
- **Documentation**: See `.github/copilot-instructions.md` for comprehensive guide

---

**Last Updated**: 2025-11-10  
**System Version**: Frontend v2024 | Backend EmployeeLogin v3.0 | CLLogger v1.2.0
