/**
 * Helper: Display Tasks sheet column names for verification
 */
function showTasksColumns() {
  Logger.log("\n=== TASKS SHEET COLUMNS ===\n");

  try {
    const ss = SpreadsheetApp.openById(
      PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID")
    );
    const sheet = ss.getSheetByName("Tasks");

    if (!sheet) {
      Logger.log("❌ Tasks sheet not found");
      return;
    }

    const headers = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0];

    Logger.log("Actual columns in Tasks sheet:");
    headers.forEach((col, index) => {
      Logger.log(`  [${index + 1}] ${col}`);
    });

    Logger.log("\n\nExpected columns in CONFIG:");
    const expectedCols = Object.values(CONFIG.COLUMNS.TASKS);
    expectedCols.forEach((col, index) => {
      Logger.log(`  [${index + 1}] ${col}`);
    });

    Logger.log("\n\nComparison:");
    let allMatch = true;
    for (const expectedCol of expectedCols) {
      if (headers.includes(expectedCol)) {
        Logger.log(`  ✅ ${expectedCol}`);
      } else {
        Logger.log(`  ❌ ${expectedCol} (MISSING)`);
        allMatch = false;
      }
    }

    if (allMatch) {
      Logger.log("\n✅ All expected columns found!");
    } else {
      Logger.log("\n⚠️ Some columns are missing from Tasks sheet");
    }

    Logger.log("\n\nExtra columns in sheet (not in CONFIG):");
    let hasExtra = false;
    for (const actualCol of headers) {
      if (!expectedCols.includes(actualCol)) {
        Logger.log(`  • ${actualCol}`);
        hasExtra = true;
      }
    }
    if (!hasExtra) {
      Logger.log("  (none)");
    }
  } catch (err) {
    Logger.log("❌ Error: " + err.message);
  }
}
