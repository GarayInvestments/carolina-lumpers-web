/**
 * Temporary Setup Function - Adds all required properties to PropertiesService
 * RUN THIS ONCE in Google Apps Script, then delete this file
 */

function setupProperties() {
  const scriptProperties = PropertiesService.getScriptProperties();

  // Set all three properties
  scriptProperties.setProperty(
    "SPREADSHEET_ID",
    "1U8hSNREN5fEhskp0UM-Z80iiW39beaOj3oIsaLZyFzk"
  );
  scriptProperties.setProperty(
    "APPSHEET_API_KEY",
    "V2-ZHKXU-KgQG7-2R2G9-sqDXc-lylt9-QGkjy-hQnBI-NHY4x"
  );
  scriptProperties.setProperty(
    "APPSHEET_APP_ID",
    "4a5b8255-5ee1-4473-bc44-090ac907035b"
  );

  // Verify they were set
  Logger.log("✅ Properties set successfully:");
  Logger.log(
    "SPREADSHEET_ID: " + scriptProperties.getProperty("SPREADSHEET_ID")
  );
  Logger.log(
    "APPSHEET_API_KEY: " +
      scriptProperties.getProperty("APPSHEET_API_KEY").substring(0, 10) +
      "..."
  );
  Logger.log(
    "APPSHEET_APP_ID: " + scriptProperties.getProperty("APPSHEET_APP_ID")
  );

  Logger.log(
    "\n✅ Setup complete! You can now delete the Setup.js file and run tests."
  );
}

/**
 * Create all required tables in Google Sheets
 * RUN THIS AFTER setupProperties()
 */
function createTables() {
  const spreadsheetId =
    PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  const ss = SpreadsheetApp.openById(spreadsheetId);

  // 1. Create DailyOpsApprovals sheet
  createDailyOpsApprovalsSheet(ss);

  // 2. Add OpsApprovalRef column to Tasks sheet
  addOpsApprovalRefToTasks(ss);

  // 3. Create Activity Log sheet
  createActivityLogSheet(ss);

  Logger.log("\n✅ All tables created successfully!");
  Logger.log("   • DailyOpsApprovals");
  Logger.log("   • Tasks (OpsApprovalRef column added)");
  Logger.log("   • Log (Activity logging)");
}

function createDailyOpsApprovalsSheet(ss) {
  const sheetName = "DailyOpsApprovals";
  let sheet = ss.getSheetByName(sheetName);

  if (sheet) {
    Logger.log(`Sheet "${sheetName}" already exists, skipping creation`);
    return;
  }

  sheet = ss.insertSheet(sheetName);

  const headers = [
    "ApprovalID",
    "ApprovalDate",
    "Status",
    "SendForApproval",
    "OperationsManager",
    "ApprovedBy",
    "ApprovedAt",
    "ApprovalMethod",
    "Notes",
    "CreatedBy",
    "CreatedAt",
  ];

  sheet.appendRow(headers);

  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#1a1a1a");
  headerRange.setFontColor("white");
  headerRange.setFontWeight("bold");

  // Set column widths
  sheet.setColumnWidth(1, 150); // ApprovalID
  sheet.setColumnWidth(2, 120); // ApprovalDate
  sheet.setColumnWidth(3, 100); // Status
  sheet.setColumnWidth(4, 120); // SendForApproval
  sheet.setColumnWidth(5, 200); // OperationsManager
  sheet.setColumnWidth(6, 150); // ApprovedBy
  sheet.setColumnWidth(7, 150); // ApprovedAt
  sheet.setColumnWidth(8, 130); // ApprovalMethod
  sheet.setColumnWidth(9, 200); // Notes

  Logger.log(`✅ Created sheet: "${sheetName}"`);
}

function addOpsApprovalRefToTasks(ss) {
  const sheetName = "Tasks";
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    Logger.log(`⚠️ "${sheetName}" sheet not found, skipping column addition`);
    return;
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  if (headers.includes("OpsApprovalRef")) {
    Logger.log(`Column "OpsApprovalRef" already exists in "${sheetName}"`);
    return;
  }

  // Add OpsApprovalRef column
  const newColumn = sheet.getLastColumn() + 1;
  sheet.getRange(1, newColumn).setValue("OpsApprovalRef");

  Logger.log(`✅ Added column "OpsApprovalRef" to "${sheetName}"`);
}

function createActivityLogSheet(ss) {
  const sheetName = "Log";
  let sheet = ss.getSheetByName(sheetName);

  if (sheet) {
    Logger.log(`Sheet "${sheetName}" already exists, skipping creation`);
    return;
  }

  sheet = ss.insertSheet(sheetName);

  const headers = ["Timestamp", "Event", "Details", "ApprovalID", "Status"];

  sheet.appendRow(headers);

  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#1a1a1a");
  headerRange.setFontColor("white");
  headerRange.setFontWeight("bold");

  // Set column widths
  sheet.setColumnWidth(1, 180); // Timestamp
  sheet.setColumnWidth(2, 150); // Event
  sheet.setColumnWidth(3, 300); // Details
  sheet.setColumnWidth(4, 150); // ApprovalID
  sheet.setColumnWidth(5, 100); // Status

  Logger.log(`✅ Created sheet: "${sheetName}"`);
}
