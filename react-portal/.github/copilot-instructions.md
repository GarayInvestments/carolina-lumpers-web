# CLS Employee Portal - AI Coding Agent Instructions

## Project Overview
React-based employee portal for Carolina Lumpers Service (warehouse/logistics workforce). **Mid-migration from Google Sheets backend to Supabase PostgreSQL**. Core features: GPS clock-in, time tracking, W-9 management, role-based dashboards (Worker/Supervisor/Admin).

## Critical: Dual API Architecture
The app runs **two backends in parallel** controlled by `VITE_USE_SUPABASE` env var:
- **Supabase** (new): PostgreSQL, auth, real-time - Workers/W9 tables migrated ✅
- **Google Sheets** (legacy): Still active for clock-ins, time edits, payroll

**When writing API calls:**
```javascript
// Check flag first in src/services/api.js
const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE === "true";
if (USE_SUPABASE) {
  const { supabaseApi } = await import("./supabase.js");
  return await supabaseApi.methodName();
}
// Fallback to legacy Google Apps Script
```

See [src/services/api.js](src/services/api.js) wrapper and [src/services/supabase.js](src/services/supabase.js) for Supabase methods. Never bypass this pattern.

## Tech Stack
- **Frontend**: React 18 + Vite, React Router v6, TanStack Query v5
- **State**: Zustand (global), React Context (auth, theme), TanStack Query (server)
- **Backend**: Supabase (auth, PostgreSQL) + legacy Google Apps Script
- **Styling**: Tailwind CSS with custom CLS colors (`cls-amber: #FFBF00`, `cls-charcoal: #1a1a1a`)
- **i18n**: react-i18next (en/es/pt) - all user-facing text must use `t()` helper
- **Build**: Vite PWA plugin for offline support

## Project Structure Patterns
```
src/
├── services/          # API layer - START HERE for backend changes
│   ├── api.js        # Dual-API router (checks VITE_USE_SUPABASE)
│   ├── supabase.js   # Supabase client + supabaseApi methods
│   └── storage.js    # localStorage wrapper
├── features/auth/    # Auth context + PrivateRoute guard
├── pages/            # Route components (WorkerDashboard, AdminDashboard, etc.)
├── components/       # Shared UI (Button, Badge, ClockInButton, etc.)
└── i18n/{en,es,pt}.json  # Translations
```

## Key Conventions

### Authentication & Authorization
- User object shape: `{ workerId, displayName, email, role, w9Status, language }`
- Roles: `'Admin'`, `'Lead'` (supervisor), `'Worker'` - stored in Supabase `workers.role`
- Auth context in [src/features/auth/AuthContext.jsx](src/features/auth/AuthContext.jsx) - use `useAuth()` hook
- Route protection: Wrap with `<ProtectedRoute roles={['Admin', 'Lead']}>` in [App.jsx](src/App.jsx)

### Role-Based UI
- Dashboard routes to role-specific page: Worker → `WorkerDashboard.jsx`, Admin → `AdminDashboard.jsx`
- Use `user.role` checks for conditional rendering:
  ```javascript
  const { user } = useAuth();
  if (user.role === 'Admin') { /* show admin tools */ }
  ```

### Component Patterns
- **Reusable primitives**: `Button`, `Badge`, `Card`, `Table` in [src/components/](src/components/)
- **Badge variants**: `success`, `warning`, `error`, `info`, `default` - used heavily for status display
- **GPS-based actions**: See [ClockInButton.jsx](src/components/ClockInButton.jsx) for geolocation pattern with `enableHighAccuracy: true`

### Data Fetching
- **TanStack Query** for server state:
  ```javascript
  const { data, isLoading } = useQuery({
    queryKey: ['workers'],
    queryFn: () => supabaseApi.getAllWorkers(),
    refetchInterval: 30000 // Auto-refresh pattern
  });
  ```
- QueryClient config in [App.jsx](src/App.jsx) - 5min staleTime, refetchOnWindowFocus disabled

### Internationalization
- All strings through `useTranslation()`: `const { t } = useTranslation()`
- Pattern: `t('namespace.key', 'Fallback text')`
- Add new keys to all three [src/i18n/*.json](src/i18n/) files

### Tailwind Styling
- Brand colors: Use Tailwind classes `bg-cls-amber`, `text-cls-charcoal`, etc.
- Dark mode: `dark:bg-cls-dark dark:text-gray-100` - theme toggle exists but not exposed in UI yet
- Responsive: Mobile-first with `sm:`, `md:`, `lg:` breakpoints

## Database Schema (Supabase)
```sql
workers (
  id UUID PRIMARY KEY,
  worker_id TEXT UNIQUE,        -- "SG-001", "CLS001"
  display_name TEXT,
  email TEXT UNIQUE,
  role TEXT CHECK (role IN ('Admin', 'Lead', 'Worker')),
  w9_status TEXT DEFAULT 'pending',
  language TEXT DEFAULT 'en',
  auth_user_id UUID,            -- Links to Supabase auth.users
  is_active BOOLEAN DEFAULT true
)
```
Row-level security enabled - admins can edit, all can view active workers.

## Development Workflows

### Running the App
```bash
npm run dev          # Dev server on :5173
npm run build        # Production build
npm run preview      # Preview production build
```

### Database Setup & Migration
```bash
# Sync workers from Google Sheets → Supabase
node scripts/migration/sync-workers-from-sheets.js --execute

# Run SQL migrations (apply in Supabase SQL Editor)
sql/migrations/001-create-w9-table.sql
sql/migrations/002-migrate-to-uuid.sql
```

### Testing
- Test scripts in `scripts/test/` - run with `node scripts/test/test-*.js`
- No Jest/Vitest tests written yet - validate manually

## Common Tasks

### Adding a New API Method
1. Add to `supabaseApi` object in [src/services/supabase.js](src/services/supabase.js)
2. Add dual-API wrapper in [src/services/api.js](src/services/api.js) with `USE_SUPABASE` check
3. Update component to call via `api.methodName()`

### Creating a New Page
1. Create `src/pages/MyPage.jsx`
2. Add route in [App.jsx](src/App.jsx) `<Routes>` block
3. Add nav item in [src/layouts/DashboardLayout.jsx](src/layouts/DashboardLayout.jsx) with role check
4. Wrap with `<ProtectedRoute roles={[...]}>` if access restricted

### Adding Translation Keys
1. Add to [src/i18n/en.json](src/i18n/en.json) with descriptive key
2. Copy to [es.json](src/i18n/es.json) and [pt.json](src/i18n/pt.json)
3. Use Spanish translator for `es`, Portuguese for `pt` (workforce languages)

## Migration Context (Important!)
- **Phase 1 Complete**: Workers table migrated (18 workers)
- **Phase 2 Complete**: W9 submissions migrated (4 records)
- **Still on Google Sheets**: Clock-ins, time edit requests, payroll calculations
- See [docs/migration/MIGRATION_PROGRESS.md](docs/migration/MIGRATION_PROGRESS.md) for full roadmap

When adding features touching clock-ins/time tracking, assume **legacy Google Sheets backend** until migration completes. Check `docs/migration/` for current phase status before modifying time-related APIs.

## Documentation
- [README.md](README.md) - Quick start, features, project structure
- [docs/SETUP.md](docs/SETUP.md) - Environment setup, dependencies
- [docs/migration/](docs/migration/) - Migration plan, progress, session notes
- [docs/guides/](docs/guides/) - Feature-specific guides (User Switcher, Direct Sheets Access)

## Supabase Project
- **Project ID**: `dxbybjxpglpslmoenqyg`
- **URL**: `https://dxbybjxpglpslmoenqyg.supabase.co`
- **Organization**: Carolina Lumpers Service (GarayInvestments)

## Gotchas
- **Never expose** `SUPABASE_SERVICE_KEY` to frontend - only in backend scripts
- **Device info logging**: Use `getDeviceInfo()` from api.js for clock-ins (user-agent parsing)
- **Google Sheets proxy**: Optional Node.js server in `server/` for direct Sheets API access (bypasses Apps Script)
- **W9 banner**: Auto-shows on dashboard when `user.w9Status !== 'approved'` - managed by context
