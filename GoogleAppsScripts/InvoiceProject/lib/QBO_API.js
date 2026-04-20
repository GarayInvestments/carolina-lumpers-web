/**
 * Revised Functions for Updated Invoice & QBO Sync System
 * Version: 4.0
 * Last Updated: 2025-02-12
 */

/**
 * Sends an invoice to QuickBooks Online via API with enhanced error handling, retries, and validation.
 * @param {string} invoiceNumber - The internal invoice number to sync.
 */
function sendInvoiceToQBO(invoiceNumber) {
    // Fetch invoice data, client data, and line items
    const invoiceData = fetchInvoice(invoiceNumber);
    if (!invoiceData) {
        logEvent("QBO Sync", invoiceNumber, "Error", "Invoice not found in sheets.");
        return { success: false, error: 'Invoice not found' };
    }

    const clientData = fetchClientData(invoiceData.customer);
    if (!clientData) {
        logEvent("QBO Sync", invoiceNumber, "Error", `Client not found for customer: ${invoiceData.customer}. Verify client exists in Clients sheet with correct Client ID.`);
        return { success: false, error: 'Client not found' };
    }

    if (!clientData.qboId) {
        logEvent("QBO Sync", invoiceNumber, "Error", `Missing QBO ID for customer: ${invoiceData.customer}. Update Clients sheet with QBO customer ID.`);
        return { success: false, error: 'Missing QBO ID for customer' };
    }

    let lineItems = fetchInvoiceLineItems(invoiceNumber);
    if (!lineItems || lineItems.length === 0) {
        logEvent("QBO Sync", invoiceNumber, "Error", "No line items found for invoice. Cannot create invoice without line items.");
        return { success: false, error: 'No line items found' };
    }

    const url = CONFIG.QBO_BASE_URL + CONFIG.QBO_REALM_ID + "/invoice?minorversion=65";
    
    // Refresh the access token if expired
    let accessToken = getOAuthService().getAccessToken();
    if (!accessToken) {
        accessToken = refreshAccessToken();
        if (!accessToken) {
            logEvent("QBO Sync", invoiceNumber, "Error", "Could not retrieve new access token.");
            return false;
        }
    }

    const itemEnsureResult = ensureQboItemsForLineItems(lineItems, accessToken, invoiceNumber);
    if (!itemEnsureResult.success) {
        return { success: false, error: itemEnsureResult.error };
    }
    lineItems = itemEnsureResult.items;
    accessToken = itemEnsureResult.accessToken;

    const payload = buildInvoicePayload(invoiceData, clientData, lineItems);

    // Check if the invoice already exists in QBO
    let existingInvoice = getInvoiceFromQBO(invoiceNumber, accessToken);
    if (existingInvoice) {
        payload.Id = existingInvoice.Id;
        payload.SyncToken = existingInvoice.SyncToken;
        logEvent("QBO Sync", invoiceNumber, "Info", "Invoice exists in QBO. Preparing to update.");
    } else {
        logEvent("QBO Sync", invoiceNumber, "Info", "Invoice does not exist in QBO. Preparing to create.");
    }

    let response;
    let statusCode;
    let content;
    let jsonResponse;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        attempts++;
        response = UrlFetchApp.fetch(url, {
            method: "POST",
            headers: {
              Authorization: "Bearer " + accessToken,
              Accept: "application/json",
              "Content-Type": "application/json"
            },
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
        });
        
        statusCode = response.getResponseCode();
        content = response.getContentText();
        
        try {
            jsonResponse = JSON.parse(content);
        } catch (e) {
            logEvent("QBO Sync", invoiceNumber, "Error", `Failed to parse JSON response: ${e.message}`);
        }

        if (statusCode === 401) {
            logEvent("QBO Sync", invoiceNumber, "Error", "Authentication failed. Refreshing access token and retrying...");
            accessToken = refreshAccessToken();
            if (!accessToken) {
                logEvent("QBO Sync", invoiceNumber, "Error", "Could not retrieve new access token.");
                return { success: false, error: 'Token refresh failed' };
            }
        } else if (statusCode === 400) {
            // Log the full error response for debugging
            if (jsonResponse && jsonResponse.Fault && jsonResponse.Fault.Error) {
                const error = jsonResponse.Fault.Error[0];
                const errorMsg = `QBO Error ${error.code}: ${error.Message} - ${error.Detail}`;
                logEvent("QBO Sync", invoiceNumber, "Error", errorMsg);
                
                if (error.Message === "Duplicate Document Number Error") {
                    // Re-query QBO to get the existing invoice details
                    existingInvoice = getInvoiceFromQBO(invoiceNumber, accessToken);
                    if (existingInvoice) {
                        payload.Id = existingInvoice.Id;
                        payload.SyncToken = existingInvoice.SyncToken;
                        logEvent("QBO Sync", invoiceNumber, "Info", "Re-query successful. Preparing to update existing invoice.");
                        continue; // Retry with the updated payload
                    }
                } else {
                    // For other 400 errors, log and exit after all retries
                    break;
                }
            } else {
                logEvent("QBO Sync", invoiceNumber, "Error", `HTTP 400 Error: ${content}`);
                break;
            }
        } else if (statusCode >= 500) {
            logEvent("QBO Sync", invoiceNumber, "Error", `QBO Server Error (HTTP ${statusCode}): ${content}`);
            break;
        } else if (statusCode !== 200) {
            logEvent("QBO Sync", invoiceNumber, "Error", `Unexpected HTTP ${statusCode}: ${content}`);
            break;
        } else {
            break;
        }
    }

    if (jsonResponse && jsonResponse.Invoice && jsonResponse.Invoice.Id) {
        const QBOinvoiceID = jsonResponse.Invoice.Id;
        logEvent("QBO Sync", invoiceNumber, "Success", `Invoice successfully ${existingInvoice ? 'updated' : 'created'} in QuickBooks with QBO ID: ${QBOinvoiceID}`);
        markInvoiceAsSynced(invoiceNumber);
        return { success: true, qboInvoiceId: QBOinvoiceID };
    } else {
        if (jsonResponse && jsonResponse.Fault) {
            logEvent("QBO Sync", invoiceNumber, "Error", `QuickBooks Error Fault: ${JSON.stringify(jsonResponse.Fault)}`);
        } else if (jsonResponse && jsonResponse.ErrorDetail) {
            logEvent("QBO Sync", invoiceNumber, "Error", `QuickBooks Error Detail: ${JSON.stringify(jsonResponse.ErrorDetail)}`);
        }
        logEvent("QBO Sync", invoiceNumber, "Error", `Invoice ${existingInvoice ? 'update' : 'creation'} response did not include an ID.`);
        return { success: false, error: 'Invoice response did not include an ID' };
    }
}

/**
 * Retrieves an invoice from QuickBooks Online by internal invoice number.
 * @param {string} invoiceNumber - The internal invoice number.
 * @param {string} accessToken - The access token for authentication.
 * @returns {object|null} - The invoice data if found, otherwise null.
 */
function getInvoiceFromQBO(invoiceNumber, accessToken) {
    const url = `${CONFIG.QBO_BASE_URL}${CONFIG.QBO_REALM_ID}/query?query=select * from Invoice where DocNumber='${invoiceNumber}'&minorversion=65`;
    const response = UrlFetchApp.fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json"
        },
        muteHttpExceptions: true
    });

    const statusCode = response.getResponseCode();
    const content = response.getContentText();
    logEvent("QBO Sync", invoiceNumber, "Info", `HTTP Status Code (getInvoiceFromQBO): ${statusCode}`);
    
    if (statusCode === 200) {
        const jsonResponse = JSON.parse(content);
        if (jsonResponse.QueryResponse && jsonResponse.QueryResponse.Invoice && jsonResponse.QueryResponse.Invoice.length > 0) {
            return jsonResponse.QueryResponse.Invoice[0];
        }
    }

    return null;
}



/**
 * Ensures each line item has a valid QBO Item ID, creating it if missing using Services metadata.
 * @param {Array} lineItems - Line items enriched with service metadata.
 * @param {string} accessToken - Current access token (may be refreshed if expired).
 * @param {string} invoiceNumber - Current invoice number for logging.
 * @returns {{success: boolean, items?: Array, error?: string, accessToken?: string}}
 */
function ensureQboItemsForLineItems(lineItems, accessToken, invoiceNumber) {
    let token = accessToken;
    const createdIds = {};

    for (let i = 0; i < lineItems.length; i++) {
        const item = lineItems[i];
        if (item.serviceQboId) {
            createdIds[item.serviceId] = item.serviceQboId;
            continue;
        }

        // If we already created or found an ID for this service in this run, reuse it
        if (createdIds[item.serviceId]) {
            item.serviceQboId = createdIds[item.serviceId];
            continue;
        }

        const createResult = createQboItemForService(item, token, invoiceNumber);
        if (!createResult.success) {
            return { success: false, error: createResult.error, accessToken: token, items: lineItems };
        }

        item.serviceQboId = createResult.qboId;
        createdIds[item.serviceId] = createResult.qboId;
        token = createResult.accessToken || token;

        // Propagate to any remaining line items with the same serviceId to avoid duplicate creates
        for (let j = i + 1; j < lineItems.length; j++) {
            if (lineItems[j].serviceId === item.serviceId && !lineItems[j].serviceQboId) {
                lineItems[j].serviceQboId = createResult.qboId;
            }
        }
    }

    return { success: true, items: lineItems, accessToken: token };
}

/**
 * Creates a QBO Item for a service when no QBO_ID exists. Uses Container Unload parent/category and income/expense accounts.
 * @param {object} lineItem - Line item with service metadata.
 * @param {string} accessToken - Current access token.
 * @param {string} invoiceNumber - Invoice number for logging context.
 * @returns {{success: boolean, qboId?: string, error?: string, accessToken?: string}}
 */
function createQboItemForService(lineItem, accessToken, invoiceNumber) {
    const name = lineItem.serviceName || lineItem.itemName || `Service ${lineItem.serviceId}`;
    const description = lineItem.serviceDescription || lineItem.serviceName || name;
    const rateType = lineItem.rateType || "Fixed";
    const categoryMap = CONFIG.QBO_ITEM_CATEGORY_BY_RATE_TYPE || {};
    const parentCategory = categoryMap[rateType] || categoryMap.Fixed || { id: "1010000021", name: "Fixed" };

    const parsedRate = Number(lineItem.serviceInvoiceRate);
    const parsedUnit = Number(lineItem.unitPrice);
    const parsedAmount = Number(lineItem.amount);
    const parsedQty = Number(lineItem.quantity);

    const fallbackUnitPrice = parsedRate || (parsedQty ? parsedAmount / parsedQty : 0) || parsedUnit || 0;

    const itemPayload = {
        Name: name,
        Sku: rateType,
        Description: description,
        Active: true,
        SubItem: true,
        ParentRef: { value: parentCategory.id, name: parentCategory.name },
        Taxable: false,
        UnitPrice: fallbackUnitPrice,
        Type: "Service",
        IncomeAccountRef: { value: "5", name: "Services" },
        ExpenseAccountRef: { value: "142", name: "Subcontractor Expense" },
        TrackQtyOnHand: false
    };

    const url = `${CONFIG.QBO_BASE_URL}${CONFIG.QBO_REALM_ID}/item?minorversion=65`;

    let response = UrlFetchApp.fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
            "Content-Type": "application/json"
        },
        payload: JSON.stringify(itemPayload),
        muteHttpExceptions: true
    });

    let statusCode = response.getResponseCode();
    let content = response.getContentText();
    let jsonResponse;

    try {
        jsonResponse = JSON.parse(content);
    } catch (e) {
        logEvent("QBO Item Create", lineItem.serviceId, "Error", `Failed to parse item create response: ${e.message}`);
        return { success: false, error: "Failed to parse item create response" };
    }

    // Handle token expiration on item create
    if (statusCode === 401) {
        const refreshed = refreshAccessToken();
        if (!refreshed) {
            logEvent("QBO Item Create", lineItem.serviceId, "Error", "Token refresh failed during item create.");
            return { success: false, error: "Token refresh failed" };
        }

        response = UrlFetchApp.fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${refreshed}`,
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            payload: JSON.stringify(itemPayload),
            muteHttpExceptions: true
        });

        statusCode = response.getResponseCode();
        content = response.getContentText();
        try {
            jsonResponse = JSON.parse(content);
        } catch (e) {
            logEvent("QBO Item Create", lineItem.serviceId, "Error", `Failed to parse item create response after refresh: ${e.message}`);
            return { success: false, error: "Failed to parse item create response after refresh" };
        }
        accessToken = refreshed;
    }

    if (statusCode !== 200 || !jsonResponse || !jsonResponse.Item || !jsonResponse.Item.Id) {
        logEvent("QBO Item Create", lineItem.serviceId, "Error", `Item create failed (HTTP ${statusCode}): ${content}`);
        return { success: false, error: `Item create failed: HTTP ${statusCode}` };
    }

    const qboId = jsonResponse.Item.Id;
    updateServiceQboId(lineItem.serviceId, qboId);
    logEvent("QBO Item Create", lineItem.serviceId, "Success", `Created QBO item ${qboId} for service.`);

    return { success: true, qboId, accessToken };
}

/**
 * Creates the payload for the QBO invoice API request.
 * @param {object} invoiceData - The invoice data.
 * @param {object} clientData - The client data.
 * @param {Array} lineItems - The line items.
 * @returns {object} - The payload for the API request.
 */
function buildInvoicePayload(invoiceData, clientData, lineItems) {
    const txnDate = invoiceData.date ? normalizeDateToISO(invoiceData.date) : "";
    const dueDate = invoiceData.dueDate ? normalizeDateToISO(invoiceData.dueDate) : "";

    const linePayload = lineItems.map(item => {
        const serviceID = item.serviceQboId || item.serviceId;
        const qty = item.quantity;
        const amount = item.amount;
        const description = item.description;
        const serviceDate = item.date ? normalizeDateToISO(item.date) : "";

        return {
            DetailType: "SalesItemLineDetail",
            Amount: amount,
            SalesItemLineDetail: {
                ItemRef: { value: serviceID },
                ServiceDate: serviceDate,
                Qty: qty,
                UnitPrice: amount / qty
            },
            Description: description
        };
    });

    const payload = {
        DocNumber: invoiceData.invoiceNumber,
        TxnDate: txnDate,
        DueDate: dueDate,
        CustomerRef: { value: clientData.qboId },
        PrivateNote: `Invoice # ${invoiceData.invoiceNumber}`,
        ShipAddr: {},
        SalesTermRef: {},
        Line: linePayload
    };

    // Set billing address with company name and address only (no contact name)
    if (clientData.clientName || clientData.jobAddress) {
        const addressParts = [];
        if (clientData.clientName) addressParts.push(clientData.clientName);
        if (clientData.jobAddress) addressParts.push(clientData.jobAddress);
        
        payload.BillAddr = {
            Line1: addressParts.join("\n")
        };
    }

    // Only add email fields if they exist
    if (clientData.payablesEmail) {
        payload.BillEmail = { Address: clientData.payablesEmail };
    }
    if (clientData.payablesEmailCc) {
        payload.BillEmailCc = { Address: clientData.payablesEmailCc };
    }
    if (clientData.payablesEmailBcc) {
        payload.BillEmailBcc = { Address: clientData.payablesEmailBcc };
    }

    return payload;
}

/**
 * Normalizes date values into YYYY-MM-DD ISO format.
 * @param {string|Date} dateValue - Input date.
 * @return {string} - Normalized date string or empty string if invalid.
 */
function normalizeDateToISO(dateValue) {
  if (dateValue instanceof Date) {
    return dateValue.toISOString().split("T")[0];
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }
  logMessage("⚠️ WARNING:", `Invalid date format detected - ${dateValue}`);
  return "";
}