/**
 * Transfer Supabase Data to New Project
 * 
 * Migrates workers and W9 submissions from old project to new project
 * 
 * OLD: dxbybjxpglpslmoenqyg
 * NEW: celubbvmoqpsmioapzlg
 * 
 * Prerequisites:
 * 1. Run SQL migrations on NEW project first (001, 002, 003)
 * 2. Set up environment variables for both projects
 * 3. Ensure service role keys are available
 * 
 * Usage:
 *   node scripts/migration/transfer-to-new-project.js           # Dry run
 *   node scripts/migration/transfer-to-new-project.js --execute # Execute transfer
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = !args.includes("--execute");

// Old project (source)
const OLD_PROJECT_URL = "https://dxbybjxpglpslmoenqyg.supabase.co";
const OLD_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // Current key

// New project (destination)
const NEW_PROJECT_URL = "https://celubbvmoqpsmioapzlg.supabase.co";
const NEW_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY_NEW; // Need to add this to .env.local

if (!OLD_SERVICE_KEY || !NEW_SERVICE_KEY) {
  console.error("❌ Missing service keys!");
  console.error("Ensure SUPABASE_SERVICE_KEY and SUPABASE_SERVICE_KEY_NEW are set in .env.local");
  process.exit(1);
}

const oldSupabase = createClient(OLD_PROJECT_URL, OLD_SERVICE_KEY);
const newSupabase = createClient(NEW_PROJECT_URL, NEW_SERVICE_KEY);

/**
 * Generate a temporary password for auth account creation
 */
function generateTempPassword() {
  return Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
}

/**
 * Export workers from old project
 */
async function exportWorkers() {
  console.log("📤 Exporting workers from old project...\n");

  const { data: workers, error } = await oldSupabase
    .from("workers")
    .select("*")
    .order("created_at");

  if (error) {
    console.error("❌ Error fetching workers:", error.message);
    throw error;
  }

  console.log(`✅ Found ${workers.length} workers to migrate\n`);
  return workers;
}

/**
 * Export W9 submissions from old project
 */
async function exportW9Submissions() {
  console.log("📤 Exporting W9 submissions from old project...\n");

  const { data: w9s, error } = await oldSupabase
    .from("w9_submissions")
    .select("*")
    .order("submitted_date");

  if (error) {
    console.error("❌ Error fetching W9 submissions:", error.message);
    throw error;
  }

  console.log(`✅ Found ${w9s.length} W9 submissions to migrate\n`);
  return w9s;
}

/**
 * Import workers to new project
 */
async function importWorkers(workers) {
  console.log("📥 Importing workers to new project...\n");

  const results = {
    success: [],
    failed: [],
  };

  for (const worker of workers) {
    try {
      // Step 1: Create Supabase Auth account (if they had one)
      let newAuthUserId = null;
      
      if (worker.email && worker.auth_user_id) {
        const tempPassword = generateTempPassword();
        
        const { data: authData, error: authError } = await newSupabase.auth.admin.createUser({
          email: worker.email,
          password: tempPassword,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            display_name: worker.display_name,
            role: worker.role,
            migrated_from: OLD_PROJECT_URL,
            original_auth_id: worker.auth_user_id,
          },
        });

        if (authError) {
          console.error(`   ❌ Failed to create auth for ${worker.email}:`, authError.message);
          results.failed.push({ worker: worker.worker_id, reason: `Auth creation failed: ${authError.message}` });
          continue;
        }

        newAuthUserId = authData.user.id;
        console.log(`   ✅ Created auth account for ${worker.email}`);
      }

      // Step 2: Insert worker record with same ID (UUID)
      const workerData = {
        id: worker.id, // Preserve UUID
        worker_id: worker.worker_id,
        display_name: worker.display_name,
        email: worker.email,
        phone: worker.phone,
        role: worker.role,
        hourly_rate: worker.hourly_rate,
        w9_status: worker.w9_status,
        language: worker.language,
        is_active: worker.is_active,
        notes: worker.notes,
        auth_user_id: newAuthUserId,
        created_at: worker.created_at,
        updated_at: worker.updated_at,
      };

      const { error: insertError } = await newSupabase
        .from("workers")
        .insert(workerData);

      if (insertError) {
        console.error(`   ❌ Failed to insert ${worker.worker_id}:`, insertError.message);
        results.failed.push({ worker: worker.worker_id, reason: `Insert failed: ${insertError.message}` });
        continue;
      }

      console.log(`   ✅ Migrated ${worker.worker_id} - ${worker.display_name}`);
      results.success.push(worker.worker_id);

    } catch (err) {
      console.error(`   ❌ Unexpected error for ${worker.worker_id}:`, err.message);
      results.failed.push({ worker: worker.worker_id, reason: err.message });
    }
  }

  return results;
}

/**
 * Import W9 submissions to new project
 */
async function importW9Submissions(w9s) {
  console.log("\n📥 Importing W9 submissions to new project...\n");

  const results = {
    success: [],
    failed: [],
  };

  for (const w9 of w9s) {
    try {
      const { error: insertError } = await newSupabase
        .from("w9_submissions")
        .insert({
          id: w9.id, // Preserve UUID
          worker_id: w9.worker_id,
          w9_record_id: w9.w9_record_id,
          legal_name: w9.legal_name,
          business_name: w9.business_name,
          tax_classification: w9.tax_classification,
          address: w9.address,
          city: w9.city,
          state: w9.state,
          zip: w9.zip,
          ssn_encrypted: w9.ssn_encrypted,
          ssn_last4: w9.ssn_last4,
          backup_withholding: w9.backup_withholding,
          pdf_url: w9.pdf_url,
          status: w9.status,
          submitted_date: w9.submitted_date,
          reviewed_date: w9.reviewed_date,
          reviewed_by: w9.reviewed_by,
          rejection_reason: w9.rejection_reason,
          admin_notes: w9.admin_notes,
          created_at: w9.created_at,
          updated_at: w9.updated_at,
        });

      if (insertError) {
        console.error(`   ❌ Failed to insert W9 ${w9.w9_record_id}:`, insertError.message);
        results.failed.push({ w9: w9.w9_record_id, reason: insertError.message });
        continue;
      }

      console.log(`   ✅ Migrated W9 ${w9.w9_record_id} for worker ${w9.worker_id}`);
      results.success.push(w9.w9_record_id);

    } catch (err) {
      console.error(`   ❌ Unexpected error for W9 ${w9.w9_record_id}:`, err.message);
      results.failed.push({ w9: w9.w9_record_id, reason: err.message });
    }
  }

  return results;
}

/**
 * Main migration function
 */
async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  Supabase Project Transfer");
  console.log("  FROM: dxbybjxpglpslmoenqyg");
  console.log("  TO:   celubbvmoqpsmioapzlg");
  console.log("═══════════════════════════════════════════════════════════════\n");

  if (DRY_RUN) {
    console.log("🔍 DRY RUN MODE - No changes will be made");
    console.log("   Run with --execute to perform actual migration\n");
  }

  try {
    // Export data from old project
    const workers = await exportWorkers();
    const w9s = await exportW9Submissions();

    console.log("📊 Migration Summary:");
    console.log(`   Workers: ${workers.length}`);
    console.log(`   W9 Submissions: ${w9s.length}\n`);

    if (DRY_RUN) {
      console.log("✅ Data export successful!");
      console.log("\nWorker Preview:");
      workers.slice(0, 5).forEach(w => {
        console.log(`   - ${w.worker_id}: ${w.display_name} (${w.email}) [${w.role}]`);
      });
      if (workers.length > 5) {
        console.log(`   ... and ${workers.length - 5} more`);
      }

      console.log("\nW9 Submissions Preview:");
      w9s.slice(0, 5).forEach(w => {
        console.log(`   - ${w.w9_record_id}: ${w.legal_name} [${w.status}]`);
      });
      if (w9s.length > 5) {
        console.log(`   ... and ${w9s.length - 5} more`);
      }

      console.log("\n✅ Dry run complete! Run with --execute to migrate.");
      return;
    }

    // Execute migration
    console.log("🚀 Starting migration...\n");

    const workerResults = await importWorkers(workers);
    const w9Results = await importW9Submissions(w9s);

    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("  Migration Complete!");
    console.log("═══════════════════════════════════════════════════════════════\n");

    console.log("Workers:");
    console.log(`   ✅ Success: ${workerResults.success.length}`);
    console.log(`   ❌ Failed: ${workerResults.failed.length}`);
    if (workerResults.failed.length > 0) {
      console.log("\nFailed Workers:");
      workerResults.failed.forEach(f => {
        console.log(`   - ${f.worker}: ${f.reason}`);
      });
    }

    console.log("\nW9 Submissions:");
    console.log(`   ✅ Success: ${w9Results.success.length}`);
    console.log(`   ❌ Failed: ${w9Results.failed.length}`);
    if (w9Results.failed.length > 0) {
      console.log("\nFailed W9s:");
      w9Results.failed.forEach(f => {
        console.log(`   - ${f.w9}: ${f.reason}`);
      });
    }

    console.log("\n📝 Next Steps:");
    console.log("   1. Update .env.local with new project credentials");
    console.log("   2. Test login with existing worker accounts");
    console.log("   3. Users will need to reset passwords (auth accounts recreated)");
    console.log("   4. Verify W9 data in new project");
    console.log("   5. Update documentation with new project ID\n");

  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
