/**
 * Updated Utilities.gs - Utility Functions for Invoice & QBO Sync System
 * Version: 3.1
 * Last Updated: 2025-02-05
 */

/**
 * Returns the current timestamp in the desired format adjusted to Eastern Time (ET).
 * Used for logging and updating timestamps.
 * @returns {string} - The formatted timestamp.
 */
function getCurrentTimestamp() {
  var now = new Date();
  var formattedTimestamp = Utilities.formatDate(
    now,
    "America/New_York",
    "M/d/yyyy HH:mm:ss"
  );
  Logger.log(formattedTimestamp); // Output: "3/21/2025 18:30:09"
  return formattedTimestamp;
}
/**
 * Logs a message with details to the Log sheet.
 * Supports 2 or 4 parameter signatures for flexibility.
 * @param {string} details - The details of the log event.
 * @param {string} statusOrInvoiceNumber - The status (2-param) or invoice number (4-param).
 * @param {string} statusIfFourParam - The status (4-param only).
 * @param {string} descriptionIfFourParam - The description (4-param only).
 */
function logEvent(
  details,
  statusOrInvoiceNumber,
  statusIfFourParam,
  descriptionIfFourParam
) {
  try {
    const sheet = getLogSheet();
    const timestamp = getCurrentTimestamp();

    // Handle both 2-param and 4-param signatures
    if (statusIfFourParam === undefined) {
      // 2-param signature: logEvent(details, status)
      sheet.appendRow([timestamp, details, statusOrInvoiceNumber]);
    } else {
      // 4-param signature: logEvent(details, invoiceNumber, status, description)
      const invoiceNumber = statusOrInvoiceNumber;
      const status = statusIfFourParam;
      const description = descriptionIfFourParam;
      sheet.appendRow([
        timestamp,
        `${details} (Invoice: ${invoiceNumber})`,
        description,
        status,
      ]);
    }
  } catch (err) {
    Logger.log(`❌ logEvent Error: ${err.message}`);
    // Attempt to log the error to sheet as fallback
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Log");
      if (sheet) {
        sheet.appendRow([
          new Date().toISOString(),
          "LOGGING ERROR",
          err.message,
          "Error",
        ]);
      }
    } catch (fallbackErr) {
      // Silent fail if logging fails completely
    }
  }
}

/**
 * Fetches all data from a specified Google Sheets tab.
 * @param {string} sheetName - The name of the Google Sheet tab.
 * @returns {Array|null} - A 2D array of sheet data or null if the sheet is not found.
 */
function getSheetData(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    logEvent("Sheet Access", sheetName, "Error", "Sheet not found.");
    return null;
  }
  return sheet.getDataRange().getValues();
}

/**
 * Creates a key-value map from a Google Sheet for efficient lookups.
 * @param {string} sheetName - The name of the Google Sheet tab.
 * @param {number} keyColumnIndex - The index of the column to be used as the key.
 * @returns {Object} - A map with keys corresponding to the selected column.
 */
function getInvoiceMap(sheetName, keyColumnIndex) {
  const data = getSheetData(sheetName);
  if (!data) return {};
  let map = {};
  for (let i = 1; i < data.length; i++) {
    if (data[i][keyColumnIndex]) {
      // Ensuring key column has valid data
      map[data[i][keyColumnIndex]] = data[i];
    }
  }
  return map;
}
/**
 * Returns the log sheet where log entries are stored.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} - The log sheet.
 */
function getLogSheet() {
  const sheetName = "Log"; // Replace with the actual name of your log sheet
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Log sheet with name '${sheetName}' not found.`);
  }
  return sheet;
}
