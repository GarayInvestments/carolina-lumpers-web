/**
 * Sync Today's Tasks to DailyOpsApprovals
 * Creates or updates approval record with today's completed tasks
 * Can be triggered manually or scheduled daily
 */

/**
 * Sync tasks for a specific date to DailyOpsApprovals
 * @param {string} targetDate - Date in "yyyy-MM-dd" format (EST timezone)
 * @returns {object} Result object with success status, approvalId, taskCount, and message
 */
function syncTasksByDate(targetDate) {
  // Use LockService to prevent race conditions
  const lock = LockService.getScriptLock();
  const lockAcquired = lock.tryLock(30000); // Wait up to 30 seconds

  if (!lockAcquired) {
    const errorMsg = `Could not acquire lock for date ${targetDate}. Another sync may be in progress.`;
    logEvent("Sync Tasks", "Error", errorMsg);
    return {
      success: false,
      message: errorMsg,
    };
  }

  try {
    logEvent(
      "Task-Triggered Sync",
      "Info",
      `Starting sync for date: ${targetDate}`
    );

    const spreadsheetId = CONFIG.SPREADSHEET_ID;
    const ss = SpreadsheetApp.openById(spreadsheetId);

    Logger.log(`Syncing tasks for: ${targetDate}`);

    // Fetch tasks for target date
    const tasksSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.TASKS);
    if (!tasksSheet) {
      logEvent("Sync Tasks", "Error", "Tasks sheet not found");
      return {
        success: false,
        message: "Tasks sheet not found",
      };
    }

    const tasksData = tasksSheet.getDataRange().getValues();
    const taskHeaders = tasksData[0];

    // Find required columns
    const dateColIdx = taskHeaders.indexOf(CONFIG.COLUMNS.TASKS.DATE);
    const containerColIdx = taskHeaders.indexOf(
      CONFIG.COLUMNS.TASKS.CONTAINER_NUMBER
    );
    const clientColIdx = taskHeaders.indexOf(CONFIG.COLUMNS.TASKS.CLIENT);
    const startTimeColIdx = taskHeaders.indexOf(
      CONFIG.COLUMNS.TASKS.START_TIME
    );
    const endTimeColIdx = taskHeaders.indexOf(CONFIG.COLUMNS.TASKS.END_TIME);
    const durationColIdx = taskHeaders.indexOf(CONFIG.COLUMNS.TASKS.DURATION);
    const opsRefColIdx = taskHeaders.indexOf("OpsApprovalRef");

    if (
      dateColIdx < 0 ||
      containerColIdx < 0 ||
      clientColIdx < 0 ||
      opsRefColIdx < 0
    ) {
      logEvent(
        "Sync Tasks",
        "Error",
        "Required columns not found in Tasks sheet"
      );
      return {
        success: false,
        message: "Missing required columns",
      };
    }

    // Filter tasks for target date
    const targetTasks = [];

    for (let i = 1; i < tasksData.length; i++) {
      const row = tasksData[i];
      const taskDate = Utilities.formatDate(
        new Date(row[dateColIdx]),
        "America/New_York",
        "yyyy-MM-dd"
      );

      if (taskDate === targetDate) {
        targetTasks.push({
          container: row[containerColIdx] || "N/A",
          client: row[clientColIdx] || "N/A",
          startTime: row[startTimeColIdx] || "N/A",
          endTime: row[endTimeColIdx] || "N/A",
          duration: row[durationColIdx] || 0,
          rowIndex: i,
          currentRef: row[opsRefColIdx] || "",
        });
      }
    }

    Logger.log(`Found ${targetTasks.length} tasks for ${targetDate}`);

    if (targetTasks.length === 0) {
      logEvent(
        "Task-Triggered Sync",
        "Info",
        `No tasks found for ${targetDate} - skipping approval creation`
      );
      return {
        success: true,
        message: "No tasks to sync",
        taskCount: 0,
        date: targetDate,
      };
    }

    // Generate approval ID (APR-YYYYMMDD-001)
    const approvalId = generateApprovalId(targetDate);
    Logger.log(`Generated Approval ID: ${approvalId}`);

    // Get or create DailyOpsApprovals sheet
    const approvalsSheet = ss.getSheetByName(
      CONFIG.SHEET_NAMES.DAILY_OPS_APPROVALS
    );
    if (!approvalsSheet) {
      logEvent("Sync Tasks", "Error", "DailyOpsApprovals sheet not found");
      return {
        success: false,
        message: "DailyOpsApprovals sheet not found",
      };
    }

    const approvalsData = approvalsSheet.getDataRange().getValues();
    const approvalHeaders = approvalsData[0];

    // Find approval columns
    const approvalIdColIdx = approvalHeaders.indexOf(
      CONFIG.COLUMNS.APPROVALS.APPROVAL_ID
    );

    if (approvalIdColIdx < 0) {
      logEvent(
        "Sync Tasks",
        "Error",
        "ApprovalID column not found in DailyOpsApprovals"
      );
      return {
        success: false,
        message: "Missing ApprovalID column",
      };
    }

    // Check if approval already exists for this date
    let existingRowIndex = -1;
    for (let i = 1; i < approvalsData.length; i++) {
      if (approvalsData[i][approvalIdColIdx] === approvalId) {
        existingRowIndex = i;
        break;
      }
    }

    // Prepare approval record
    const approvalRecord = {};
    approvalRecord[CONFIG.COLUMNS.APPROVALS.APPROVAL_ID] = approvalId;
    // Create date at noon EST to avoid timezone issues
    const [year, month, day] = targetDate.split("-").map(Number);
    const approvalDate = new Date(year, month - 1, day, 12, 0, 0);
    approvalRecord[CONFIG.COLUMNS.APPROVALS.APPROVAL_DATE] = approvalDate;
    // Set status to Pending (ready for approval)
    approvalRecord[CONFIG.COLUMNS.APPROVALS.STATUS] =
      CONFIG.APPROVAL_STATUS.PENDING;

    if (existingRowIndex >= 0) {
      // Update existing approval
      Logger.log(`Updating existing approval at row ${existingRowIndex + 1}`);
      updateApprovalRecord(approvalId, approvalRecord);
      logEvent(
        "Task-Triggered Sync",
        "Info",
        `Updated existing approval: ${approvalId}`
      );
    } else {
      // Create new approval record
      Logger.log(`Creating new approval record`);
      const newRow = new Array(approvalHeaders.length).fill("");
      for (let header of approvalHeaders) {
        if (approvalRecord[header] !== undefined) {
          newRow[approvalHeaders.indexOf(header)] = approvalRecord[header];
        }
      }
      approvalsSheet.appendRow(newRow);
      logEvent(
        "Task-Triggered Sync",
        "Info",
        `Created new approval: ${approvalId} with status Pending`
      );
    }

    // Link tasks to approval by setting OpsApprovalRef
    for (let i = 0; i < targetTasks.length; i++) {
      const task = targetTasks[i];
      const sheetRowIndex = task.rowIndex + 1; // Sheets are 1-indexed

      if (!task.currentRef || task.currentRef !== approvalId) {
        tasksSheet
          .getRange(sheetRowIndex, opsRefColIdx + 1)
          .setValue(approvalId);
        Logger.log(
          `Linked task at row ${sheetRowIndex} to approval ${approvalId}`
        );
      }
    }

    const result = {
      success: true,
      approvalId: approvalId,
      taskCount: targetTasks.length,
      date: targetDate,
      message: `Synced ${targetTasks.length} tasks to approval ${approvalId}`,
    };

    logEvent("Task-Triggered Sync", "Success", JSON.stringify(result));
    return result;
  } catch (err) {
    Logger.log(`❌ syncTasksByDate Error: ${err.message}`);
    logEvent("Task-Triggered Sync", "Error", err.message);
    return {
      success: false,
      message: err.message,
      date: targetDate,
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Manual trigger: Called from AppSheet button or doGet
 * Fetches today's tasks and creates DailyOpsApprovals record
 * LEGACY: Now delegates to syncTasksByDate for consistency
 */
function syncTodaysTasks() {
  const today = Utilities.formatDate(
    new Date(),
    "America/New_York",
    "yyyy-MM-dd"
  );
  Logger.log(`syncTodaysTasks: Delegating to syncTasksByDate for ${today}`);
  return syncTasksByDate(today);
}

/**
 * Generate approval ID with pattern: APR-YYYYMMDD-001
 */
function generateApprovalId(dateString) {
  const dateObj = new Date(dateString);
  const yyyymmdd = Utilities.formatDate(
    dateObj,
    "America/New_York",
    "yyyyMMdd"
  );

  const spreadsheetId = CONFIG.SPREADSHEET_ID;
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const approvalsSheet = ss.getSheetByName(
    CONFIG.SHEET_NAMES.DAILY_OPS_APPROVALS
  );
  const approvalsData = approvalsSheet.getDataRange().getValues();
  const approvalHeaders = approvalsData[0];
  const approvalIdColIdx = approvalHeaders.indexOf(
    CONFIG.COLUMNS.APPROVALS.APPROVAL_ID
  );

  // Find highest sequence for this date
  let maxSequence = 0;
  const prefix = `APR-${yyyymmdd}-`;

  for (let i = 1; i < approvalsData.length; i++) {
    const id = approvalsData[i][approvalIdColIdx] || "";
    if (id.startsWith(prefix)) {
      const seq = parseInt(id.substring(prefix.length));
      if (seq > maxSequence) {
        maxSequence = seq;
      }
    }
  }

  return `${prefix}${String(maxSequence + 1).padStart(3, "0")}`;
}

/**
 * Scheduled trigger - runs daily at 5 PM EST
 * Can be set up in Google Apps Script Triggers UI
 * Function name: syncTodaysTasks
 */
function onScheduledSync() {
  syncTodaysTasks();
}

/**
 * doGet handler for manual trigger from AppSheet button
 * Usage: Call the Web App URL with ?action=syncTasks
 */
function handleSyncTasksRequest(params) {
  const result = syncTodaysTasks();
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * Handle webhook request to sync tasks for a specific date
 * Called by AppSheet bot when task is created
 * Usage: ?action=syncTaskDate&date=2026-01-13 or ?action=syncTaskDate&date=1/13/2026
 * @param {object} params - URL parameters from doGet(e).parameter
 * @returns {ContentService.TextOutput} JSON response
 */
function handleSyncTaskDateRequest(params) {
  const startTime = new Date().getTime();

  try {
    // Validate date parameter exists
    if (!params.date) {
      const errorResponse = {
        success: false,
        error: "Missing required parameter: date",
        example: "?action=syncTaskDate&date=2026-01-13",
        timestamp: getCurrentTimestamp(),
      };
      logEvent(
        "Task-Triggered Sync",
        "Error",
        "Missing date parameter in webhook request"
      );
      return ContentService.createTextOutput(
        JSON.stringify(errorResponse)
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const rawDate = params.date;
    Logger.log(`handleSyncTaskDateRequest: Received date parameter: ${rawDate}`);

    // Normalize and validate date
    let normalizedDate;
    try {
      normalizedDate = normalizeDateEST(rawDate);
      Logger.log(`handleSyncTaskDateRequest: Normalized date to: ${normalizedDate}`);
    } catch (dateError) {
      const errorResponse = {
        success: false,
        error: dateError.message,
        receivedDate: rawDate,
        timestamp: getCurrentTimestamp(),
      };
      logEvent(
        "Task-Triggered Sync",
        "Error",
        `Invalid date format: ${rawDate} - ${dateError.message}`
      );
      return ContentService.createTextOutput(
        JSON.stringify(errorResponse)
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Perform sync
    const result = syncTasksByDate(normalizedDate);

    // Add execution time to response
    const endTime = new Date().getTime();
    result.executionTimeMs = endTime - startTime;
    result.timestamp = getCurrentTimestamp();

    Logger.log(
      `handleSyncTaskDateRequest: Completed in ${result.executionTimeMs}ms`
    );

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(
      ContentService.MimeType.JSON
    );
  } catch (err) {
    Logger.log(`❌ handleSyncTaskDateRequest Error: ${err.message}`);
    logEvent("Task-Triggered Sync", "Error", `Webhook error: ${err.message}`);

    const errorResponse = {
      success: false,
      error: err.message,
      timestamp: getCurrentTimestamp(),
    };

    return ContentService.createTextOutput(
      JSON.stringify(errorResponse)
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
