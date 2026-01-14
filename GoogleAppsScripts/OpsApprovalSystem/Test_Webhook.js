/**
 * Test the doPost webhook handler directly
 * Run this to simulate an AppSheet webhook call
 */
function TEST_simulateAppSheetWebhook() {
  Logger.log("=== SIMULATING APPSHEET WEBHOOK ===");

  // Simulate the payload AppSheet would send
  const testPayload = {
    ApprovalID: "APR-TEST-20260112-001",
    ApprovalDate: "2026-01-12",
    OperationsManager: "s.garay@carolinalumpers.com",
    Status: "Pending",
    Notes: "Test webhook simulation",
  };

  Logger.log("Test payload:");
  Logger.log(JSON.stringify(testPayload, null, 2));

  // Simulate the Apps Script request object
  const mockRequest = {
    postData: {
      contents: JSON.stringify(testPayload),
      type: "application/json",
    },
  };

  Logger.log("\nCalling doPost()...");

  try {
    const response = doPost(mockRequest);
    const content = response.getContent();

    Logger.log("\n✅ Response received:");
    Logger.log(content);

    const parsed = JSON.parse(content);
    if (parsed.ok) {
      Logger.log("\n✅ Webhook processed successfully!");
      Logger.log("Check your email for the approval message");
      Logger.log("Check the Log sheet for webhook entry");
    } else {
      Logger.log("\n❌ Webhook returned error:");
      Logger.log(parsed.error || "Unknown error");
    }
  } catch (err) {
    Logger.log("\n❌ Error calling doPost:");
    Logger.log(err.message);
    Logger.log(err.stack);
  }
}
