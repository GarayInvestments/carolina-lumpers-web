/**
 * Worker Lookup from Google Sheets (Fallback)
 * Used when AppSheet API is unavailable
 */

let sheetWorkerCache = null;

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
