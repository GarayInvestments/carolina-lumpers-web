/**
 * Adds West Logistics service items to the Services sheet.
 * Run this function once from the Apps Script editor to populate all 9 services.
 * 
 * Workflow-based pricing model:
 * - Standard (<93"): $250 / $300 / $400
 * - Extended (93-99"): $300 / $350 / $500
 * - High Stack (≥100"): $350 / $400 / $600
 * 
 * Volume tiers: ≤1K, 1K-3K, 3K+ cases
 */
function addWestLogisticsServices() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAMES.SERVICES);
    if (!sheet) {
        Logger.log("❌ Services sheet not found");
        return;
    }

    const clientId = "CNT-002-WL"; // West Logistics Client ID
    const rateType = "Fixed";
    
    // Define all 9 services (3 handling workflows × 3 volume tiers)
    const services = [
        // Standard Handling (<93") - Forklift in container, no ladder
        { shortCode: "STD-1K", name: "Standard Unload – Up to 1,000 Cases", rate: 250, description: "Standard Handling (<93\") - Up to 1,000 cases" },
        { shortCode: "STD-3K", name: "Standard Unload – 1,001 to 3,000 Cases", rate: 300, description: "Standard Handling (<93\") - 1,001 to 3,000 cases" },
        { shortCode: "STD-4K", name: "Standard Unload – 3,001+ Cases", rate: 400, description: "Standard Handling (<93\") - 3,001+ cases" },
        
        // Extended Handling (93–99") - Pallet jack-assisted, container-edge pickup
        { shortCode: "EXT-1K", name: "Extended Unload – Up to 1,000 Cases", rate: 300, description: "Extended Handling (93–99\") - Up to 1,000 cases" },
        { shortCode: "EXT-3K", name: "Extended Unload – 1,001 to 3,000 Cases", rate: 350, description: "Extended Handling (93–99\") - 1,001 to 3,000 cases" },
        { shortCode: "EXT-4K", name: "Extended Unload – 3,001+ Cases", rate: 500, description: "Extended Handling (93–99\") - 3,001+ cases" },
        
        // High Stack Handling (≥100") - Step ladder required, multi-stage builds
        { shortCode: "HS-1K", name: "High Stack Unload – Up to 1,000 Cases", rate: 350, description: "High Stack Handling (≥100\") - Up to 1,000 cases" },
        { shortCode: "HS-3K", name: "High Stack Unload – 1,001 to 3,000 Cases", rate: 400, description: "High Stack Handling (≥100\") - 1,001 to 3,000 cases" },
        { shortCode: "HS-4K", name: "High Stack Unload – 3,001+ Cases", rate: 600, description: "High Stack Handling (≥100\") - 3,001+ cases (cap)" }
    ];

    let addedCount = 0;
    let skippedCount = 0;

    // Get existing service names to avoid duplicates
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const nameIndex = headers.indexOf(CONFIG.COLUMNS.SERVICES.SERVICE_NAME);
    const existingNames = data.slice(1).map(row => row[nameIndex]);

    // Add each service
    services.forEach((service, index) => {
        // Check if service already exists
        if (existingNames.includes(service.name)) {
            Logger.log(`⚠️ Skipping ${service.shortCode} - already exists`);
            skippedCount++;
            return;
        }

        // Generate unique Service ID
        const serviceId = Utilities.getUuid().substring(0, 8);
        const sortingOrder = 100 + index; // Start at 100 to leave room for existing services

        // Build row according to CONFIG.COLUMNS.SERVICES structure:
        // Service ID, Service Name, ClientID, Rate Type, Service Invoice Rate, 
        // Service Payout Rate, ServiceGroupID, Sorting Order, Description, Image, Active, QBO_ID
        const newRow = [
            serviceId,                  // Service ID
            service.name,               // Service Name
            clientId,                   // ClientID (CNT-002-WL)
            rateType,                   // Rate Type (Fixed)
            service.rate,               // Service Invoice Rate
            "",                         // Service Payout Rate (leave blank)
            "",                         // ServiceGroupID (leave blank)
            sortingOrder,               // Sorting Order
            service.description,        // Description
            "",                         // Image (leave blank)
            "TRUE",                     // Active
            ""                          // QBO_ID (will be auto-created on first use)
        ];

        sheet.appendRow(newRow);
        Logger.log(`✅ Added ${service.shortCode}: ${service.name} ($${service.rate})`);
        addedCount++;
    });

    Logger.log(`\n📊 Summary: ${addedCount} services added, ${skippedCount} skipped (already exist)`);
    logEvent("Add WL Services", clientId, "Success", `Added ${addedCount} West Logistics services to Services sheet`);
}

function testCheckFailureReason() {
    const failureReason = checkFailureReason();
    Logger.log(failureReason);
}

/**
 * Checks the logs for the most recent failure and provides a summary of the potential causes.
 * @returns {string} - A summary of the potential causes for the most recent failure.
 */
function checkFailureReason() {
    const sheet = getLogSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const statusIndex = headers.indexOf("Status");
    const detailsIndex = headers.indexOf("Details");

    for (let i = data.length - 1; i > 0; i--) {
        if (data[i][statusIndex] === "Failed") {
            const failureDetails = data[i][detailsIndex];
            return `Most recent failure reason: ${failureDetails}`;
        }
    }
    return "No failures found in the logs.";
}

/**
 * Backfills Services sheet QBO_ID values for services that already exist in QBO by name.
 * Matches on Service Name (exact) and writes the found Item Id to the QBO_ID column.
 */
function backfillServicesQboIds() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAMES.SERVICES);
    if (!sheet) {
        Logger.log("Services sheet not found");
        return;
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    const idx = {
        serviceId: headers.indexOf(CONFIG.COLUMNS.SERVICES.SERVICE_ID),
        serviceName: headers.indexOf(CONFIG.COLUMNS.SERVICES.SERVICE_NAME),
        qboId: headers.indexOf(CONFIG.COLUMNS.SERVICES.QBO_ID)
    };

    if (idx.serviceId < 0 || idx.serviceName < 0 || idx.qboId < 0) {
        Logger.log("Required Services headers missing (Service ID / Service Name / QBO_ID)");
        return;
    }

    let token = getOAuthService().getAccessToken();
    if (!token) {
        token = refreshAccessToken();
    }
    if (!token) {
        Logger.log("No QBO access token available");
        return;
    }

    const notFound = [];
    let updated = 0;

    for (let i = 1; i < data.length; i++) {
        const name = data[i][idx.serviceName];
        if (!name) continue;
        if (data[i][idx.qboId]) continue;

        const safeName = name.replace(/'/g, "''");
        const query = `select Id from Item where Name='${safeName}'`;
        const url = `${CONFIG.QBO_BASE_URL}${CONFIG.QBO_REALM_ID}/query?query=${encodeURIComponent(query)}&minorversion=65`;

        let resp = UrlFetchApp.fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json"
            },
            muteHttpExceptions: true
        });

        if (resp.getResponseCode() === 401) {
            const refreshed = refreshAccessToken();
            if (!refreshed) {
                Logger.log("Token refresh failed during backfill");
                break;
            }
            token = refreshed;
            resp = UrlFetchApp.fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json"
                },
                muteHttpExceptions: true
            });
        }

        if (resp.getResponseCode() !== 200) {
            Logger.log(`Query failed for service '${name}' (HTTP ${resp.getResponseCode()}): ${resp.getContentText()}`);
            continue;
        }

        const json = JSON.parse(resp.getContentText());
        const items = json && json.QueryResponse && json.QueryResponse.Item;
        if (items && items.length > 0 && items[0].Id) {
            data[i][idx.qboId] = items[0].Id;
            updated++;
        } else {
            notFound.push(name);
        }
    }

    sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
    Logger.log(`Backfill complete. Updated: ${updated}. Not found: ${notFound.join(", ") || "none"}`);
}
