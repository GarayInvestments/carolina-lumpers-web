/**
 * Email Builder for Approval Summaries
 * Version: 1.0
 */

// Cache for Service ID -> Rate Type lookups from Services sheet
const SERVICE_RATE_TYPE_CACHE = { loaded: false, map: {} };

/**
 * Load Services sheet into cache keyed by Service ID
 * @return {Object} - Map of serviceId -> rateType (lowercase)
 */
function loadServiceRateTypes() {
  if (SERVICE_RATE_TYPE_CACHE.loaded) return SERVICE_RATE_TYPE_CACHE.map;

  const map = {};
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(
      CONFIG.SHEET_NAMES.SERVICES
    );
    if (!sheet) {
      Logger.log("Services sheet not found for rate type lookup");
      return map;
    }

    const values = sheet.getDataRange().getValues();
    const headers = values.shift();
    const serviceIdIdx = headers.indexOf(CONFIG.COLUMNS.SERVICES.SERVICE_ID);
    const rateTypeIdx = headers.indexOf(CONFIG.COLUMNS.SERVICES.RATE_TYPE);

    if (serviceIdIdx === -1 || rateTypeIdx === -1) {
      Logger.log("Services sheet missing Service ID or Rate Type columns");
      return map;
    }

    values.forEach((row) => {
      const serviceId = row[serviceIdIdx];
      const rateType = row[rateTypeIdx];
      if (serviceId) {
        map[String(serviceId).trim()] = String(rateType || "")
          .trim()
          .toLowerCase();
      }
    });

    SERVICE_RATE_TYPE_CACHE.loaded = true;
    SERVICE_RATE_TYPE_CACHE.map = map;
  } catch (err) {
    Logger.log(`loadServiceRateTypes error: ${err.message}`);
  }

  return map;
}

/**
 * Get rate type for a given service ID from cache
 * @param {string} serviceId
 * @return {string} - rate type (lowercase) or empty string
 */
function getServiceRateType(serviceId) {
  if (!serviceId) return "";
  const map = loadServiceRateTypes();
  return map[String(serviceId).trim()] || "";
}

/**
 * Determine if a task is hourly/non-container based on Services rate type
 * Falls back to task-level rate type column and finally empty-container heuristic
 * @param {Object} task - Task object from Tasks table
 * @return {boolean} - True if hourly task
 */
function isHourlyTask(task) {
  // 1) Preferred: Services sheet lookup by Service ID
  const serviceId = task[CONFIG.COLUMNS.TASKS.SERVICE_ID];
  const serviceRateType = getServiceRateType(serviceId);
  if (serviceRateType.includes("hourly")) return true;
  if (serviceRateType.includes("fixed")) return false;

  // 2) Fallback: rate type stored directly on task (with/without space after colon)
  const rateTypeKeys = [
    CONFIG.COLUMNS.TASKS.SERVICE_RATE_TYPE,
    "Services: Rate Type",
    "Rate Type",
  ];

  let rateType = "";
  for (let i = 0; i < rateTypeKeys.length; i++) {
    const val = task[rateTypeKeys[i]];
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      rateType = String(val).trim().toLowerCase();
      break;
    }
  }

  if (rateType.includes("hourly")) return true;
  if (rateType.includes("fixed")) return false;

  // 3) Legacy heuristic when rate type is absent
  const containerValue = task[CONFIG.COLUMNS.TASKS.CONTAINER_NUMBER];
  return !containerValue || String(containerValue).trim() === "";
}

/**
 * CSS Style Constants for Email Templates
 * Centralized styling for consistency and maintainability
 */
const EMAIL_STYLES = {
  tableCell: "padding: 8px;",
  tableCellCenter: "padding: 8px; text-align: center;",
  tableCellRight: "padding: 8px; text-align: right;",
  tableRow: "border-bottom: 1px solid #ddd;",
  tableHeader: "padding: 10px; text-align: left;",
  tableHeaderCenter: "padding: 10px; text-align: center;",
  tableHeaderRight: "padding: 10px; text-align: right;",
  sectionTitle:
    "color: #003366; border-bottom: 2px solid #003366; padding-bottom: 10px;",
  table:
    "width: 100%; border-collapse: collapse; background-color: white; margin-bottom: 20px;",
  tableHeaderRow: "background-color: #f0f0f0; border-bottom: 2px solid #ddd;",
};

/**
 * Build table rows for a list of tasks
 * @param {Array} tasks - Task array to render
 * @param {boolean} appendWorkerNames - Whether to append worker names in the description cell
 * @return {string} - HTML table rows
 */
function buildTaskTableRows(tasks, appendWorkerNames) {
  const workerLookup = getWorkerLookup();
  return tasks
    .map((task, idx) => {
      const containerOrProject =
        task[CONFIG.COLUMNS.TASKS.CONTAINER_NUMBER] || "N/A";
      const startTime = formatTimeEST(task[CONFIG.COLUMNS.TASKS.START_TIME]);
      const endTime = formatTimeEST(task[CONFIG.COLUMNS.TASKS.END_TIME]);
      const duration = task[CONFIG.COLUMNS.TASKS.DURATION] || "0";
      const workerListRaw = task[CONFIG.COLUMNS.TASKS.WORKER] || "";
      const workerCount = countWorkers(workerListRaw);

      // Append resolved worker names to the description cell only when requested
      const workerNames = appendWorkerNames
        ? resolveWorkerNames(workerListRaw, workerLookup)
        : "";
      const descriptionWithNames = appendWorkerNames && workerNames
        ? `${containerOrProject} - ${workerNames}`
        : containerOrProject;

      return `
      <tr style="${EMAIL_STYLES.tableRow}">
        <td style="${EMAIL_STYLES.tableCellCenter}">${idx + 1}</td>
        <td style="${EMAIL_STYLES.tableCell}">${descriptionWithNames}</td>
        <td style="${EMAIL_STYLES.tableCell}">${startTime}</td>
        <td style="${EMAIL_STYLES.tableCell}">${endTime}</td>
        <td style="${EMAIL_STYLES.tableCellRight}">${parseFloat(
        duration
      ).toFixed(2)}</td>
        <td style="${EMAIL_STYLES.tableCellCenter}">${workerCount}</td>
      </tr>
    `;
    })
    .join("");
}

/**
 * Build task table HTML with title and header
 * @param {string} title - Table section title
 * @param {string} headerLabel - Label for container/project column
 * @param {string} tableRows - Pre-built HTML rows
 * @return {string} - Complete table HTML or empty string if no rows
 */
function buildTaskTable(title, headerLabel, tableRows) {
  if (!tableRows) return "";

  return `
        <h2 style="${EMAIL_STYLES.sectionTitle}">${title}</h2>
        <table style="${EMAIL_STYLES.table}">
          <thead>
            <tr style="${EMAIL_STYLES.tableHeaderRow}">
              <th style="${EMAIL_STYLES.tableHeader}">#</th>
              <th style="${EMAIL_STYLES.tableHeader}">${headerLabel}</th>
              <th style="${EMAIL_STYLES.tableHeader}">Start</th>
              <th style="${EMAIL_STYLES.tableHeader}">End</th>
              <th style="${EMAIL_STYLES.tableHeaderRight}">Hours</th>
              <th style="${EMAIL_STYLES.tableHeaderCenter}">Workers</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
  `;
}

/**
 * Format time value to HH:MM AM/PM format
 */
function formatTimeEST(timeInput) {
  try {
    if (!timeInput || timeInput === "N/A") return "N/A";

    let date;

    // If it's a Date object with time
    if (timeInput instanceof Date) {
      date = timeInput;
    } else if (typeof timeInput === "number") {
      // Convert decimal hours (e.g., 0.5 = 12:00 AM) to milliseconds
      const totalMs = timeInput * 86400000; // Convert days to milliseconds
      date = new Date(totalMs);
    } else if (typeof timeInput === "string") {
      // Try parsing as time string
      date = new Date(`2000-01-01 ${timeInput}`);
    }

    if (!date || isNaN(date.getTime())) {
      return String(timeInput);
    }

    // Format as "HH:MM AM/PM" in EST
    return Utilities.formatDate(date, "America/New_York", "h:mm aa");
  } catch (err) {
    Logger.log(`formatTimeEST error: ${err.message}`);
    return String(timeInput);
  }
}

/**
 * Format date to clean EST format
 */
function formatDateEST(dateInput) {
  try {
    let date;

    // Convert to Date object if needed
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === "string") {
      // Remove timezone info if present (e.g., "Mon Jan 12 2026 00:00:00 GMT-0500")
      const cleanDate = dateInput.split(" GMT")[0];
      date = new Date(cleanDate);
    } else {
      // Try converting directly
      date = new Date(dateInput);
    }

    // Validate date
    if (!date || isNaN(date.getTime())) {
      Logger.log(`formatDateEST: Invalid date - ${dateInput}`);
      return String(dateInput);
    }

    // Format as "Mon Jan 12, 2026" in EST
    return Utilities.formatDate(date, "America/New_York", "EEE MMM dd, yyyy");
  } catch (err) {
    Logger.log(`formatDateEST error: ${err.message} for input: ${dateInput}`);
    return String(dateInput);
  }
}

/**
 * Build HTML approval email with task summary table
 */
function buildApprovalEmail(approvalId, approvalDate, tasks, approverEmail) {
  const formattedDate = formatDateEST(approvalDate);
  const taskCount = tasks.length;
  const totalHours = tasks.reduce(
    (sum, task) => sum + (parseFloat(task[CONFIG.COLUMNS.TASKS.DURATION]) || 0),
    0
  );

  // Split tasks into container and hourly groups
  const containerTasks = tasks.filter((task) => !isHourlyTask(task));
  const hourlyTasks = tasks.filter((task) => isHourlyTask(task));

  // Fetch and encode logo from Google Drive (same as PdfReportGenerator)
  const imageBlob = DriveApp.getFileById(CONFIG.EMAIL.LOGO_IMAGE_ID).getBlob();
  const imageBase64 = Utilities.base64Encode(imageBlob.getBytes());
  const imageDataUri = `data:${imageBlob.getContentType()};base64,${imageBase64}`;

  // Build table rows using helper function
  const containerTableRows = buildTaskTableRows(containerTasks, false);
  const hourlyTableRows = buildTaskTableRows(hourlyTasks, true);

  // Build complete tables using helper function
  const containerTable = buildTaskTable(
    "Container Unload Operations",
    "Container",
    containerTableRows
  );
  const hourlyTable = buildTaskTable(
    "Hourly / Non-Container Services",
    "Project / Description",
    hourlyTableRows
  );

  const approvalLink = ScriptApp.getService().getUrl();
  const approveUrl = `${approvalLink}?action=approve&approvalId=${encodeURIComponent(
    approvalId
  )}&email=${encodeURIComponent(approverEmail)}`;
  const flagUrl = `${approvalLink}?action=flag&approvalId=${encodeURIComponent(
    approvalId
  )}&email=${encodeURIComponent(approverEmail)}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto;">
      <div style="background-color: #003366; color: white; padding: 20px; text-align: center;">
        <img src="${imageDataUri}" alt="Carolina Lumpers" style="max-width: 200px; height: auto; margin-bottom: 15px;">
        <h1 style="margin: 0;">Daily Operations Approval</h1>
        <p style="margin: 5px 0; font-size: 14px;">Approval Date: <strong>${formattedDate}</strong></p>
      </div>

      <div style="padding: 20px; background-color: #f5f5f5;">
        <p>Hello,</p>
        <p>Please review and approve the completed container unload operations for <strong>${formattedDate}</strong>.</p>

        <h2 style="${EMAIL_STYLES.sectionTitle}">Summary</h2>
        <p>
          <strong>Total Tasks:</strong> ${taskCount} (${
    containerTasks.length
  } containers, ${hourlyTasks.length} hourly)<br>
          <strong>Total Hours:</strong> ${totalHours.toFixed(2)}
        </p>

        ${containerTable}

        ${hourlyTable}

        <h2 style="color: #003366; border-bottom: 2px solid #003366; padding-bottom: 10px;">Actions</h2>
        <div style="margin: 20px 0;">
          <a href="${approveUrl}" style="display: inline-block; padding: 10px 20px; margin-right: 10px; background-color: #28a745; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">✓ Approve All</a>
          <a href="${flagUrl}" style="display: inline-block; padding: 10px 20px; background-color: #ff9800; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">⚠ Flag for Review</a>
        </div>

        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          <strong>Approval ID:</strong> ${approvalId}<br>
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    </div>
  `;

  return html;
}

/**
 * Send approval email
 */
function sendApprovalEmail(recipientEmail, subject, htmlBody) {
  try {
    GmailApp.sendEmail(recipientEmail, subject, "", {
      htmlBody: htmlBody,
      name: "Carolina Lumpers Operations",
    });
    Logger.log(`✅ Email sent to ${recipientEmail}`);
    return true;
  } catch (err) {
    Logger.log(`❌ Email send failed: ${err.message}`);
    return false;
  }
}
