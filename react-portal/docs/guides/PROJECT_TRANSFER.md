# Supabase Project Transfer Guide

**Transfer from**: `dxbybjxpglpslmoenqyg` → **To**: `celubbvmoqpsmioapzlg`

## Prerequisites

### 1. Set Up New Project Database

Run these SQL migrations in your new Supabase project SQL Editor:

```sql
-- Go to: https://supabase.com/dashboard/project/celubbvmoqpsmioapzlg/sql

-- Run in order:
1. sql/migrations/001-create-w9-table.sql
2. sql/migrations/002-migrate-to-uuid.sql  
3. sql/migrations/003-add-auth-column.sql
```

### 2. Update Environment Variables

Add the new project's service key to `.env.local`:

```env
# OLD PROJECT (for export)
SUPABASE_SERVICE_KEY=<your-old-service-key>

# NEW PROJECT (for import)
SUPABASE_SERVICE_KEY_NEW=<get-from-new-project-dashboard>
```

**Get the new service key:**
1. Go to: https://supabase.com/dashboard/project/celubbvmoqpsmioapzlg/settings/api
2. Copy the "service_role" secret key (not anon key!)
3. Add to `.env.local` as `SUPABASE_SERVICE_KEY_NEW`

## Migration Steps

### Step 1: Dry Run (Preview)

```bash
cd react-portal
node scripts/migration/transfer-to-new-project.js
```

This shows what will be migrated without making changes.

### Step 2: Execute Transfer

```bash
node scripts/migration/transfer-to-new-project.js --execute
```

**What gets migrated:**
- ✅ Workers table (~18 workers with UUIDs preserved)
- ✅ W9 submissions (~4 records with UUIDs preserved)
- ✅ Auth accounts recreated (users will need to reset passwords)

### Step 3: Update Project Configuration

After successful migration, update your `.env.local`:

```env
# New Supabase Configuration
VITE_SUPABASE_URL=https://celubbvmoqpsmioapzlg.supabase.co
VITE_SUPABASE_ANON_KEY=<new-anon-key>
SUPABASE_SERVICE_KEY=<new-service-role-key>

# Database Connection
DATABASE_URL=postgresql://postgres:<password>@db.celubbvmoqpsmioapzlg.supabase.co:5432/postgres
```

**Get anon key:**
- Same page as service key: https://supabase.com/dashboard/project/celubbvmoqpsmioapzlg/settings/api

### Step 4: Test the New Project

```bash
# Test connection
node scripts/test/test-supabase-workers.js

# Start dev server
npm run dev
```

Try logging in - **Note**: Users will need to reset their passwords since auth accounts are recreated.

## Important Notes

⚠️ **Auth Accounts**: The migration recreates auth accounts with temporary passwords. Workers will need to use "Forgot Password" to reset.

⚠️ **UUIDs Preserved**: Worker and W9 UUIDs are kept the same, so foreign key relationships are maintained.

⚠️ **Google Sheets**: Still the source of truth for clock-ins and payroll. No changes needed there.

## Rollback Plan

If something goes wrong, you can always:
1. Keep using the old project (just don't update `.env.local`)
2. Re-run the migration after fixing issues
3. The old project remains untouched during migration

## Troubleshooting

**Error: "Missing service keys"**
- Make sure both `SUPABASE_SERVICE_KEY` and `SUPABASE_SERVICE_KEY_NEW` are in `.env.local`

**Error: "Workers table not found"**
- Run the SQL migrations in the new project first

**Error: "Email already exists"**
- The new project may have existing users. Clear auth users or use a fresh project.

## After Migration

Update documentation:
- [ ] `.github/copilot-instructions.md` - Update project ID
- [ ] `docs/migration/MIGRATION_PROGRESS.md` - Update project ID
- [ ] `README.md` - Update Supabase references

Keep old project active for a few days as backup, then can delete once everything is verified.
