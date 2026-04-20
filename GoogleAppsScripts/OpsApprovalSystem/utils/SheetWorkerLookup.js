/**
 * Worker Lookup from Google Sheets (Fallback)
 * Used when AppSheet API is unavailable
 */

let sheetWorkerCache = null;

/**
 * Build worker lookup from Workers sheet (same spreadsheet)
 * Returns map: workerId -> { id, displayName, email, role }
 */
function getWorkerLookup() {
  if (sheetWorkerCache) return sheetWorkerCache;

  try {
    Logger.log("📊 Fetching workers from spreadsheet lookup...");

    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAMES.WORKERS);

    if (!sheet) {
      Logger.log("⚠️  Workers sheet not found in spreadsheet");
      return {};
    }

    const values = sheet.getDataRange().getValues();
    if (values.length < 2) {
      Logger.log("⚠️  Workers sheet is empty");
      return {};
    }

    const headers = values[0];
    const idx = {
      id: headers.indexOf(CONFIG.COLUMNS.WORKERS.WORKER_ID),
      first: headers.indexOf(CONFIG.COLUMNS.WORKERS.FIRST_NAME),
      last: headers.indexOf(CONFIG.COLUMNS.WORKERS.LAST_NAME),
      email: headers.indexOf(CONFIG.COLUMNS.WORKERS.EMAIL),
      role: headers.indexOf(CONFIG.COLUMNS.WORKERS.ROLE),
    };

    if (idx.id === -1) {
      Logger.log("⚠️  WorkerID column not found");
      return {};
    }

    const cache = {};
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const workerId = String(row[idx.id] || "").trim();
      if (!workerId) continue;

      const first = idx.first === -1 ? "" : String(row[idx.first] || "").trim();
      const last = idx.last === -1 ? "" : String(row[idx.last] || "").trim();
      const displayName = [first, last].filter(Boolean).join(" ") || workerId;

      cache[workerId] = {
        id: workerId,
        displayName,
        email: idx.email === -1 ? "" : row[idx.email],
        role: idx.role === -1 ? "Worker" : row[idx.role] || "Worker",
      };
    }

    Logger.log(`✅ Worker lookup loaded ${Object.keys(cache).length} workers`);
    sheetWorkerCache = cache;
    return cache;
  } catch (err) {
    Logger.log(`❌ Worker lookup error: ${err.message}`);
    return {};
  }
}

/**
 * Fetch workers from Google Sheets Workers table (fallback method)
 */
function getWorkerLookupFromSheet() {
  if (sheetWorkerCache) {
    return sheetWorkerCache;
  }

  try {
    Logger.log("📊 Fetching workers from Google Sheets fallback...");

    const spreadsheet = SpreadsheetApp.openById(
      CONFIG.APPSHEET_SPREADSHEET_ID
    );
    const sheet = spreadsheet.getSheetByName("Workers");

    if (!sheet) {
      Logger.log("⚠️  Workers sheet not found in spreadsheet");
      return {};
    }

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      Logger.log("⚠️  Workers sheet is empty");
      return {};
    }

    const headers = data[0];
    Logger.log(`   Headers: ${headers.join(", ")}`);

    // Find relevant columns (case-insensitive)
    let idColIdx = -1;
    let nameColIdx = -1;

    headers.forEach((header, idx) => {
      const h = String(header).toLowerCase();
      if ((h.includes("worker") || h.includes("id")) && idColIdx === -1) {
        idColIdx = idx;
      }
      if ((h.includes("display") || h.includes("name")) && nameColIdx === -1) {
        nameColIdx = idx;
      }
    });

    if (idColIdx === -1) {
      Logger.log(
        "⚠️  Could not find Worker ID column - trying first column"
      );
      idColIdx = 0;
    }

    if (nameColIdx === -1) {
      Logger.log(
        "⚠️  Could not find Display Name column - using ID column"
      );
      nameColIdx = idColIdx;
    }

    Logger.log(
      `   Using columns: ID=[${idColIdx}] '${headers[idColIdx]}', Name=[${nameColIdx}] '${headers[nameColIdx]}'`
    );

    const cache = {};
    for (let i = 1; i < data.length; i++) {
      const id = String(data[i][idColIdx] || "").trim();
      const displayName = String(
        data[i][nameColIdx] || data[i][idColIdx] || ""
      ).trim();

      if (id && displayName) {
        cache[id] = {
          id: id,
          displayName: displayName,
          email: data[i][3] || "",
          role: data[i][4] || "Worker",
        };
      }
    }

    Logger.log(
      `✅ Sheet fallback loaded ${Object.keys(cache).length} workers`
    );
    sheetWorkerCache = cache;
    return cache;
  } catch (err) {
    Logger.log(`❌ Sheet fallback error: ${err.message}`);
    return {};
  }
}
