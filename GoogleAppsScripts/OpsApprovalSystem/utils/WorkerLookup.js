/**
 * Worker Count Utility
 * Counts unique workers in comma-separated worker lists
 * Simple and efficient - no lookups needed
 */

/**
 * Count unique workers in a comma-separated worker list
 * Example: "AG-025-b1197429 , MNC-026-1f2641df , HH-043-eb90ce66" -> 3
 */
function countWorkers(workerListRaw) {
  if (!workerListRaw) return 0;

  try {
    // Split by comma and filter out empty strings
    const workers = String(workerListRaw)
      .split(",")
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    return workers.length;
  } catch (err) {
    Logger.log(`Error counting workers: ${err.message}`);
    return 0;
  }
}

/**
 * Test worker counter
 * Run: testWorkerCounter()
 */
function testWorkerCounter() {
  Logger.log(
    "\n╔════════════════════════════════════════════════════════════╗"
  );
  Logger.log("║           TEST WORKER COUNTER                              ║");
  Logger.log(
    "╚════════════════════════════════════════════════════════════╝\n"
  );

  // Test cases
  const testCases = [
    {
      input: "AG-025-b1197429",
      expected: 1,
    },
    {
      input: "AG-025-b1197429 , MNC-026-1f2641df , HH-043-eb90ce66",
      expected: 3,
    },
    {
      input: "MNC-026-1f2641df , HH-043-eb90ce66",
      expected: 2,
    },
    {
      input: "",
      expected: 0,
    },
    {
      input: null,
      expected: 0,
    },
  ];

  Logger.log("Testing worker count logic:\n");
  let passed = 0;
  testCases.forEach((test, idx) => {
    const result = countWorkers(test.input);
    const status = result === test.expected ? "✅" : "❌";
    if (result === test.expected) passed++;

    Logger.log(`${status} Test ${idx + 1}:`);
    Logger.log(`   Input: "${test.input}"`);
    Logger.log(`   Expected: ${test.expected}, Got: ${result}`);
  });

  Logger.log(`\n${"═".repeat(60)}`);
  Logger.log(`Results: ${passed}/${testCases.length} tests passed`);
  Logger.log(`${"═".repeat(60)}\n`);
}
