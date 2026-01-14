/**
 * Debug Helper Functions
 * Run these to troubleshoot issues
 */

/**
 * List all ApprovalIDs in the DailyOpsApprovals sheet
 */
function DEBUG_listAllApprovalIDs() {
  Logger.log("=== ALL APPROVAL IDs IN SHEET ===");

  const sheet = SpreadsheetApp.openById(
    PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID")
  ).getSheetByName("DailyOpsApprovals");

  if (!sheet) {
    Logger.log("❌ DailyOpsApprovals sheet not found!");
    return;
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  Logger.log(`Headers: ${headers.join(", ")}`);
  Logger.log(`Total rows (including header): ${data.length}`);

  const idIndex = headers.indexOf("ApprovalID");

  if (idIndex === -1) {
    Logger.log("❌ ApprovalID column not found in headers!");
    return;
  }

  Logger.log(
    `\nApprovalID column is at index ${idIndex} (column ${String.fromCharCode(
      65 + idIndex
    )})`
  );
  Logger.log("\nRecords found:");

  for (let i = 1; i < data.length; i++) {
    const approvalId = data[i][idIndex];
    if (approvalId) {
      Logger.log(`  Row ${i + 1}: ${approvalId} (type: ${typeof approvalId})`);
    }
  }

  if (data.length === 1) {
    Logger.log("⚠️ No data rows found (only header row exists)");
  }
}

/**
 * Test fetching a specific approval record
 */
function DEBUG_testFetchRecord(approvalId = "APR-TEST-20260112-001") {
  Logger.log(`=== TEST FETCH: ${approvalId} ===`);

  const record = fetchApprovalRecord(approvalId);

  if (record) {
    Logger.log("✅ Record found!");
    Logger.log(JSON.stringify(record, null, 2));
  } else {
    Logger.log("❌ Record NOT found");
    Logger.log("\nRunning DEBUG_listAllApprovalIDs to show what exists...");
    DEBUG_listAllApprovalIDs();
  }
}

/**
 * Show DailyOpsApprovals sheet structure
 */
function DEBUG_showSheetStructure() {
  Logger.log("=== DAILYOPSAPPROVALS SHEET STRUCTURE ===");

  const sheet = SpreadsheetApp.openById(
    PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID")
  ).getSheetByName("DailyOpsApprovals");

  if (!sheet) {
    Logger.log("❌ Sheet not found!");
    return;
  }

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  Logger.log(`Last row with data: ${lastRow}`);
  Logger.log(`Last column with data: ${lastCol}`);

  if (lastRow > 0) {
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    Logger.log(`\nColumn headers (${headers.length}):`);
    headers.forEach((header, idx) => {
      Logger.log(`  [${idx}] ${String.fromCharCode(65 + idx)}: ${header}`);
    });

    if (lastRow > 1) {
      Logger.log(`\nFirst data row (row 2):`);
      const firstRow = sheet.getRange(2, 1, 1, lastCol).getValues()[0];
      headers.forEach((header, idx) => {
        Logger.log(`  ${header}: ${firstRow[idx]}`);
      });
    } else {
      Logger.log("\n⚠️ No data rows (sheet only has header row)");
    }
  } else {
    Logger.log("❌ Sheet is completely empty!");
  }
}
