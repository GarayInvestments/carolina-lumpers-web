/**
 * AppSheet API Integration
 * Version: 1.0
 */

/**
 * Fetch data from AppSheet via API
 */
function fetchFromAppSheet(tableName, filter = null) {
  try {
    const apiKey = CONFIG.APPSHEET_API_KEY;
    const appId = CONFIG.APPSHEET_APP_ID;

    if (!apiKey || !appId) {
      throw new Error("AppSheet API key or App ID not configured");
    }

    const url = `${CONFIG.APPSHEET_BASE_URL}${appId}/tables/${tableName}/rows`;
    const options = {
      method: "get",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      muteHttpExceptions: true,
    };

    if (filter) {
      options.payload = JSON.stringify({ filter: filter });
    }

    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (responseCode !== 200) {
      Logger.log(`⚠️  AppSheet API returned ${responseCode}`);
      Logger.log(`   Response: ${responseText}`);
      throw new Error(
        `AppSheet API Error: ${responseCode}`
      );
    }

    if (!responseText || responseText.trim().length === 0) {
      Logger.log(`⚠️  AppSheet API returned empty response`);
      return [];
    }

    const result = JSON.parse(responseText);
    return result.value || [];
  } catch (err) {
    Logger.log(`❌ AppSheet fetch error: ${err.message}`);
    return [];
  }
}

/**
 * Update record in AppSheet
 */
function updateInAppSheet(tableName, recordKey, updates) {
  try {
    const apiKey = CONFIG.APPSHEET_API_KEY;
    const appId = CONFIG.APPSHEET_APP_ID;

    if (!apiKey || !appId) {
      throw new Error("AppSheet API key or App ID not configured");
    }

    const url = `${CONFIG.APPSHEET_BASE_URL}${appId}/tables/${tableName}/rows`;
    const payload = {
      Key: recordKey,
      ...updates,
    };

    const options = {
      method: "post",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (response.getResponseCode() !== 200) {
      throw new Error(
        `AppSheet API Error: ${response.getResponseCode()} - ${JSON.stringify(
          result
        )}`
      );
    }

    Logger.log(`✅ AppSheet record updated: ${recordKey}`);
    return true;
  } catch (err) {
    Logger.log(`❌ AppSheet update error: ${err.message}`);
    return false;
  }
}
