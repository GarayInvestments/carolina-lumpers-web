/**
 * Utilities for OpsApprovalSystem
 * Version: 1.0
 */

/**
 * Returns current timestamp in ET
 */
function getCurrentTimestamp() {
  const now = new Date();
  return Utilities.formatDate(now, "America/New_York", "M/d/yyyy HH:mm:ss");
}

/**
 * Normalize date input to yyyy-MM-dd format in EST timezone
 * Accepts multiple formats: "2026-01-13", "1/13/2026", "01/13/2026", Date object
 * @param {string|Date} dateInput - Date in various formats
 * @returns {string} Date in "yyyy-MM-dd" format
 * @throws {Error} If date format is invalid or date is in the past
 */
function normalizeDateEST(dateInput) {
  try {
    let dateObj;

    if (dateInput instanceof Date) {
      dateObj = dateInput;
    } else if (typeof dateInput === "string") {
      // Try ISO format first (yyyy-MM-dd or yyyy/MM/dd)
      if (/^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/.test(dateInput)) {
        const parts = dateInput.split(/[-\/]/);
        dateObj = new Date(
          parseInt(parts[0]),
          parseInt(parts[1]) - 1,
          parseInt(parts[2]),
          12,
          0,
          0
        );
      }
      // Try MM/DD/YYYY or M/D/YYYY format
      else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dateInput)) {
        const parts = dateInput.split("/");
        dateObj = new Date(
          parseInt(parts[2]),
          parseInt(parts[0]) - 1,
          parseInt(parts[1]),
          12,
          0,
          0
        );
      } else {
        throw new Error(
          `Invalid date format: "${dateInput}". Expected formats: "yyyy-MM-dd", "MM/DD/YYYY", or Date object`
        );
      }
    } else {
      throw new Error(
        `Invalid date type: ${typeof dateInput}. Expected string or Date object`
      );
    }

    // Validate the date is valid
    if (isNaN(dateObj.getTime())) {
      throw new Error(`Invalid date: "${dateInput}" could not be parsed`);
    }

    // Check if date is in the past (but allow today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateObj);
    targetDate.setHours(0, 0, 0, 0);

    if (targetDate < today) {
      throw new Error(
        `Historical dates not supported. Date "${dateInput}" is in the past. Only today and future dates are allowed.`
      );
    }

    // Return normalized format
    return Utilities.formatDate(dateObj, "America/New_York", "yyyy-MM-dd");
  } catch (err) {
    Logger.log(`❌ normalizeDateEST Error: ${err.message}`);
    throw err;
  }
}

/**
 * Log event to Log sheet
 * Supports 2 or 4-parameter signatures
 */
function logEvent(
  details,
  statusOrApprovalId,
  statusIfFourParam,
  descriptionIfFourParam
) {
  try {
    const sheet = getLogSheet();
    const timestamp = getCurrentTimestamp();

    if (statusIfFourParam === undefined) {
      // 2-param: logEvent(details, status)
      sheet.appendRow([timestamp, details, statusOrApprovalId]);
    } else {
      // 4-param: logEvent(details, approvalId, status, description)
      const approvalId = statusOrApprovalId;
      const status = statusIfFourParam;
      const description = descriptionIfFourParam;
      sheet.appendRow([
        timestamp,
        `${details} (Approval: ${approvalId})`,
        description,
        status,
      ]);
    }
  } catch (err) {
    Logger.log(`❌ logEvent Error: ${err.message}`);
  }
}

/**
 * Get the Log sheet
 */
function getLogSheet() {
  const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(
    CONFIG.SHEET_NAMES.LOG
  );
  if (!sheet) {
    throw new Error(`Log sheet '${CONFIG.SHEET_NAMES.LOG}' not found`);
  }
  return sheet;
}

/**
 * Get the Approvals sheet
 */
function getApprovalsSheet() {
  const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(
    CONFIG.SHEET_NAMES.DAILY_OPS_APPROVALS
  );
  if (!sheet) {
    throw new Error(
      `Approvals sheet '${CONFIG.SHEET_NAMES.DAILY_OPS_APPROVALS}' not found`
    );
  }
  return sheet;
}

/**
 * Get the Tasks sheet
 */
function getTasksSheet() {
  const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(
    CONFIG.SHEET_NAMES.TASKS
  );
  if (!sheet) {
    throw new Error(`Tasks sheet '${CONFIG.SHEET_NAMES.TASKS}' not found`);
  }
  return sheet;
}

/**
 * Fetch approval record by ApprovalID
 */
function fetchApprovalRecord(approvalId) {
  const sheet = getApprovalsSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf(CONFIG.COLUMNS.APPROVALS.APPROVAL_ID);

  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === approvalId) {
      const record = {};
      headers.forEach((header, idx) => {
        record[header] = data[i][idx];
      });
      return record;
    }
  }
  return null;
}

/**
 * Update approval record status and metadata
 */
function updateApprovalRecord(approvalId, updates) {
  const sheet = getApprovalsSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf(CONFIG.COLUMNS.APPROVALS.APPROVAL_ID);

  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === approvalId) {
      Object.keys(updates).forEach((key) => {
        const colIndex = headers.indexOf(key);
        if (colIndex !== -1) {
          data[i][colIndex] = updates[key];
        }
      });
      sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
      logEvent(
        "Approval Updated",
        approvalId,
        "Success",
        `Updated: ${JSON.stringify(updates)}`
      );
      return true;
    }
  }
  logEvent(
    "Approval Update Failed",
    approvalId,
    "Error",
    "Approval record not found"
  );
  return false;
}

/**
 * Fetch all Tasks linked to an approval by ApprovalID
 */
function fetchLinkedTasks(approvalId) {
  const sheet = getTasksSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const refIndex = headers.indexOf(CONFIG.COLUMNS.TASKS.OPS_APPROVAL_REF);
  const tasks = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][refIndex] === approvalId) {
      const task = {};
      headers.forEach((header, idx) => {
        task[header] = data[i][idx];
      });
      tasks.push(task);
    }
  }

  logEvent(
    "Fetch Tasks",
    approvalId,
    "Info",
    `Found ${tasks.length} linked tasks`
  );
  return tasks;
}
