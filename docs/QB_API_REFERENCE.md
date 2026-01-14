# QuickBooks Online API Reference

## Carolina Lumpers Service - Complete Integration Guide

**Last Updated**: December 30, 2025  
**API Version**: v3, minorversion=65  
**OAuth2 Library**: v43

---

## Table of Contents

1. [Authentication](#authentication)
2. [Core Endpoints](#core-endpoints)
3. [Invoice API](#invoice-api)
4. [Bill API (Payroll)](#bill-api-payroll)
5. [Vendor API](#vendor-api)
6. [Customer API](#customer-api)
7. [Account API](#account-api)
8. [Query Syntax](#query-syntax)
9. [Error Handling](#error-handling)
10. [Rate Limiting & Retries](#rate-limiting--retries)

---

## Authentication

### OAuth2 Configuration

```javascript
// QuickBooks OAuth2 Setup
Authorization Base URL: https://appcenter.intuit.com/connect/oauth2
Token URL: https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer
Scope: com.intuit.quickbooks.accounting
```

### Request Headers (All Endpoints)

```http
Authorization: Bearer {accessToken}
Accept: application/json
Content-Type: application/json
```

### Environment URLs

```
Production: https://quickbooks.api.intuit.com/v3/company/{realmId}
Sandbox:    https://sandbox-quickbooks.api.intuit.com/v3/company/{realmId}
```

### Script Properties Storage

```
QBO_CLIENT_ID
QBO_CLIENT_SECRET
QBO_REALM_ID
QBO_ACCESS_TOKEN
QBO_REFRESH_TOKEN
```

---

## Core Endpoints

| Entity   | Create           | Read (Query)     | Update                               | Notes                          |
| -------- | ---------------- | ---------------- | ------------------------------------ | ------------------------------ |
| Invoice  | POST `/invoice`  | GET `/query?...` | POST `/invoice` (with Id, SyncToken) | Create or update same endpoint |
| Bill     | POST `/bill`     | GET `/query?...` | POST `/bill` (with Id, SyncToken)    | Payroll checks                 |
| Vendor   | POST `/vendor`   | GET `/query?...` | (via `/vendor`)                      | Worker/supplier payments       |
| Customer | POST `/customer` | GET `/query?...` | (via `/customer`)                    | Client information             |
| Account  | —                | GET `/query?...` | —                                    | Chart of accounts (read-only)  |

**All endpoints require**: `?minorversion=65` query parameter

---

## Invoice API

### Purpose

Create and manage customer invoices in QuickBooks.

### Endpoint

```
POST /v3/company/{realmId}/invoice?minorversion=65
```

### Actual Invoice Payload Example (Carolina Lumpers)

```json
{
  "DocNumber": "INV-20250110-001",
  "TxnDate": "2025-01-10",
  "DueDate": "2025-01-25",
  "CustomerRef": {
    "value": "12345"
  },
  "BillEmail": {
    "Address": "payables@abccorp.com"
  },
  "BillEmailCc": {
    "Address": "accounting@abccorp.com"
  },
  "BillEmailBcc": {
    "Address": "hr@carolinalumpers.com"
  },
  "PrivateNote": "Invoice # INV-20250110-001",
  "ShipAddr": {},
  "SalesTermRef": {},
  "Line": [
    {
      "LineNum": 1,
      "DetailType": "SalesItemLineDetail",
      "Amount": 2500.0,
      "Description": "2025-01-10 | Warehouse Labor - Week Ending 1/10/25",
      "SalesItemLineDetail": {
        "ItemRef": {
          "value": "7"
        },
        "ServiceDate": "2025-01-10",
        "Qty": 50,
        "UnitPrice": 50.0
      }
    },
    {
      "LineNum": 2,
      "DetailType": "SalesItemLineDetail",
      "Amount": 1200.0,
      "Description": "2025-01-15 | Equipment Rental",
      "SalesItemLineDetail": {
        "ItemRef": {
          "value": "8"
        },
        "ServiceDate": "2025-01-15",
        "Qty": 4,
        "UnitPrice": 300.0
      }
    }
  ]
}
```

### Update Invoice (Add These Fields)

```json
{
  "Id": "140",
  "SyncToken": "0"
  // ... rest of fields remain the same
}
```

### Query Existing Invoice

```http
GET /v3/company/{realmId}/query?query=SELECT * FROM Invoice WHERE DocNumber='INV-20250110-001'&minorversion=65
```

### Response (Success)

```json
{
  "Invoice": {
    "Id": "140",
    "SyncToken": "0",
    "DocNumber": "INV-20250110-001",
    "TxnDate": "2025-01-10",
    "DueDate": "2025-01-25",
    "TotalAmt": 3700.0,
    "CustomerRef": {
      "value": "12345",
      "name": "ABC Corporation"
    },
    "BillEmail": {
      "Address": "payables@abccorp.com"
    },
    "metaData": {
      "CreateTime": "2025-01-10T10:30:00Z",
      "UpdateTime": "2025-01-10T10:30:00Z"
    }
  },
  "time": "2025-01-10T10:30:00Z"
}
```

### Error Response (Duplicate DocNumber)

```json
{
  "Fault": {
    "Error": [
      {
        "Message": "Duplicate Document Number Error",
        "Detail": "Document number INV-20250110-001 already exists",
        "code": "400"
      }
    ],
    "type": "ValidationFault"
  }
}
```

**Solution**: Query for existing invoice, update with `Id` and `SyncToken` instead of creating new.

---

## Bill API (Payroll)

### Purpose

Create and manage vendor bills for payroll processing.

### Endpoint

```
POST /v3/company/{realmId}/bill?minorversion=65
```

### Actual Bill Payload Example - Worker Paycheck (Carolina Lumpers)

```json
{
  "TxnDate": "2025-01-13",
  "DueDate": "2025-01-20",
  "VendorRef": {
    "value": "45",
    "name": "John Smith"
  },
  "DocNumber": "CHECK-20250113-001",
  "PrivateNote": "CHECK-20250113-001",
  "Line": [
    {
      "LineNum": 1,
      "Description": "2025-01-06 | Time Worked - Warehouse Operations",
      "Amount": 1200.0,
      "DetailType": "AccountBasedExpenseLineDetail",
      "AccountBasedExpenseLineDetail": {
        "AccountRef": {
          "value": "142",
          "name": "Subcontractor Expense"
        },
        "BillableStatus": "NotBillable",
        "TaxCodeRef": {
          "value": "NON"
        }
      }
    },
    {
      "LineNum": 2,
      "Description": "2025-01-10 | Bonus - Performance",
      "Amount": 200.0,
      "DetailType": "AccountBasedExpenseLineDetail",
      "AccountBasedExpenseLineDetail": {
        "AccountRef": {
          "value": "142",
          "name": "Subcontractor Expense"
        },
        "BillableStatus": "NotBillable",
        "TaxCodeRef": {
          "value": "NON"
        }
      }
    }
  ],
  "TotalAmt": 1400.0,
  "CurrencyRef": {
    "value": "USD",
    "name": "United States Dollar"
  },
  "APAccountRef": {
    "value": "7",
    "name": "Accounts Payable (A/P)"
  }
}
```

### Actual Bill Payload Example - Owner Distribution (Carolina Lumpers)

```json
{
  "TxnDate": "2025-01-13",
  "DueDate": "2025-01-20",
  "VendorRef": {
    "value": "1",
    "name": "Steve Garay"
  },
  "DocNumber": "OWNER-DIST-20250113-SG",
  "PrivateNote": "OWNER-DIST-20250113-SG",
  "Line": [
    {
      "LineNum": 1,
      "Description": "2025-01-13 | Steve's 1/3 Share of $6000 Net Income",
      "Amount": 2000.0,
      "DetailType": "AccountBasedExpenseLineDetail",
      "AccountBasedExpenseLineDetail": {
        "AccountRef": {
          "value": "148",
          "name": "Partner Distributions:Steve Distributions"
        },
        "BillableStatus": "NotBillable",
        "TaxCodeRef": {
          "value": "NON"
        }
      }
    }
  ],
  "TotalAmt": 2000.0,
  "CurrencyRef": {
    "value": "USD",
    "name": "United States Dollar"
  },
  "APAccountRef": {
    "value": "7",
    "name": "Accounts Payable (A/P)"
  }
}
```

### Update Existing Bill

```json
{
  "Id": "201",
  "SyncToken": "2"
  // ... rest of fields
}
```

### Query Existing Bill

```http
GET /v3/company/{realmId}/query?query=SELECT * FROM Bill WHERE DocNumber='CHECK-20250113-001'&minorversion=65
```

### Response (Success)

```json
{
  "Bill": {
    "Id": "201",
    "SyncToken": "0",
    "DocNumber": "CHECK-20250113-001",
    "TxnDate": "2025-01-13",
    "DueDate": "2025-01-20",
    "TotalAmt": 1400.0,
    "VendorRef": {
      "value": "45",
      "name": "John Smith"
    },
    "metaData": {
      "CreateTime": "2025-01-13T14:22:00Z",
      "UpdateTime": "2025-01-13T14:22:00Z"
    }
  },
  "time": "2025-01-13T14:22:00Z"
}
```

### Key Bill Fields Explained

| Field                     | Type              | Required   | Notes                                               |
| ------------------------- | ----------------- | ---------- | --------------------------------------------------- |
| `DocNumber`               | string            | YES        | Check number; must be unique                        |
| `TxnDate`                 | date (YYYY-MM-DD) | YES        | Check date                                          |
| `DueDate`                 | date (YYYY-MM-DD) | YES        | Payment due date                                    |
| `VendorRef.value`         | string            | YES        | QB Vendor ID                                        |
| `Line[].Amount`           | decimal           | YES        | Line item amount (cents rounded)                    |
| `Line[].AccountRef.value` | string            | YES        | GL Account ID (e.g., "142" = Subcontractor Expense) |
| `APAccountRef.value`      | string            | YES        | Accounts Payable account (usually "7")              |
| `TotalAmt`                | decimal           | Calculated | Sum of all line amounts                             |

---

## Vendor API

### Purpose

Manage vendors (subcontractors, suppliers, workers).

### Create Vendor

```
POST /v3/company/{realmId}/vendor?minorversion=65
```

### Payload Example

```json
{
  "DisplayName": "Maria Rodriguez",
  "Title": "Warehouse Operator",
  "PrimaryContactInfo": {
    "Email": {
      "Address": "maria@example.com"
    },
    "Phone": {
      "FreeFormNumber": "(704) 555-1234"
    }
  },
  "BillAddr": {
    "Line1": "123 Oak Street",
    "City": "Charlotte",
    "State": "NC",
    "PostalCode": "28202",
    "Country": "USA"
  },
  "Active": true
}
```

### Query Active Vendors

```http
GET /v3/company/{realmId}/query?query=SELECT * FROM Vendor WHERE Active=true&minorversion=65
```

### Response

```json
{
  "QueryResponse": {
    "Vendor": [
      {
        "Id": "45",
        "DisplayName": "Maria Rodriguez",
        "Active": true,
        "CurrencyRef": {
          "value": "USD"
        },
        "Balance": 0.0,
        "AccumulatedPrepaymentAmount": 0.0
      }
    ],
    "startPosition": 1,
    "maxResults": 100
  }
}
```

---

## Customer API

### Purpose

Manage customers (clients who receive invoices).

### Create Customer

```
POST /v3/company/{realmId}/customer?minorversion=65
```

### Payload Example

```json
{
  "DisplayName": "ABC Manufacturing Corp",
  "PrimaryContactInfo": {
    "Email": {
      "Address": "billing@abccorp.com"
    },
    "Phone": {
      "FreeFormNumber": "(704) 555-5678"
    }
  },
  "BillingAddr": {
    "Line1": "456 Industrial Blvd",
    "City": "Charlotte",
    "State": "NC",
    "PostalCode": "28203",
    "Country": "USA"
  },
  "Active": true
}
```

### Query Customers

```http
GET /v3/company/{realmId}/query?query=SELECT * FROM Customer WHERE Active=true&minorversion=65
```

---

## Account API

### Purpose

Read Chart of Accounts for mapping expense and revenue accounts.

### Query All Accounts

```http
GET /v3/company/{realmId}/query?query=SELECT * FROM Account&minorversion=65
```

### Response

```json
{
  "QueryResponse": {
    "Account": [
      {
        "Id": "1",
        "Name": "Operating Revenue",
        "Type": "Income",
        "AccountType": "Revenue",
        "Active": true,
        "CurrentBalance": 45000.0
      },
      {
        "Id": "7",
        "Name": "Accounts Payable (A/P)",
        "Type": "Liability",
        "AccountType": "AccountsPayable",
        "Active": true,
        "CurrentBalance": 8500.0
      },
      {
        "Id": "142",
        "Name": "Subcontractor Expense",
        "Type": "Expense",
        "AccountType": "Expense",
        "Active": true,
        "CurrentBalance": 0.0
      },
      {
        "Id": "148",
        "Name": "Partner Distributions:Steve Distributions",
        "Type": "Expense",
        "AccountType": "OtherCurrentLiability",
        "Active": true,
        "CurrentBalance": 0.0
      }
    ]
  }
}
```

### Common Account References Used

| Account               | ID  | Purpose                  |
| --------------------- | --- | ------------------------ |
| Subcontractor Expense | 142 | Worker paychecks         |
| Accounts Payable      | 7   | Bill payable account     |
| Steve Distributions   | 148 | Owner draw distributions |
| Daniela Distributions | 149 | Owner draw distributions |
| Revenue               | 1   | Invoice income           |

---

## Query Syntax

### Query Format

```
GET /query?query={urlEncodedQuery}&minorversion=65
```

### Query Examples

**Find invoice by DocNumber:**

```
SELECT * FROM Invoice WHERE DocNumber = 'INV-20250110-001'
```

**Find bill by DocNumber:**

```
SELECT * FROM Bill WHERE DocNumber = 'CHECK-20250113-001'
```

**Find all active vendors:**

```
SELECT * FROM Vendor WHERE Active = true
```

**Complex query (invoices due after date):**

```
SELECT * FROM Invoice WHERE DueDate > '2025-01-10' AND Active = true
```

### URL Encoding Example

```javascript
const query = "SELECT * FROM Invoice WHERE DocNumber = 'INV-001'";
const encoded = encodeURIComponent(query);
// Result: SELECT%20*%20FROM%20Invoice%20WHERE%20DocNumber%20%3D%20%27INV-001%27
const url = `/query?query=${encoded}&minorversion=65`;
```

---

## Error Handling

### Authentication Error (401)

```json
{
  "Fault": {
    "Error": [
      {
        "Message": "Unauthorized",
        "Detail": "Token has expired"
      }
    ],
    "type": "AuthenticationFault"
  }
}
```

**Action**: Refresh access token, retry (max 3 times)

### Duplicate DocNumber Error (400)

```json
{
  "Fault": {
    "Error": [
      {
        "Message": "Duplicate Document Number Error",
        "Detail": "Document number 'CHECK-001' already exists"
      }
    ],
    "type": "ValidationFault"
  }
}
```

**Action**:

1. Query for existing record with same DocNumber
2. Extract `Id` and `SyncToken`
3. Add fields to payload
4. Retry POST (will update instead of create)

### Sync Token Mismatch (400)

```json
{
  "Fault": {
    "Error": [
      {
        "Message": "Invalid SyncToken",
        "Detail": "Expected SyncToken '2', got '0'"
      }
    ],
    "type": "ValidationFault"
  }
}
```

**Action**:

1. Query for latest version of record
2. Use updated `SyncToken`
3. Retry

### Rate Limit (429)

```json
{
  "Fault": {
    "Error": [
      {
        "Message": "Rate limit exceeded",
        "Detail": "Too many requests"
      }
    ]
  }
}
```

**Action**: Implement exponential backoff (wait 1s, 2s, 4s before retry)

---

## Rate Limiting & Retries

### Retry Strategy

```javascript
const maxAttempts = 3;
let attempts = 0;

while (attempts < maxAttempts) {
  attempts++;

  try {
    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();

    // Token expired - refresh and retry
    if (statusCode === 401) {
      accessToken = refreshAccessToken();
      // Retry with new token
      continue;
    }

    // Duplicate/conflict - query and update
    if (statusCode === 400) {
      const errorMsg = JSON.parse(response.getContentText()).Fault.Error[0]
        .Message;
      if (errorMsg.includes("Duplicate")) {
        const existing = queryExisting(payload.DocNumber);
        if (existing) {
          payload.Id = existing.Id;
          payload.SyncToken = existing.SyncToken;
          continue; // Retry with updated payload
        }
      }
    }

    // Success
    if (statusCode === 200) {
      return JSON.parse(response.getContentText());
    }

    // Other error - break
    break;
  } catch (err) {
    Logger.log(`Attempt ${attempts} failed: ${err.message}`);
    if (attempts < maxAttempts) {
      // Exponential backoff
      const delay = Math.pow(2, attempts - 1) * 1000; // 1s, 2s, 4s
      Utilities.sleep(delay);
    }
  }
}
```

### Guidelines

- **Max Retries**: 3 attempts per request
- **Backoff**: Exponential (1s, 2s, 4s, then fail)
- **Timeout**: 30 seconds per request
- **Batch Limit**: Process 100-150 bills/invoices per batch

---

## Implementation Checklist

- [ ] Store OAuth credentials in Script Properties
- [ ] Implement token refresh logic (checks expiry every request)
- [ ] Query for existing records before CREATE
- [ ] Add `Id` + `SyncToken` to UPDATE payloads
- [ ] Map internal IDs (WorkerID, ClientID) to QB IDs
- [ ] Validate all dates are in YYYY-MM-DD format
- [ ] Round monetary amounts to 2 decimals
- [ ] Log all API calls with request/response
- [ ] Test in Sandbox first
- [ ] Monitor rate limits (implement backoff)
- [ ] Document GL account mappings

---

## Quick Reference

```javascript
// Get access token
const accessToken = getOAuthService().getAccessToken();

// Refresh if expired
if (!accessToken) {
  accessToken = refreshAccessToken();
}

// Make API call
const response = UrlFetchApp.fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  payload: JSON.stringify(payload),
  muteHttpExceptions: true,
});

// Parse response
const statusCode = response.getResponseCode();
const data = JSON.parse(response.getContentText());

if (statusCode === 200) {
  // Success
  const qboId = data.Invoice?.Id || data.Bill?.Id;
} else if (statusCode === 401) {
  // Token expired
  refreshAccessToken();
} else if (statusCode === 400) {
  // Validation error
  const error = data.Fault?.Error?.[0]?.Message;
}
```

---

**Document Version**: 1.0  
**Last Updated**: December 30, 2025  
**Status**: Production Ready
