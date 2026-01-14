/**
 * STEP 1: Get QuickBooks OAuth Authorization URL
 * Run this function in Apps Script editor
 * Copy the URL from logs and open it in your browser
 */
function getQBAuthUrl() {
  // Import the OAuth service from OAuth2.js
  const service = getOAuthService();

  if (service.hasAccess()) {
    Logger.log("✅ Already authorized! Getting fresh tokens...");
    const accessToken = service.getAccessToken();
    const tokenData = service.getToken();

    // Save tokens to script properties
    PropertiesService.getScriptProperties().setProperty(
      "QBO_ACCESS_TOKEN",
      accessToken
    );
    if (tokenData.refresh_token) {
      PropertiesService.getScriptProperties().setProperty(
        "QBO_REFRESH_TOKEN",
        tokenData.refresh_token
      );
    }

    Logger.log("\n📋 Use these credentials in PowerShell:");
    Logger.log("Access Token: " + accessToken);
    Logger.log("Refresh Token: " + (tokenData.refresh_token || "unchanged"));

    return;
  }

  const authUrl = service.getAuthorizationUrl();

  Logger.log("\n🔐 STEP 1: COPY THIS URL AND OPEN IN BROWSER");
  Logger.log("==================================================");
  Logger.log(authUrl);
  Logger.log("==================================================");
  Logger.log("\n📝 STEP 2: After authorizing in browser:");
  Logger.log("   - You'll be redirected back automatically");
  Logger.log("   - Then run getQBOCredentials() to get the tokens");
  Logger.log("\n");
}

/**
 * STEP 2: Get current QuickBooks OAuth credentials
 * Run this AFTER authorizing in browser
 * Use these credentials in PowerShell queries
 */
function getQBOCredentials() {
  const props = PropertiesService.getScriptProperties();

  const credentials = {
    clientId: props.getProperty("QBO_CLIENT_ID"),
    clientSecret: props.getProperty("QBO_CLIENT_SECRET"),
    realmId: props.getProperty("QBO_REALM_ID"),
    accessToken: props.getProperty("QBO_ACCESS_TOKEN"),
    refreshToken: props.getProperty("QBO_REFRESH_TOKEN"),
  };

  Logger.log("=== QuickBooks OAuth Credentials ===");
  Logger.log("Client ID: " + credentials.clientId);
  Logger.log("Client Secret: " + credentials.clientSecret);
  Logger.log("Realm ID: " + credentials.realmId);
  Logger.log("Access Token: " + credentials.accessToken);
  Logger.log("Refresh Token: " + credentials.refreshToken);
  Logger.log("====================================");
  Logger.log("\n✅ Copy the tokens above and use in PowerShell script");

  return credentials;
}

/**
 * Refresh QuickBooks OAuth access token
 * Call this if you get 401 errors
 */
function refreshQBOToken() {
  const props = PropertiesService.getScriptProperties();
  const clientId = props.getProperty("QBO_CLIENT_ID");
  const clientSecret = props.getProperty("QBO_CLIENT_SECRET");
  const refreshToken = props.getProperty("QBO_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    Logger.log("❌ Missing OAuth credentials");
    return null;
  }

  try {
    const basicAuth = Utilities.base64Encode(clientId + ":" + clientSecret);

    const response = UrlFetchApp.fetch(
      "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + basicAuth,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        payload: {
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        },
        muteHttpExceptions: true,
      }
    );

    const statusCode = response.getResponseCode();
    const content = response.getContentText();

    if (statusCode === 200) {
      const tokenData = JSON.parse(content);
      const newAccessToken = tokenData.access_token;
      const newRefreshToken = tokenData.refresh_token;

      // Save new tokens
      props.setProperty("QBO_ACCESS_TOKEN", newAccessToken);
      if (newRefreshToken) {
        props.setProperty("QBO_REFRESH_TOKEN", newRefreshToken);
      }

      Logger.log("✅ Token refreshed successfully");
      Logger.log("New Access Token: " + newAccessToken);
      if (newRefreshToken) {
        Logger.log("New Refresh Token: " + newRefreshToken);
      }

      return newAccessToken;
    } else {
      Logger.log(`❌ Token refresh failed: ${content}`);
      return null;
    }
  } catch (err) {
    Logger.log(`❌ Exception refreshing token: ${err.message}`);
    return null;
  }
}

/**
 * Test QuickBooks query from Apps Script
 * This verifies the credentials work before using them in PowerShell
 * Automatically refreshes token if expired
 */
function testQBOItemQuery() {
  const props = PropertiesService.getScriptProperties();
  const realmId = props.getProperty("QBO_REALM_ID");
  let accessToken = props.getProperty("QBO_ACCESS_TOKEN");

  if (!accessToken || !realmId) {
    Logger.log("❌ Missing credentials");
    return;
  }

  try {
    const query = "SELECT * FROM Item STARTPOSITION 1 MAXRESULTS 500";
    const encodedQuery = encodeURIComponent(query);
    const url = `https://quickbooks.api.intuit.com/v3/company/${realmId}/query?query=${encodedQuery}&minorversion=65`;

    let response = UrlFetchApp.fetch(url, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + accessToken,
        Accept: "application/json",
      },
      muteHttpExceptions: true,
    });

    let statusCode = response.getResponseCode();
    let content = response.getContentText();

    // If 401, try refreshing token
    if (statusCode === 401) {
      Logger.log("🔄 Token expired, refreshing...");
      accessToken = refreshQBOToken();

      if (!accessToken) {
        Logger.log("❌ Failed to refresh token");
        return;
      }

      // Retry with new token
      response = UrlFetchApp.fetch(url, {
        method: "GET",
        headers: {
          Authorization: "Bearer " + accessToken,
          Accept: "application/json",
        },
        muteHttpExceptions: true,
      });

      statusCode = response.getResponseCode();
      content = response.getContentText();
    }

    Logger.log(`Status Code: ${statusCode}`);

    if (statusCode === 200) {
      const data = JSON.parse(content);
      const items = data.QueryResponse.Item || [];

      Logger.log(`✅ Found ${items.length} items\n`);

      // Show all service items
      Logger.log("📦 All Service Items:");
      items
        .filter((item) => item.Type === "Service")
        .forEach((item) => {
          Logger.log(
            `  ID: ${item.Id}, Name: ${item.Name}, Active: ${item.Active}`
          );
        });

      // Show items with 'Hourly' or 'Labor' in name
      Logger.log("\n💼 Items with 'Hourly' or 'Labor' in name:");
      items
        .filter((item) => item.Name.match(/Hourly|Labor/i))
        .forEach((item) => {
          Logger.log(
            `  ID: ${item.Id}, Name: ${item.Name}, Type: ${item.Type}`
          );
        });
    } else {
      Logger.log(`❌ Error: ${content}`);
    }
  } catch (err) {
    Logger.log(`❌ Exception: ${err.message}`);
  }
}
