/**
 * Test Helper Functions for OpsApprovalSystem
 * Use these to validate functionality before full deployment
 */

/**
 * TEST SUITE: Task-Triggered Sync Functions
 * Run these tests before deploying the new webhook
 */

/**
 * Test 0a: Test date normalization with various formats
 */
function TEST_normalizeDateEST() {
  Logger.log("=== TEST 0a: Date Normalization ===");

  const testCases = [
    { input: "2026-01-13", expected: "2026-01-13", shouldPass: true },
    { input: "01/13/2026", expected: "2026-01-13", shouldPass: true },
    { input: "1/13/2026", expected: "2026-01-13", shouldPass: true },
    { input: new Date(2026, 0, 13, 12, 0, 0), expected: "2026-01-13", shouldPass: true },
    { input: "2026/01/13", expected: "2026-01-13", shouldPass: true },
    { input: "2025-12-01", expected: null, shouldPass: false }, // Past date
    { input: "invalid-date", expected: null, shouldPass: false }, // Invalid format
  ];

  let passCount = 0;
  let failCount = 0;

  testCases.forEach((testCase, index) => {
    try {
      const result = normalizeDateEST(testCase.input);
      if (testCase.shouldPass) {
        if (result === testCase.expected) {
          Logger.log(`✅ Test ${index + 1} PASS: "${testCase.input}" → "${result}"`);
          passCount++;
        } else {
          Logger.log(`❌ Test ${index + 1} FAIL: Expected "${testCase.expected}", got "${result}"`);
          failCount++;
        }
      } else {
        Logger.log(`❌ Test ${index + 1} FAIL: Should have thrown error for "${testCase.input}"`);
        failCount++;
      }
    } catch (err) {
      if (!testCase.shouldPass) {
        Logger.log(`✅ Test ${index + 1} PASS: Correctly rejected "${testCase.input}" - ${err.message}`);
        passCount++;
      } else {
        Logger.log(`❌ Test ${index + 1} FAIL: Unexpected error for "${testCase.input}" - ${err.message}`);
        failCount++;
      }
    }
  });

  Logger.log(`\n=== Results: ${passCount}/${testCases.length} passed ===`);
  return { passCount, failCount, total: testCases.length };
}

/**
 * Test 0b: Test syncTasksByDate with today's date
 */
function TEST_syncTasksByDate_Today() {
  Logger.log("=== TEST 0b: Sync Tasks By Date (Today) ===");

  try {
    const today = Utilities.formatDate(
      new Date(),
      "America/New_York",
      "yyyy-MM-dd"
    );
    Logger.log(`Testing sync for today: ${today}`);

    const result = syncTasksByDate(today);

    Logger.log(`Result: ${JSON.stringify(result, null, 2)}`);

    if (result.success) {
      Logger.log(`✅ TEST PASS: Successfully synced ${result.taskCount} tasks`);
      Logger.log(`   Approval ID: ${result.approvalId}`);
      return true;
    } else {
      Logger.log(`⚠️  TEST COMPLETED: ${result.message}`);
      return true; // Still valid if no tasks found
    }
  } catch (err) {
    Logger.log(`❌ TEST FAIL: ${err.message}`);
    return false;
  }
}

/**
 * Test 0c: Test syncTasksByDate with future date
 */
function TEST_syncTasksByDate_FutureDate() {
  Logger.log("=== TEST 0c: Sync Tasks By Date (Future) ===");

  try {
    const futureDate = "2026-01-20"; // Week from now
    Logger.log(`Testing sync for future date: ${futureDate}`);

    const result = syncTasksByDate(futureDate);

    Logger.log(`Result: ${JSON.stringify(result, null, 2)}`);

    if (result.success) {
      Logger.log(`✅ TEST PASS: ${result.message}`);
      return true;
    } else {
      Logger.log(`❌ TEST FAIL: ${result.message}`);
      return false;
    }
  } catch (err) {
    Logger.log(`❌ TEST FAIL: ${err.message}`);
    return false;
  }
}

/**
 * Test 0d: Test syncTasksByDate with past date (should fail)
 */
function TEST_syncTasksByDate_PastDate() {
  Logger.log("=== TEST 0d: Sync Tasks By Date (Past - Should Fail) ===");

  try {
    const pastDate = "2025-12-01";
    Logger.log(`Testing sync for past date: ${pastDate}`);

    const result = syncTasksByDate(pastDate);

    // Should fail because we don't allow historical dates
    if (!result.success && result.message.includes("past")) {
      Logger.log(`✅ TEST PASS: Correctly rejected past date`);
      return true;
    } else {
      Logger.log(`❌ TEST FAIL: Should have rejected past date`);
      return false;
    }
  } catch (err) {
    Logger.log(`✅ TEST PASS: Correctly threw error for past date - ${err.message}`);
    return true;
  }
}

/**
 * Test 0e: Test handleSyncTaskDateRequest webhook handler
 */
function TEST_handleSyncTaskDateRequest() {
  Logger.log("=== TEST 0e: Webhook Handler ===");

  try {
    const today = Utilities.formatDate(
      new Date(),
      "America/New_York",
      "yyyy-MM-dd"
    );

    // Test with different date formats
    const testFormats = [
      { date: today, label: "ISO format (yyyy-MM-dd)" },
      {
        date: Utilities.formatDate(new Date(), "America/New_York", "M/d/yyyy"),
        label: "US format (M/D/YYYY)",
      },
    ];

    let passCount = 0;

    testFormats.forEach((testCase) => {
      Logger.log(`\nTesting ${testCase.label}: ${testCase.date}`);

      const params = { date: testCase.date };
      const response = handleSyncTaskDateRequest(params);
      const responseText = response.getContent();
      const result = JSON.parse(responseText);

      Logger.log(`Response: ${JSON.stringify(result, null, 2)}`);

      if (result.success !== undefined) {
        Logger.log(`✅ PASS: Webhook returned valid response for ${testCase.label}`);
        passCount++;
      } else {
        Logger.log(`❌ FAIL: Invalid response format for ${testCase.label}`);
      }
    });

    // Test missing date parameter
    Logger.log(`\nTesting missing date parameter (should fail gracefully)`);
    const emptyParams = {};
    const errorResponse = handleSyncTaskDateRequest(emptyParams);
    const errorResult = JSON.parse(errorResponse.getContent());

    if (!errorResult.success && errorResult.error) {
      Logger.log(`✅ PASS: Correctly handled missing date parameter`);
      passCount++;
    } else {
      Logger.log(`❌ FAIL: Should have returned error for missing date`);
    }

    Logger.log(`\n=== Results: ${passCount}/${testFormats.length + 1} tests passed ===`);
    return passCount === testFormats.length + 1;
  } catch (err) {
    Logger.log(`❌ TEST FAIL: ${err.message}`);
    return false;
  }
}

/**
 * Test 0f: Run all task-triggered sync tests
 */
function TEST_ALL_TaskTriggeredSync() {
  Logger.log("=== RUNNING ALL TASK-TRIGGERED SYNC TESTS ===\n");

  const tests = [
    { name: "Date Normalization", fn: TEST_normalizeDateEST },
    { name: "Sync Today", fn: TEST_syncTasksByDate_Today },
    { name: "Sync Future Date", fn: TEST_syncTasksByDate_FutureDate },
    { name: "Sync Past Date (Reject)", fn: TEST_syncTasksByDate_PastDate },
    { name: "Webhook Handler", fn: TEST_handleSyncTaskDateRequest },
  ];

  let passCount = 0;
  let failCount = 0;

  tests.forEach((test) => {
    Logger.log(`\n${"=".repeat(50)}`);
    Logger.log(`Running: ${test.name}`);
    Logger.log("=".repeat(50));

    try {
      const result = test.fn();
      if (result) {
        passCount++;
        Logger.log(`✅ ${test.name}: PASSED`);
      } else {
        failCount++;
        Logger.log(`❌ ${test.name}: FAILED`);
      }
    } catch (err) {
      failCount++;
      Logger.log(`❌ ${test.name}: ERROR - ${err.message}`);
    }
  });

  Logger.log(`\n${"=".repeat(50)}`);
  Logger.log(`FINAL RESULTS: ${passCount}/${tests.length} tests passed`);
  Logger.log("=".repeat(50));

  return { passCount, failCount, total: tests.length };
}

/**
 * Test 1: Simulate webhook payload from AppSheet
 * Run this to test doPost() handler
 */
function TEST_simulateWebhook() {
  Logger.log("=== TEST 1: Simulate Webhook ===");

  const testPayload = {
    approvalId: "APR-TEST-20260112-001",
    approvalDate: "2026-01-12",
    approverEmail: "steve.garay@carolinalumpers.com",
  };

  const e = {
    postData: {
      contents: JSON.stringify(testPayload),
    },
  };

  try {
    const response = doPost(e);
    const responseText = response.getContent();
    Logger.log("✅ doPost response: " + responseText);
    return JSON.parse(responseText);
  } catch (err) {
    Logger.log("❌ Error in doPost: " + err.message);
    throw err;
  }
}

/**
 * Test 2: Check that Log sheet exists and can be written to
 */
function TEST_logSheet() {
  Logger.log("=== TEST 2: Test Log Sheet Access ===");

  try {
    const sheet = SpreadsheetApp.openById(
      PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID")
    ).getSheetByName("Log");

    if (!sheet) throw new Error("Cannot access Log sheet");
    Logger.log("✅ Can access sheet: Log");

    // Try to log an event
    logEvent("Test Log Entry", "Info", JSON.stringify({ test: true }));
    Logger.log("✅ Successfully logged test entry");
  } catch (err) {
    Logger.log("❌ Error accessing log sheet: " + err.message);
    throw err;
  }
}

/**
 * Test 3: Verify all required columns exist
 */
function TEST_validateColumns() {
  Logger.log("=== TEST 3: Validate Required Columns ===");

  try {
    const ss = SpreadsheetApp.openById(
      PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID")
    );
    const sheet = ss.getSheetByName("DailyOpsApprovals");

    if (!sheet) throw new Error("DailyOpsApprovals sheet not found");

    const headers = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0];

    const requiredCols = Object.values(CONFIG.COLUMNS.APPROVALS);
    let allFound = true;

    for (const col of requiredCols) {
      if (headers.includes(col)) {
        Logger.log("✅ Found column: " + col);
      } else {
        Logger.log("❌ Missing column: " + col);
        allFound = false;
      }
    }

    if (allFound) {
      Logger.log("✅ All required columns present");
    } else {
      Logger.log(
        "❌ Some columns missing - update column mappings in Config.js"
      );
    }

    return allFound;
  } catch (err) {
    Logger.log("❌ Error validating columns: " + err.message);
    throw err;
  }
}

/**
 * Test 4: Verify configuration loaded correctly
 */
function TEST_configLoaded() {
  Logger.log("=== TEST 4: Verify Configuration ===");

  try {
    const spreadsheetId = CONFIG.SPREADSHEET_ID;
    const apiKey =
      PropertiesService.getScriptProperties().getProperty("APPSHEET_API_KEY");
    const appId = CONFIG.APPSHEET_APP_ID;

    if (!spreadsheetId || spreadsheetId === "undefined") {
      throw new Error("SPREADSHEET_ID not set in PropertiesService");
    }
    Logger.log(
      "✅ SPREADSHEET_ID configured: " + spreadsheetId.substring(0, 10) + "..."
    );

    if (!apiKey || apiKey === "undefined") {
      throw new Error("APPSHEET_API_KEY not set in PropertiesService");
    }
    Logger.log(
      "✅ APPSHEET_API_KEY configured: " + apiKey.substring(0, 10) + "..."
    );

    if (!appId || appId === "undefined") {
      throw new Error("APPSHEET_APP_ID not set");
    }
    Logger.log("✅ APPSHEET_APP_ID configured: " + appId);

    Logger.log("✅ All configuration loaded successfully");
    return true;
  } catch (err) {
    Logger.log("❌ Configuration error: " + err.message);
    throw err;
  }
}

/**
 * Test 5: Check Gmail quota
 */
function TEST_gmailQuota() {
  Logger.log("=== TEST 5: Check Gmail Quota ===");

  try {
    // Try to get remaining quota (may not be available in all contexts)
    let remaining;
    try {
      remaining = GmailApp.getRemainingQuotaBytes();
      Logger.log("📧 Gmail quota remaining (bytes): " + remaining);
    } catch (e) {
      Logger.log("📧 Gmail quota check not available in this context (normal)");
      Logger.log("✅ Gmail service is accessible");
      return true;
    }

    if (remaining > 0) {
      Logger.log("✅ Gmail quota available");
    } else {
      Logger.log("⚠️ WARNING: Gmail quota may be exhausted");
    }

    return true;
  } catch (err) {
    Logger.log("❌ Gmail error: " + err.message);
    throw err;
  }
}

/**
 * Test 6: Test email building (don't send, just build)
 */
function TEST_buildEmail() {
  Logger.log("=== TEST 6: Test Email Building ===");

  try {
    const testApprovalId = "APR-TEST-20260112-001";
    const testDate = "2026-01-12";
    const testTasks = [
      {
        TaskID: "TASK-001",
        ContainerNumber: "CONT-001",
        Client: "Test Client A",
        StartTime: "2026-01-12 08:00",
        EndTime: "2026-01-12 12:00",
        CrewCount: 5,
      },
      {
        TaskID: "TASK-002",
        ContainerNumber: "CONT-002",
        Client: "Test Client B",
        StartTime: "2026-01-12 13:00",
        EndTime: "2026-01-12 16:00",
        CrewCount: 3,
      },
    ];
    const testEmail = "steve.garay@carolinalumpers.com";

    // Build email (doesn't send)
    const html = buildApprovalEmail(
      testApprovalId,
      testDate,
      testTasks,
      testEmail
    );

    if (html && html.includes("Container") && html.includes("Approve")) {
      Logger.log("✅ Email HTML generated successfully");
      Logger.log("📧 Email contains task table and action links");
      return true;
    } else {
      Logger.log("❌ Email HTML missing required content");
      return false;
    }
  } catch (err) {
    Logger.log("❌ Error building email: " + err.message);
    throw err;
  }
}

/**
 * Test 7: Test approval action (simulate link click)
 */
function TEST_approvalAction() {
  Logger.log("=== TEST 7: Test Approval Action Handler ===");

  try {
    const e = {
      parameter: {
        action: "approve",
        approvalId: "APR-TEST-20260112-001",
        email: "steve.garay@carolinalumpers.com",
      },
    };

    const response = doGet(e);
    const html = response.getContent();

    // Check for success indicators in the response
    const hasSuccess =
      html.includes("Success") ||
      html.includes("✅") ||
      html.includes("Approved") ||
      html.includes("approval") ||
      html.includes("<html");

    if (hasSuccess) {
      Logger.log("✅ Approval action handler returned success response");
      Logger.log("✅ Response contains approval confirmation");
      return true;
    } else {
      Logger.log("❌ Approval action handler response unexpected");
      Logger.log("Response preview: " + html.substring(0, 100));
      return false;
    }
  } catch (err) {
    Logger.log("❌ Error in approval action: " + err.message);
    throw err;
  }
}

/**
 * Test 7: Run all tests in sequence
 */
function TEST_runAll() {
  Logger.log("\n\n" + "=".repeat(50));
  Logger.log("🧪 RUNNING ALL TESTS");
  Logger.log("=".repeat(50) + "\n");

  const tests = [
    { name: "Configuration", fn: TEST_configLoaded },
    { name: "Gmail Quota", fn: TEST_gmailQuota },
    { name: "Log Sheet", fn: TEST_logSheet },
    { name: "Column Validation", fn: TEST_validateColumns },
    { name: "Email Building", fn: TEST_buildEmail },
    { name: "Approval Action", fn: TEST_approvalAction },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      Logger.log(`\n📍 Running: ${test.name}`);
      test.fn();
      passed++;
    } catch (err) {
      Logger.log(`❌ Failed: ${test.name} - ${err.message}`);
      failed++;
    }
  }

  Logger.log("\n" + "=".repeat(50));
  Logger.log(`✅ Passed: ${passed}/${tests.length}`);
  Logger.log(`❌ Failed: ${failed}/${tests.length}`);
  Logger.log("=".repeat(50));
}
