/**
 * Approval Actions Handler for OpsApprovalSystem
 * Version: 1.0
 * Handles approval and flag actions from email links
 */

/**
 * Handle GET from approval email action links
 * Query params: ?action=approve|flag&approvalId=...&email=...
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    const approvalId = e.parameter.approvalId;
    const approverEmail = e.parameter.email;

    logEvent(
      "Action Request",
      "Info",
      `action=${action}, approvalId=${approvalId}`
    );

    // Handle sync tasks action (legacy - syncs today's tasks)
    if (action === "syncTasks") {
      return handleSyncTasksRequest(e.parameter);
    }

    // Handle sync specific date action (new - syncs tasks for given date)
    if (action === "syncTaskDate") {
      return handleSyncTaskDateRequest(e.parameter);
    }

    // Validate inputs for approval actions
    if (!action || !approvalId || !approverEmail) {
      logEvent(
        "Action Error: Missing Parameters",
        "Error",
        JSON.stringify(e.parameter)
      );
      return HtmlService.createHtmlOutput(`
        <h2>❌ Error</h2>
        <p>Missing required parameters: action, approvalId, email</p>
      `);
    }

    // Fetch approval record
    const approvalRecord = fetchApprovalRecord(approvalId);
    if (!approvalRecord) {
      logEvent("Approval Not Found", approvalId, "Error");
      return HtmlService.createHtmlOutput(`
        <h2>❌ Error</h2>
        <p>Approval ${approvalId} not found</p>
      `);
    }

    // Process action
    const timestamp = getCurrentTimestamp();
    let status = null;
    let actionLabel = null;

    if (action === "approve") {
      status = CONFIG.APPROVAL_STATUS.APPROVED;
      actionLabel = "✅ Approved";
    } else if (action === "flag") {
      status = CONFIG.APPROVAL_STATUS.EXCEPTION;
      actionLabel = "⚠️ Flagged as Exception";
    } else {
      logEvent("Invalid Action", "Error", `Unknown action: ${action}`);
      return HtmlService.createHtmlOutput(`
        <h2>❌ Error</h2>
        <p>Unknown action: ${action}</p>
      `);
    }

    // Update approval record
    const updateData = {
      [CONFIG.COLUMNS.APPROVALS.STATUS]: status,
      [CONFIG.COLUMNS.APPROVALS.APPROVED_BY]: approverEmail,
      [CONFIG.COLUMNS.APPROVALS.APPROVED_AT]: timestamp,
      [CONFIG.COLUMNS.APPROVALS.APPROVAL_METHOD]: "Web Link",
    };

    updateApprovalRecord(approvalId, updateData);
    logEvent(
      "Approval Action Completed",
      approvalId,
      "Success",
      `${actionLabel} by ${approverEmail}`
    );

    // Fetch logo for success page
    const imageBlob = DriveApp.getFileById(
      CONFIG.EMAIL.LOGO_IMAGE_ID
    ).getBlob();
    const imageBase64 = Utilities.base64Encode(imageBlob.getBytes());
    const imageDataUri = `data:${imageBlob.getContentType()};base64,${imageBase64}`;

    // Return success page
    return HtmlService.createHtmlOutput(`
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 40px; }
            .container { background: white; padding: 40px; border-radius: 8px; text-align: center; max-width: 500px; margin: 0 auto; }
            .logo { text-align: center; margin-bottom: 20px; }
            .logo img { max-width: 150px; height: auto; }
            h2 { color: #27ae60; margin: 0 0 20px 0; font-size: 28px; }
            p { color: #666; margin: 10px 0; }
            .approval-id { font-family: monospace; color: #999; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <img src="${imageDataUri}" alt="Carolina Lumpers">
            </div>
            <h2>${actionLabel}</h2>
            <p>Your response has been recorded.</p>
            <p><strong>Approval ID:</strong> ${approvalId}</p>
            <p><strong>Status:</strong> ${status}</p>
            <p><strong>Time:</strong> ${timestamp}</p>
            <p style="margin-top: 30px; font-size: 12px; color: #999;">
              You can safely close this window.
            </p>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    Logger.log(`❌ doGet Error: ${err.message}`);
    logEvent("Action Handler Error", "Error", err.message);
    return HtmlService.createHtmlOutput(`
      <h2>❌ Error</h2>
      <p>${err.message}</p>
    `);
  }
}
