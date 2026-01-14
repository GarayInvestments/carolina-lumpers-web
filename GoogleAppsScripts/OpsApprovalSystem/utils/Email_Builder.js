/**
 * Email Builder for Approval Summaries
 * Version: 1.0
 */

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
 * Verify task data before building email
 * Checks if CONFIG column names match actual task data structure
 * Call: verifyTaskData() or verifyTaskData("APR-20260111-001")
 */
function verifyTaskData(approvalId = "APR-20260111-001") {
  Logger.log(
    "\n╔════════════════════════════════════════════════════════════╗"
  );
  Logger.log("║           VERIFY TASK DATA STRUCTURE                       ║");
  Logger.log("╚════════════════════════════════════════════════════════════╝");

  Logger.log(`\n📋 Fetching tasks for: ${approvalId}`);
  const tasks = fetchLinkedTasks(approvalId);

  if (!tasks || tasks.length === 0) {
    Logger.log("\n❌ NO TASKS FOUND - Check approval ID\n");
    return false;
  }

  Logger.log(`✅ Found ${tasks.length} tasks\n`);

  const task = tasks[0]; // Check first task
  Logger.log("═ FIRST TASK DATA STRUCTURE ═\n");

  // Check key columns
  const columnsToCheck = [
    { configKey: "CONTAINER_NUMBER", label: "Container" },
    { configKey: "START_TIME", label: "Start Time" },
    { configKey: "END_TIME", label: "End Time" },
    { configKey: "DURATION", label: "Duration" },
    { configKey: "WORKER", label: "Worker" },
  ];

  let allGood = true;
  columnsToCheck.forEach((col) => {
    const configName = CONFIG.COLUMNS.TASKS[col.configKey];
    const value = task[configName];
    const exists = value !== undefined && value !== null;
    const status = exists ? "✅" : "❌";

    Logger.log(`${status} ${col.label}`);
    Logger.log(`   Config key: ${col.configKey}`);
    Logger.log(`   Config name: "${configName}"`);
    Logger.log(`   Value: ${value || "(empty)"}`);
    Logger.log(`   Type: ${typeof value}`);
    Logger.log("");

    if (!exists) {
      allGood = false;
    }
  });

  // Show ALL columns in the task object
  Logger.log("═ ALL COLUMNS IN TASK (Raw Data) ═\n");
  Object.keys(task)
    .sort()
    .forEach((key) => {
      Logger.log(`  "${key}": ${task[key]}`);
    });

  Logger.log(`\n${"═".repeat(60)}`);
  Logger.log(
    allGood
      ? "✅ DATA STRUCTURE OK - All columns found"
      : "❌ MISSING DATA - Check column names in Config"
  );
  Logger.log(`${"═".repeat(60)}\n`);

  return allGood;
}

/**
 * Test worker extraction logic
 */
function testWorkerExtraction(approvalId = "APR-20260111-001") {
  Logger.log(
    "\n╔════════════════════════════════════════════════════════════╗"
  );
  Logger.log("║           TEST WORKER EXTRACTION LOGIC                     ║");
  Logger.log("╚════════════════════════════════════════════════════════════╝");

  const tasks = fetchLinkedTasks(approvalId);
  if (tasks.length === 0) {
    Logger.log("\n❌ No tasks found");
    return;
  }

  Logger.log(`\nTesting worker extraction on ${tasks.length} tasks:\n`);

  tasks.forEach((task, idx) => {
    const workerRaw = task[CONFIG.COLUMNS.TASKS.WORKER];
    const worker =
      typeof workerRaw === "string" ? workerRaw.split(",")[0].trim() : "N/A";

    Logger.log(`Task ${idx + 1}:`);
    Logger.log(`  Raw: ${workerRaw}`);
    Logger.log(`  Type: ${typeof workerRaw}`);
    Logger.log(`  Extracted: ${worker}`);
    Logger.log("");
  });
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
    const formatted = Utilities.formatDate(
      date,
      "America/New_York",
      "EEE MMM dd, yyyy"
    );
    Logger.log(`formatDateEST: ${dateInput} → ${formatted}`);
    return formatted;
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

  // Fetch and encode logo from Google Drive (same as PdfReportGenerator)
  const imageBlob = DriveApp.getFileById(CONFIG.EMAIL.LOGO_IMAGE_ID).getBlob();
  const imageBase64 = Utilities.base64Encode(imageBlob.getBytes());
  const imageDataUri = `data:${imageBlob.getContentType()};base64,${imageBase64}`;

  let taskTableRows = "";
  tasks.forEach((task, idx) => {
    const container = task[CONFIG.COLUMNS.TASKS.CONTAINER_NUMBER] || "N/A";
    const startTime = formatTimeEST(task[CONFIG.COLUMNS.TASKS.START_TIME]);
    const endTime = formatTimeEST(task[CONFIG.COLUMNS.TASKS.END_TIME]);
    const duration = task[CONFIG.COLUMNS.TASKS.DURATION] || "0";
    const workerCount = countWorkers(task[CONFIG.COLUMNS.TASKS.WORKER] || "");

    taskTableRows += `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 8px; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px;">${container}</td>
        <td style="padding: 8px;">${startTime}</td>
        <td style="padding: 8px;">${endTime}</td>
        <td style="padding: 8px; text-align: right;">${parseFloat(
          duration
        ).toFixed(2)}</td>
        <td style="padding: 8px; text-align: center;">${workerCount}</td>
      </tr>
    `;
  });

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

        <h2 style="color: #003366; border-bottom: 2px solid #003366; padding-bottom: 10px;">Summary</h2>
        <p>
          <strong>Total Containers:</strong> ${taskCount}<br>
          <strong>Total Hours:</strong> ${totalHours.toFixed(2)}
        </p>

        <h2 style="color: #003366; border-bottom: 2px solid #003366; padding-bottom: 10px;">Task Details</h2>
        <table style="width: 100%; border-collapse: collapse; background-color: white; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f0f0f0; border-bottom: 2px solid #ddd;">
              <th style="padding: 10px; text-align: left;">#</th>
              <th style="padding: 10px; text-align: left;">Container</th>
              <th style="padding: 10px; text-align: left;">Start</th>
              <th style="padding: 10px; text-align: left;">End</th>
              <th style="padding: 10px; text-align: right;">Hours</th>
              <th style="padding: 10px; text-align: center;">Workers</th>
            </tr>
          </thead>
          <tbody>
            ${taskTableRows}
          </tbody>
        </table>

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

/**
 * Verify dates and times in approval data
 * Call this to debug date/time issues before sending emails
 */
function verifyApprovalDatesAndTimes(approvalDate, tasks) {
  Logger.log("╔════════════════════════════════════════════════════════════╗");
  Logger.log("║        DATE & TIME VERIFICATION FUNCTION                   ║");
  Logger.log("╚════════════════════════════════════════════════════════════╝");

  // Verify approval date
  Logger.log("\n📅 APPROVAL DATE VERIFICATION:");
  Logger.log(`  Raw input: ${approvalDate}`);
  Logger.log(`  Type: ${typeof approvalDate}`);
  Logger.log(`  Is Date object: ${approvalDate instanceof Date}`);

  const formattedApprovalDate = formatDateEST(approvalDate);
  Logger.log(`  Formatted: "${formattedApprovalDate}"`);

  // Check if date is valid (not epoch)
  const dateObj = new Date(approvalDate);
  const isEpoch =
    dateObj.getFullYear() === 1899 || dateObj.getFullYear() === 1970;
  Logger.log(
    `  ⚠️  Is Epoch Date (1899/1970): ${
      isEpoch ? "YES - DATA ERROR!" : "NO - OK"
    }`
  );

  // Verify each task's times
  Logger.log("\n⏰ TASK TIME VERIFICATION:");
  Logger.log(`  Total tasks: ${tasks.length}`);

  tasks.forEach((task, idx) => {
    Logger.log(`\n  Task ${idx + 1}:`);

    const startTimeRaw = task[CONFIG.COLUMNS.TASKS.START_TIME];
    const endTimeRaw = task[CONFIG.COLUMNS.TASKS.END_TIME];
    const workerRaw =
      task[CONFIG.COLUMNS.TASKS.WORKER_NAME] ||
      task[CONFIG.COLUMNS.TASKS.WORKER_ID];

    Logger.log(`    Start Time Raw: ${startTimeRaw}`);
    Logger.log(`    Start Type: ${typeof startTimeRaw}`);
    Logger.log(`    Start Is Date: ${startTimeRaw instanceof Date}`);

    if (startTimeRaw instanceof Date) {
      Logger.log(`    Start Year: ${startTimeRaw.getFullYear()}`);
      Logger.log(
        `    ⚠️  Is Epoch: ${
          startTimeRaw.getFullYear() === 1899 ? "YES - DATA ERROR!" : "NO - OK"
        }`
      );
    }

    const formattedStart = formatTimeEST(startTimeRaw);
    Logger.log(`    Formatted Start: "${formattedStart}"`);

    Logger.log(`    End Time Raw: ${endTimeRaw}`);
    Logger.log(`    End Type: ${typeof endTimeRaw}`);
    const formattedEnd = formatTimeEST(endTimeRaw);
    Logger.log(`    Formatted End: "${formattedEnd}"`);

    Logger.log(`    Worker Raw: ${workerRaw}`);
    Logger.log(`    Worker Type: ${typeof workerRaw}`);
  });

  Logger.log(
    "\n╔════════════════════════════════════════════════════════════╗"
  );
  Logger.log("║ If you see 'Is Epoch: YES' above, the source data has     ║");
  Logger.log("║ dates in 1899 format. Check your Tasks table in AppSheet. ║");
  Logger.log("║ Dates should be actual dates, not formulas.               ║");
  Logger.log("╚════════════════════════════════════════════════════════════╝");
}

/**
 * Test formatDateEST function with various input types
 */
function TEST_formatDateEST() {
  Logger.log("╔════════════════════════════════════════════════════════════╗");
  Logger.log("║           Testing formatDateEST() Function                 ║");
  Logger.log("╚════════════════════════════════════════════════════════════╝");

  // Test 1: Date object from Google Sheets
  Logger.log("\nTest 1: Date object (Jan 12, 2026)");
  const sheetDate = new Date(2026, 0, 12);
  const result1 = formatDateEST(sheetDate);
  Logger.log(`  Input:  ${sheetDate}`);
  Logger.log(`  Output: "${result1}"`);
  Logger.log(`  Expected: "Mon Jan 12, 2026"`);
  Logger.log(`  ✓ PASS: ${result1 === "Mon Jan 12, 2026" ? "YES" : "NO"}`);

  // Test 2: String with timezone (the problematic one from emails)
  Logger.log("\nTest 2: String with timezone");
  const verboseString =
    "Mon Jan 12 2026 00:00:00 GMT-0500 (Eastern Standard Time)";
  const result2 = formatDateEST(verboseString);
  Logger.log(`  Input:  "${verboseString}"`);
  Logger.log(`  Output: "${result2}"`);
  Logger.log(`  Expected: "Mon Jan 12, 2026"`);
  Logger.log(`  ✓ PASS: ${result2 === "Mon Jan 12, 2026" ? "YES" : "NO"}`);

  // Test 3: ISO string
  Logger.log("\nTest 3: ISO string");
  const isoString = "2026-01-12T00:00:00Z";
  const result3 = formatDateEST(isoString);
  Logger.log(`  Input:  "${isoString}"`);
  Logger.log(`  Output: "${result3}"`);
  Logger.log(`  Expected: "Mon Jan 12, 2026"`);
  Logger.log(`  ✓ PASS: ${result3 === "Mon Jan 12, 2026" ? "YES" : "NO"}`);

  // Test 4: Simple date string
  Logger.log("\nTest 4: Simple date string");
  const simpleString = "Mon Jan 12 2026";
  const result4 = formatDateEST(simpleString);
  Logger.log(`  Input:  "${simpleString}"`);
  Logger.log(`  Output: "${result4}"`);
  Logger.log(`  Expected: "Mon Jan 12, 2026"`);
  Logger.log(`  ✓ PASS: ${result4 === "Mon Jan 12, 2026" ? "YES" : "NO"}`);

  // Test 5: Today's date
  Logger.log("\nTest 5: Today's date");
  const today = new Date();
  const result5 = formatDateEST(today);
  const todayExpected = Utilities.formatDate(
    today,
    "America/New_York",
    "EEE MMM dd, yyyy"
  );
  Logger.log(`  Input:  ${today}`);
  Logger.log(`  Output: "${result5}"`);
  Logger.log(`  Expected: "${todayExpected}"`);
  Logger.log(`  ✓ PASS: ${result5 === todayExpected ? "YES" : "NO"}`);

  Logger.log(
    "\n╔════════════════════════════════════════════════════════════╗"
  );
  Logger.log("║ All tests completed! Check results above.                  ║");
  Logger.log("║ If all show PASS: YES, date formatting is working!         ║");
  Logger.log("╚════════════════════════════════════════════════════════════╝");
}
