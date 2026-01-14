/**
 * Main Webhook Handler for OpsApprovalSystem
 * Version: 1.0
 * Receives webhook from AppSheet when SendForApproval = TRUE
 */

/**
 * Handle POST from AppSheet bot when SendForApproval is triggered
 */
function doPost(e) {
  try {
    logEvent("Webhook Received", "Info");

    if (!e.postData || !e.postData.contents) {
      logEvent("Webhook Error: No postData", "Error");
      return ContentService.createTextOutput(
        JSON.stringify({
          status: "❌ Error",
          message: "No postData received",
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Log raw payload for debugging
    logEvent("Raw Payload", "Info", e.postData.contents);

    let requestData;
    try {
      requestData = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      logEvent(
        "JSON Parse Error",
        "Error",
        `${parseErr.message} | Raw: ${e.postData.contents}`
      );
      return ContentService.createTextOutput(
        JSON.stringify({
          status: "❌ Error",
          message: `Failed to parse JSON: ${parseErr.message}`,
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    logEvent("Webhook Payload", "Info", JSON.stringify(requestData));

    // Handle both camelCase and PascalCase field names from AppSheet
    const approvalId = requestData.ApprovalID || requestData.approvalId;
    const approverEmail =
      requestData.OperationsManager || requestData.approverEmail;

    if (!approvalId) {
      logEvent("Webhook Error: Missing ApprovalID", "Error");
      return ContentService.createTextOutput(
        JSON.stringify({
          status: "❌ Error",
          message: "Missing ApprovalID in payload",
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Fetch approval record
    const approvalRecord = fetchApprovalRecord(approvalId);
    if (!approvalRecord) {
      logEvent(
        "Approval Not Found",
        approvalId,
        "Error",
        "Approval record does not exist"
      );
      return ContentService.createTextOutput(
        JSON.stringify({
          status: "❌ Error",
          message: `Approval ${approvalId} not found`,
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    logEvent(
      "Approval Fetched",
      approvalId,
      "Info",
      JSON.stringify(approvalRecord)
    );

    // Fetch linked tasks
    const tasks = fetchLinkedTasks(approvalId);
    if (tasks.length === 0) {
      logEvent("Fetch Tasks", approvalId, "Info", "Found 0 linked tasks");
    } else {
      logEvent(
        "Fetch Tasks",
        approvalId,
        "Info",
        `Found ${tasks.length} linked tasks`
      );
    }

    // Update approval status to Pending
    updateApprovalRecord(approvalId, {
      [CONFIG.COLUMNS.APPROVALS.STATUS]: CONFIG.APPROVAL_STATUS.PENDING,
    });

    // Build and send approval email
    const approvalDate =
      approvalRecord[CONFIG.COLUMNS.APPROVALS.APPROVAL_DATE] || "Unknown";
    const formattedDate = formatDateEST(approvalDate);
    const subject = `Daily Operations Approval - ${formattedDate}`;
    const htmlBody = buildApprovalEmail(
      approvalId,
      approvalDate,
      tasks,
      approverEmail
    );

    const emailSent = sendApprovalEmail(approverEmail, subject, htmlBody);

    if (!emailSent) {
      logEvent(
        "Email Send Failed",
        approvalId,
        "Error",
        `Failed to send email to ${approverEmail}`
      );
      // Update status back to Draft if email fails
      updateApprovalRecord(approvalId, {
        [CONFIG.COLUMNS.APPROVALS.STATUS]: CONFIG.APPROVAL_STATUS.DRAFT,
      });
      return ContentService.createTextOutput(
        JSON.stringify({
          status: "❌ Error",
          message: "Failed to send approval email",
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    logEvent(
      "Approval Email Sent",
      approvalId,
      "Success",
      `Email sent to ${approverEmail}`
    );

    return ContentService.createTextOutput(
      JSON.stringify({
        status: "✅ Success",
        approvalId: approvalId,
        taskCount: tasks.length,
        emailSent: true,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log(`❌ doPost Error: ${err.message}`);
    logEvent("Webhook Error", "Error", err.message);
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "❌ Error",
        message: err.message,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
