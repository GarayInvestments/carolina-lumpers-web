/**
 * AppSheetTouchCurrentWeek.js
 *
 * Touches (updates timestamp fields) for current-week rows in AppSheet to force recalcs/refresh.
 * Week definition: week ending Saturday.
 *
 * Targets:
 * - Payroll LineItems: key LineItemID, touch field "Last Update"
 * - Invoice LineItems: key LineItemID, touch field "Last Update"
 * - Invoices: key "Invoice#", touch field "LastUpdated"
 * - WeeklyFinancials: key WeeklyFinancialsID, touch field "LastUpdated"
 *
 * Requires Script Properties (PayrollProject):
 * - APP_ID
 * - API_KEY
 * - SPREADSHEET_ID (already used by this project)
 */

function touchCurrentWeekAppSheetRows() {
  const startedAt = new Date();
  const result = {
    ok: true,
    startedAt: startedAt.toISOString(),
    weekEnding: null,
    touched: {
      payrollLineItems: 0,
      invoiceLineItems: 0,
      invoices: 0,
      weeklyFinancials: 0,
    },
    errors: [],
  };

  try {
    Logger.log("[AppSheetTouch] Starting touchCurrentWeekAppSheetRows");

    const appId = CONFIG.APP_ID;
    const apiKey = CONFIG.API_KEY;
    const spreadsheetId = CONFIG.SPREADSHEET_ID;

    if (!appId)
      throw new Error('Missing CONFIG.APP_ID (Script Property "APP_ID")');
    if (!apiKey)
      throw new Error('Missing CONFIG.API_KEY (Script Property "API_KEY")');
    if (!spreadsheetId || spreadsheetId === "DEFAULT_SPREADSHEET_ID") {
      throw new Error(
        'Missing CONFIG.SPREADSHEET_ID (Script Property "SPREADSHEET_ID")'
      );
    }

    const weekEnding = getCurrentWeekEndingSaturdayString_();
    result.weekEnding = weekEnding;

    Logger.log(`[AppSheetTouch] weekEnding=${weekEnding}`);

    const touchTimestamp = getCurrentTimestampET_();

    // 1) Payroll LineItems (current week)
    const payrollKeys = collectKeysByWeekPeriod_(
      spreadsheetId,
      CONFIG.SHEETS.PAYROLL_LINE_ITEMS,
      "LineItemID",
      "Week Period",
      weekEnding
    );

    if (payrollKeys.length) {
      Logger.log(
        `[AppSheetTouch] Payroll LineItems keys=${payrollKeys.length}`
      );
      const rows = payrollKeys.map((id) => ({
        LineItemID: id,
        "Last Update": touchTimestamp,
      }));
      const updated = appSheetEditRowsBatched_({
        appId,
        apiKey,
        tableName: "Payroll LineItems",
        rows,
        batchSize: 100,
      });
      result.touched.payrollLineItems = updated;
    }

    // 2) Invoice LineItems (current week)
    const invoiceLineItemKeys = collectKeysByWeekPeriod_(
      spreadsheetId,
      CONFIG.SHEETS.INVOICE_LINE_ITEMS,
      "LineItemID",
      "Week Period",
      weekEnding
    );

    if (invoiceLineItemKeys.length) {
      Logger.log(
        `[AppSheetTouch] Invoice LineItems keys=${invoiceLineItemKeys.length}`
      );
      const rows = invoiceLineItemKeys.map((id) => ({
        LineItemID: id,
        "Last Update": touchTimestamp,
      }));
      const updated = appSheetEditRowsBatched_({
        appId,
        apiKey,
        tableName: "Invoice LineItems",
        rows,
        batchSize: 100,
      });
      result.touched.invoiceLineItems = updated;
    }

    // 3) Invoices (current week based on Date -> week ending Saturday)
    const invoiceKeys = collectInvoiceKeysForWeek_(
      spreadsheetId,
      "Invoices",
      "Invoice#",
      "Date",
      weekEnding
    );

    if (invoiceKeys.length) {
      Logger.log(`[AppSheetTouch] Invoices keys=${invoiceKeys.length}`);
      const rows = invoiceKeys.map((invoiceId) => ({
        "Invoice#": invoiceId,
        LastUpdated: touchTimestamp,
      }));
      const updated = appSheetEditRowsBatched_({
        appId,
        apiKey,
        tableName: "Invoices",
        rows,
        batchSize: 100,
      });
      result.touched.invoices = updated;
    }

    // 4) WeeklyFinancials (current week)
    const weeklyFinancialKeys = collectKeysByWeekPeriod_(
      spreadsheetId,
      "WeeklyFinancials",
      "WeeklyFinancialsID",
      "Week Period",
      weekEnding
    );

    if (weeklyFinancialKeys.length) {
      Logger.log(
        `[AppSheetTouch] WeeklyFinancials keys=${weeklyFinancialKeys.length}`
      );
      const rows = weeklyFinancialKeys.map((id) => ({
        WeeklyFinancialsID: id,
        LastUpdated: touchTimestamp,
      }));
      const updated = appSheetEditRowsBatched_({
        appId,
        apiKey,
        tableName: "WeeklyFinancials",
        rows,
        batchSize: 50,
      });
      result.touched.weeklyFinancials = updated;
    }

    Logger.log(
      `[AppSheetTouch] Completed ok=true touched=${JSON.stringify(
        result.touched
      )}`
    );
    appendLogEntry("INFO", "AppSheet touch current week completed", result);
    return result;
  } catch (err) {
    result.ok = false;
    result.errors.push(err && err.message ? err.message : String(err));

    Logger.log(
      `[AppSheetTouch] Completed ok=false errors=${JSON.stringify(
        result.errors
      )}`
    );

    try {
      appendLogEntry("ERROR", "AppSheet touch current week failed", result);
    } catch (_) {
      // ignore secondary failures
    }

    return result;
  }
}

/**
 * Creates/refreshes the daily trigger for touchCurrentWeekAppSheetRows() at 7pm ET.
 * Run this ONCE manually from the Apps Script editor.
 */
function installDailyTouchCurrentWeekTrigger() {
  const handler = "touchCurrentWeekAppSheetRows";

  // Remove existing triggers for this handler (avoid duplicates)
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach((t) => {
    if (t.getHandlerFunction && t.getHandlerFunction() === handler) {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger(handler)
    .timeBased()
    .inTimezone("America/New_York")
    .everyDays(1)
    .atHour(19)
    .nearMinute(0)
    .create();

  appendLogEntry("INFO", "Installed daily 7pm ET trigger for AppSheet touch", {
    handler,
    timezone: "America/New_York",
    atHour: 19,
  });
}

/**
 * Removes the daily trigger for touchCurrentWeekAppSheetRows().
 */
function uninstallDailyTouchCurrentWeekTrigger() {
  const handler = "touchCurrentWeekAppSheetRows";
  const triggers = ScriptApp.getProjectTriggers();

  let removed = 0;
  triggers.forEach((t) => {
    if (t.getHandlerFunction && t.getHandlerFunction() === handler) {
      ScriptApp.deleteTrigger(t);
      removed++;
    }
  });

  appendLogEntry("INFO", "Uninstalled trigger(s) for AppSheet touch", {
    handler,
    removed,
  });
}

// -------------------------
// Internal helpers
// -------------------------

function getCurrentTimestampET_() {
  return Utilities.formatDate(
    new Date(),
    "America/New_York",
    "M/d/yyyy HH:mm:ss"
  );
}

function getCurrentWeekEndingSaturdayString_() {
  const now = new Date();
  const weekEnd = getWeekEndingSaturday_(now);
  return formatDateYYYYMMDD(weekEnd);
}

function getWeekEndingSaturday_(dateObj) {
  const date = new Date(dateObj);
  const dow = date.getDay(); // 0=Sun ... 6=Sat
  const daysUntilSat = (6 - dow + 7) % 7;
  date.setDate(date.getDate() + daysUntilSat);
  date.setHours(0, 0, 0, 0);
  return date;
}

function normalizeWeekPeriodValue_(value) {
  return formatDateYYYYMMDD(parseDate(value));
}

function collectKeysByWeekPeriod_(
  spreadsheetId,
  sheetName,
  keyColumnName,
  weekPeriodColumnName,
  targetWeekEnding
) {
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error(`Sheet not found: ${sheetName}`);

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0];
  const keyIdx = headers.indexOf(keyColumnName);
  const weekIdx = headers.indexOf(weekPeriodColumnName);

  if (keyIdx === -1)
    throw new Error(
      `Missing column "${keyColumnName}" in sheet "${sheetName}"`
    );
  if (weekIdx === -1)
    throw new Error(
      `Missing column "${weekPeriodColumnName}" in sheet "${sheetName}"`
    );

  const keys = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const key = row[keyIdx];
    const weekVal = row[weekIdx];
    if (!key) continue;

    const normalized = normalizeWeekPeriodValue_(weekVal);
    if (normalized === targetWeekEnding) {
      keys.push(String(key));
    }
  }

  return keys;
}

function collectInvoiceKeysForWeek_(
  spreadsheetId,
  sheetName,
  invoiceKeyColumnName,
  invoiceDateColumnName,
  targetWeekEnding
) {
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error(`Sheet not found: ${sheetName}`);

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0];
  const keyIdx = headers.indexOf(invoiceKeyColumnName);
  const dateIdx = headers.indexOf(invoiceDateColumnName);

  if (keyIdx === -1)
    throw new Error(
      `Missing column "${invoiceKeyColumnName}" in sheet "${sheetName}"`
    );
  if (dateIdx === -1)
    throw new Error(
      `Missing column "${invoiceDateColumnName}" in sheet "${sheetName}"`
    );

  const keys = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const invoiceId = row[keyIdx];
    const invoiceDate = row[dateIdx];
    if (!invoiceId || !invoiceDate) continue;

    const weekEnding = formatDateYYYYMMDD(
      getWeekEndingSaturday_(parseDate(invoiceDate))
    );
    if (weekEnding === targetWeekEnding) {
      keys.push(String(invoiceId));
    }
  }

  return keys;
}

function appSheetEditRowsBatched_({
  appId,
  apiKey,
  tableName,
  rows,
  batchSize,
}) {
  if (!rows || !rows.length) return 0;

  const baseUrl = "https://api.appsheet.com/api/v2/apps/";
  const url = `${baseUrl}${appId}/tables/${encodeURIComponent(
    tableName
  )}/Action`;
  const chunkSize = batchSize || 100;

  let totalUpdated = 0;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);

    const payload = {
      Action: "Edit",
      Properties: {
        Locale: "en-US",
        Timezone: "Eastern Standard Time",
      },
      Rows: chunk,
    };

    const options = {
      method: "POST",
      contentType: "application/json",
      headers: {
        ApplicationAccessKey: apiKey,
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    const text = response.getContentText();

    if (code !== 200) {
      throw new Error(
        `AppSheet API error touching ${tableName} (HTTP ${code}): ${text}`
      );
    }

    totalUpdated += chunk.length;
  }

  return totalUpdated;
}
