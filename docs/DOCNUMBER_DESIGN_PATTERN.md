# DocNumber Handling in QuickBooks Integration

## Design Pattern & Implementation Guide

**Status**: Reference Document for Legacy Systems  
**System Reference**: Carolina Lumpers Service (Legacy)  
**Last Updated**: December 30, 2025

---

## Overview

**DocNumber** is QuickBooks' business document identifier — a unique, user-assigned number that distinguishes each invoice, bill, check, or transaction. This document explains the design pattern used in legacy systems and provides guidance for implementing similar patterns in new systems.

---

## Table of Contents

1. [What is DocNumber](#what-is-docnumber)
2. [DocNumber vs QB Id](#docnumber-vs-qb-id)
3. [Duplicate Detection Strategy](#duplicate-detection-strategy)
4. [Query-Before-Post Pattern](#query-before-post-pattern)
5. [SyncToken & Versioning](#synctoken--versioning)
6. [Legacy System Implementation](#legacy-system-implementation)
7. [Error Scenarios](#error-scenarios)
8. [Best Practices](#best-practices)
9. [Design Considerations](#design-considerations)

---

## What is DocNumber

### Definition

DocNumber is a **permanent, user-visible business document identifier** assigned by your system (not QB).

### Characteristics

- **Unique per entity type**: No two invoices can share a DocNumber, but Invoice INV-001 and Bill CHECK-001 are distinct
- **Business-meaningful**: Should reflect document purpose and timing
- **Immutable**: Cannot be changed after QB creates the record
- **Required field**: Every invoice, bill, check must have one
- **Human-readable**: Unlike QB's internal `Id` field (e.g., "140")

### Examples from Legacy System

| Entity       | DocNumber                | Format                       | Meaning                            |
| ------------ | ------------------------ | ---------------------------- | ---------------------------------- |
| Invoice      | `INV-20250110-001`       | INV-{DATE}-{SEQ}             | Invoice for Jan 10, 2025, #1       |
| Worker Bill  | `CHECK-20250113-SG001`   | CHECK-{DATE}-{WORKERID}      | Paycheck dated Jan 13 for Steve G. |
| Distribution | `OWNER-DIST-20250113-SG` | OWNER-DIST-{DATE}-{INITIALS} | Owner payout Jan 13 for Steve G.   |

---

## DocNumber vs QB Id

### The Two Identifiers

QuickBooks maintains **two separate identifiers** for each record:

```
┌─────────────────────────────────────────────────────┐
│ QuickBooks Record: Invoice                          │
├─────────────────────────────────────────────────────┤
│ DocNumber: "INV-20250110-001"  ← Your business #    │
│ Id: "140"                      ← QB's internal ID   │
│ SyncToken: "2"                 ← Version number     │
│ TxnDate: "2025-01-10"                               │
│ TotalAmt: 3700.00                                   │
└─────────────────────────────────────────────────────┘
```

### When Each Is Used

| Operation    | DocNumber         | Id                | SyncToken         |
| ------------ | ----------------- | ----------------- | ----------------- |
| **CREATE**   | ✅ Required       | ❌ Don't include  | ❌ Don't include  |
| **QUERY**    | ✅ Search by this | —                 | —                 |
| **UPDATE**   | ✅ Keep same      | ✅ Add from query | ✅ Add from query |
| **RESPONSE** | ✅ In response    | ✅ In response    | ✅ In response    |

### Code Example

```javascript
// CREATE: Only provide DocNumber
const createPayload = {
  DocNumber: "INV-20250110-001",
  TxnDate: "2025-01-10",
  CustomerRef: { value: "12345" },
  Line: [...]
  // No Id, no SyncToken
};

// Response from QB:
// {
//   "Invoice": {
//     "Id": "140",           ← QB assigns this
//     "SyncToken": "0",      ← QB assigns this
//     "DocNumber": "INV-20250110-001",  ← We provided this
//     ...
//   }
// }

// UPDATE: Must include Id + SyncToken + DocNumber
const updatePayload = {
  DocNumber: "INV-20250110-001",  // Keep same
  Id: "140",                      // Add from query
  SyncToken: "0",                 // Add from query
  TxnDate: "2025-01-10",          // Can modify
  TotalAmt: 3800.00,              // Can modify
  // ... other fields
};
```

---

## Duplicate Detection Strategy

### The Problem

If you POST a document with a DocNumber that already exists, QB rejects it:

```
POST /v3/company/123456/invoice
{
  "DocNumber": "INV-20250110-001",
  "TxnDate": "2025-01-10",
  ...
}

Response (400 Bad Request):
{
  "Fault": {
    "Error": [{
      "Message": "Duplicate Document Number Error",
      "Detail": "Document number 'INV-20250110-001' already exists"
    }]
  }
}
```

### Why This Matters

**Scenario 1: Webhook Fires Twice**

```
Payroll webhook triggers → Creates Bill "CHECK-20250113-001" → Success
Network glitch → Webhook retried → Tries to create same Bill → FAILS
```

**Scenario 2: Manual Rerun**

```
Payroll processing crashes mid-way
You fix bug and re-run for same week
All DocNumbers already exist in QB
Without handling: All fail with duplicate errors
With handling: They update existing records
```

**Scenario 3: Data Sync Failures**

```
Invoice syncs to QB, but log entry fails
System thinks sync failed, retries tomorrow
DocNumber already in QB → Duplicate error
```

---

## Query-Before-Post Pattern

### The Solution: Check Before Creating

The legacy system implements this pattern:

```javascript
function syncDocumentToQB(docNumber, payload) {
  const accessToken = getAccessToken();

  // STEP 1: Query for existing document
  const existing = queryByDocNumber(docNumber, accessToken);

  if (existing) {
    // STEP 2a: UPDATE existing
    payload.Id = existing.Id;
    payload.SyncToken = existing.SyncToken;
    const action = "update";
  } else {
    // STEP 2b: CREATE new (no Id/SyncToken)
    const action = "create";
  }

  // STEP 3: POST (same endpoint handles both)
  const response = postToQB(payload, accessToken);

  // STEP 4: Log result
  if (response.success) {
    Logger.log(`✅ ${action}: ${docNumber}`);
  }
}
```

### Query Implementation (Legacy Pattern)

```javascript
function queryByDocNumber(docNumber, accessToken) {
  // Choose entity type based on docNumber format
  let entity = "Invoice";
  if (docNumber.startsWith("CHECK-")) entity = "Bill";
  if (docNumber.startsWith("OWNER-DIST-")) entity = "Bill";

  // Build query
  const query = `SELECT * FROM ${entity} WHERE DocNumber = '${docNumber}'`;
  const url = `/query?query=${encodeURIComponent(query)}&minorversion=65`;

  // Execute query
  const response = UrlFetchApp.fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = JSON.parse(response.getContentText());

  // Return first match or null
  return data.QueryResponse?.[entity]?.[0] || null;
}
```

### Query Response Structure

```javascript
// Query returns:
{
  "QueryResponse": {
    "Invoice": [
      {
        "Id": "140",                      // QB's internal ID
        "SyncToken": "0",                 // Current version
        "DocNumber": "INV-20250110-001",  // Your document #
        "TxnDate": "2025-01-10",
        "TotalAmt": 3700.00,
        "CustomerRef": { "value": "12345" },
        // ... all fields
      }
    ],
    "startPosition": 1,
    "maxResults": 1
  }
}
```

---

## SyncToken & Versioning

### What is SyncToken?

**SyncToken** is QB's optimistic locking mechanism — prevents conflicts when multiple users/systems edit the same record.

### How It Works

```
Version 0: Original record created
  SyncToken: "0"

User A queries record
  Gets SyncToken: "0"

User B also queries record
  Gets SyncToken: "0"

User B updates record
  Posts with SyncToken: "0"
  QB increments: SyncToken: "1"

User A tries to update
  Posts with SyncToken: "0"  ← Outdated!
  QB rejects: "Expected SyncToken '1', got '0'"
  Error: Invalid SyncToken
```

### Legacy System Handling

```javascript
function updateBillInQB(docNumber, updates) {
  // Step 1: Query latest version
  const existing = queryByDocNumber(docNumber, accessToken);
  if (!existing) {
    throw new Error(`Bill ${docNumber} not found`);
  }

  // Step 2: Build payload with CURRENT SyncToken
  const payload = {
    DocNumber: docNumber,
    Id: existing.Id,
    SyncToken: existing.SyncToken, // ← CRITICAL: Use current token
    TxnDate: updates.TxnDate,
    Line: updates.Line,
    // ...
  };

  // Step 3: POST update
  const response = postToQB(payload, accessToken);

  if (response.statusCode === 400) {
    const error = response.Fault?.Error?.[0]?.Message;
    if (error.includes("SyncToken")) {
      // Someone else updated it
      // Option 1: Retry with new query
      // Option 2: Log conflict and skip
      Logger.log(`⚠️ SyncToken conflict for ${docNumber}. Skipping.`);
    }
  }
}
```

### Common SyncToken Error

```json
{
  "Fault": {
    "Error": [
      {
        "Message": "Invalid SyncToken",
        "Detail": "Expected SyncToken '2', got '0'"
      }
    ]
  }
}
```

**Action**: Query again to get current SyncToken, retry update.

---

## Legacy System Implementation

### Carolina Lumpers Invoice Sync

**File**: `GoogleAppsScripts/InvoiceProject/lib/QBO_API.js`

```javascript
function sendInvoiceToQBO(invoiceNumber) {
  const invoiceData = fetchInvoice(invoiceNumber);
  const clientData = fetchClientData(invoiceData.customer);
  const lineItems = fetchInvoiceLineItems(invoiceNumber);

  const payload = buildInvoicePayload(invoiceData, clientData, lineItems);

  // ① Query for existing invoice
  let existingInvoice = getInvoiceFromQBO(invoiceNumber, accessToken);

  if (existingInvoice) {
    // ② If found, add QB metadata
    payload.Id = existingInvoice.Id;
    payload.SyncToken = existingInvoice.SyncToken;
    Logger.log(`Invoice exists. Preparing to update.`);
  } else {
    Logger.log(`Invoice does not exist. Preparing to create.`);
  }

  // ③ POST (creates or updates)
  let attempts = 0;
  while (attempts < 3) {
    const response = UrlFetchApp.fetch(url, {
      method: "POST",
      payload: JSON.stringify(payload),
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const statusCode = response.getResponseCode();

    if (statusCode === 401) {
      // Token expired, refresh and retry
      accessToken = refreshAccessToken();
      attempts++;
      continue;
    }

    if (statusCode === 400 && response.includes("Duplicate")) {
      // Re-query and try update
      existingInvoice = getInvoiceFromQBO(invoiceNumber, accessToken);
      payload.Id = existingInvoice.Id;
      payload.SyncToken = existingInvoice.SyncToken;
      attempts++;
      continue;
    }

    // Success
    break;
  }

  if (response.statusCode === 200) {
    Logger.log(`✅ Invoice synced: ${invoiceNumber}`);
    return { success: true, qboId: response.Invoice.Id };
  } else {
    Logger.log(`❌ Failed to sync invoice: ${invoiceNumber}`);
    return { success: false };
  }
}

function getInvoiceFromQBO(invoiceNumber, accessToken) {
  const url =
    `${CONFIG.QBO_BASE_URL}${CONFIG.QBO_REALM_ID}/query?` +
    `query=select * from Invoice where DocNumber='${invoiceNumber}'&minorversion=65`;

  const response = UrlFetchApp.fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = JSON.parse(response.getContentText());
  return data.QueryResponse.Invoice?.[0] || null;
}
```

### Carolina Lumpers Payroll Bill Sync

**File**: `GoogleAppsScripts/PayrollProject/PayrollController.js`

```javascript
function processPayroll(weekPeriod) {
  const billPayloads = buildBillPayloads(...);

  for (const billPayload of billPayloads) {
    // ① Query for existing bill by DocNumber
    const existingBill = findExistingBill(billPayload.DocNumber);

    if (existingBill) {
      // ② If found, add QB metadata for update
      billPayload.Id = existingBill.Id;
      billPayload.SyncToken = existingBill.SyncToken;
      Logger.log(`Bill exists. Will update.`);
    } else {
      Logger.log(`Bill new. Will create.`);
    }

    // ③ POST (creates or updates)
    const qboResponse = callQBOApi('/bill', 'POST', billPayload);

    if (qboResponse?.Bill?.Id) {
      Logger.log(`✅ ${existingBill ? 'Updated' : 'Created'} bill: ${billPayload.DocNumber}`);
    } else {
      Logger.log(`❌ Failed to sync bill: ${billPayload.DocNumber}`);
    }
  }
}

function findExistingBill(docNumber) {
  const query = `SELECT * FROM Bill WHERE DocNumber = '${docNumber}'`;
  const url = `/query?query=${encodeURIComponent(query)}`;
  const response = callQBOApi(url, 'GET');

  return response?.QueryResponse?.Bill?.[0] || null;
}
```

---

## Error Scenarios

### Scenario 1: Duplicate DocNumber (No Query)

**Without Query-Before-Post Pattern:**

```
POST /invoice
{
  "DocNumber": "INV-001",
  ...
}

Response (400):
{
  "Fault": {
    "Error": [{
      "Message": "Duplicate Document Number Error"
    }]
  }
}

Result: ❌ Sync fails, invoice not created or updated
```

**With Query-Before-Post Pattern:**

```
Query: SELECT * FROM Invoice WHERE DocNumber = 'INV-001'
Response: Found existing invoice with Id="140", SyncToken="0"

POST /invoice
{
  "DocNumber": "INV-001",
  "Id": "140",
  "SyncToken": "0",
  ...
}

Response (200): Success
{
  "Invoice": {
    "Id": "140",
    ...
  }
}

Result: ✅ Sync succeeds, invoice updated
```

### Scenario 2: Concurrent Updates (SyncToken Mismatch)

```
System A: Query Bill CHECK-001, gets SyncToken: "0"
System B: Query Bill CHECK-001, gets SyncToken: "0"

System B: Update with SyncToken: "0"
QB: Increments to SyncToken: "1"

System A: Update with SyncToken: "0"
QB: Rejects with "Expected SyncToken '1', got '0'"

Result: ❌ Conflict error
```

**Legacy system mitigation:**

```javascript
if (statusCode === 400 && error.includes("SyncToken")) {
  // Retry with fresh query (gets new SyncToken)
  const fresh = queryByDocNumber(docNumber, accessToken);
  payload.SyncToken = fresh.SyncToken;
  // Retry POST
}
```

### Scenario 3: Token Expiration During Batch

```
Processing 50 bills...
Bill #1-25: Success
Bill #26: Token expired (401 response)
Bill #27-50: Would all fail with 401

Legacy system handles:
- Detect 401
- Call refreshAccessToken()
- Retry Bill #26
- Continue with #27-50
```

---

## Best Practices

### 1. Make DocNumber Business-Meaningful

```javascript
✅ GOOD:
  "INV-20250110-001"    // Date + sequence
  "CHECK-SG-20250113"   // Worker + date
  "OWNER-DIST-DMR-20250113"  // Type + owner + date

❌ BAD:
  "1"                   // No context
  "INVOICE"             // Not unique
  "doc-abc123"          // Random/cryptic
```

### 2. Always Query Before Post

```javascript
✅ GOOD:
const existing = queryByDocNumber(payload.DocNumber);
if (existing) {
  payload.Id = existing.Id;
  payload.SyncToken = existing.SyncToken;
}
postToQB(payload);

❌ BAD:
postToQB(payload);  // Hope it doesn't exist
```

### 3. Use Latest SyncToken

```javascript
✅ GOOD:
const bill = queryBill(docNumber);
payload.SyncToken = bill.SyncToken;  // Current version

❌ BAD:
payload.SyncToken = "0";  // Old hardcoded value
```

### 4. Log DocNumber with Results

```javascript
✅ GOOD:
Logger.log(`✅ Created invoice ${payload.DocNumber}`);
Logger.log(`⚠️ Duplicate error for ${payload.DocNumber}`);

❌ BAD:
Logger.log(`✅ Created`);  // Which document?
```

### 5. Implement Exponential Backoff

```javascript
✅ GOOD:
for (let attempt = 0; attempt < 3; attempt++) {
  const delay = Math.pow(2, attempt) * 1000;  // 1s, 2s, 4s
  Utilities.sleep(delay);
  // retry
}

❌ BAD:
for (let i = 0; i < 3; i++) {
  // retry immediately, no delay
}
```

---

## Design Considerations

### For New Systems

When implementing DocNumber handling in a new system, consider:

#### 1. DocNumber Generation Strategy

- **Centralized**: Single function controls all DocNumber generation
- **Consistent**: Use same format across invoices, bills, etc.
- **Unique**: Include date + sequence or UUID component
- **Traceable**: Link back to source (worker ID, date, etc.)

```javascript
// Example: Centralized generator
function generateDocNumber(type, date, identifier) {
  const dateStr = formatDate(date, "YYYYMMDD");
  const seq = getNextSequence(type, date);
  return `${type}-${dateStr}-${identifier}-${seq}`;
  // Result: INVOICE-20250110-CLIENT123-001
}
```

#### 2. Idempotency

- Design for safe retries
- Rerunning same operation shouldn't create duplicates
- Use DocNumber as idempotency key

```javascript
// Good design: Rerunning is safe
POST / sync - invoice / INV - 001;
// First run: Creates invoice, returns success
// Second run: Finds existing, updates it, returns success
// Result: Idempotent ✅

// Bad design: Rerunning fails
POST / create - invoice;
// First run: Creates
// Second run: Duplicate error
// Result: Not idempotent ❌
```

#### 3. Audit Trail

- Store which DocNumbers synced successfully
- Record timestamps and QB IDs
- Track failed DocNumbers for retry

```javascript
const syncLog = {
  docNumber: "INV-20250110-001",
  qboId: "140",
  action: "created", // or "updated"
  timestamp: "2025-01-10T10:30:00Z",
  syncStatus: "success", // or "failed"
  error: null,
};
```

#### 4. Conflict Resolution

- Define policy for SyncToken mismatches
- Decide: Retry? Skip? Alert?
- Log conflicts for manual review

```javascript
// Policy: Retry once, then skip
if (syncTokenMismatch) {
  if (retryCount < 1) {
    const fresh = queryDocNumber(docNumber);
    payload.SyncToken = fresh.SyncToken;
    retry();
  } else {
    Logger.log(`Skipped ${docNumber} due to persistent conflict`);
    continue;
  }
}
```

#### 5. Testing Strategy

- Test happy path (new + existing)
- Test duplicate scenarios
- Test concurrent updates
- Test token refresh scenarios

```javascript
// Test matrix
✅ POST new DocNumber → Create
✅ POST existing DocNumber (no Id/SyncToken) → Duplicate error → Query → Update
✅ POST with updated SyncToken → Success
✅ POST with stale SyncToken → Error → Retry → Success
✅ 401 during POST → Refresh token → Retry → Success
```

---

## Summary

**DocNumber** is your business document identifier. The **Query-Before-Post pattern** ensures idempotency and prevents duplicate errors:

1. **Generate meaningful DocNumber** (date + sequence + context)
2. **Query QB for existing** document by DocNumber
3. **If found**: Add `Id` + `SyncToken` to payload (will UPDATE)
4. **If not found**: POST without `Id` (will CREATE)
5. **Handle retries** with exponential backoff for auth errors
6. **Log results** with DocNumber for traceability

The legacy Carolina Lumpers system implements this pattern across invoice and payroll bill syncing, ensuring that rerunning payroll processing is safe and idempotent.

---

**Document Version**: 1.0  
**System Reference**: Carolina Lumpers Service (Legacy)  
**Last Updated**: December 30, 2025  
**Status**: Reference Guide for New Implementations
