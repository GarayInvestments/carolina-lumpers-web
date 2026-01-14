/**
 * Test Date Formatting
 * Run this in Google Apps Script editor to verify formatDateEST() works correctly
 *
 * How to use:
 * 1. Open Google Apps Script (apps.google.com/appscripts)
 * 2. Paste this code into a new file
 * 3. Click Run
 * 4. Check Logs (View > Logs)
 */

function TEST_formatDateEST() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║           Testing formatDateEST() Function                 ║");
  console.log(
    "╚════════════════════════════════════════════════════════════╝\n"
  );

  // Test 1: Date object from Google Sheets
  console.log("Test 1: Date object (Jan 12, 2026)");
  const sheetDate = new Date(2026, 0, 12);
  const result1 = formatDateEST(sheetDate);
  console.log(`  Input:  ${sheetDate}`);
  console.log(`  Output: "${result1}"`);
  console.log(`  Expected: "Mon Jan 12, 2026"`);
  console.log(`  ✓ PASS: ${result1 === "Mon Jan 12, 2026" ? "YES" : "NO"}\n`);

  // Test 2: String with timezone (the problematic one from emails)
  console.log("Test 2: String with timezone");
  const verboseString =
    "Mon Jan 12 2026 00:00:00 GMT-0500 (Eastern Standard Time)";
  const result2 = formatDateEST(verboseString);
  console.log(`  Input:  "${verboseString}"`);
  console.log(`  Output: "${result2}"`);
  console.log(`  Expected: "Mon Jan 12, 2026"`);
  console.log(`  ✓ PASS: ${result2 === "Mon Jan 12, 2026" ? "YES" : "NO"}\n`);

  // Test 3: ISO string format
  console.log("Test 3: ISO string");
  const isoString = "2026-01-12T00:00:00Z";
  const result3 = formatDateEST(isoString);
  console.log(`  Input:  "${isoString}"`);
  console.log(`  Output: "${result3}"`);
  console.log(`  Expected: "Mon Jan 12, 2026"`);
  console.log(`  ✓ PASS: ${result3 === "Mon Jan 12, 2026" ? "YES" : "NO"}\n`);

  // Test 4: Simple date string
  console.log("Test 4: Simple date string");
  const simpleString = "Mon Jan 12 2026";
  const result4 = formatDateEST(simpleString);
  console.log(`  Input:  "${simpleString}"`);
  console.log(`  Output: "${result4}"`);
  console.log(`  Expected: "Mon Jan 12, 2026"`);
  console.log(`  ✓ PASS: ${result4 === "Mon Jan 12, 2026" ? "YES" : "NO"}\n`);

  // Test 5: Today's date
  console.log("Test 5: Today's date");
  const today = new Date();
  const result5 = formatDateEST(today);
  const todayExpected = Utilities.formatDate(
    today,
    "America/New_York",
    "EEE MMM dd, yyyy"
  );
  console.log(`  Input:  ${today}`);
  console.log(`  Output: "${result5}"`);
  console.log(`  Expected: "${todayExpected}"`);
  console.log(`  ✓ PASS: ${result5 === todayExpected ? "YES" : "NO"}\n`);

  // Summary
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║ All tests completed! Check results above.                  ║");
  console.log("║ If all show PASS: YES, date formatting is working!         ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
}
