# CLS Hub - QuickBooks ID Mappings

**Quick reference for hardcoded QuickBooks account and service IDs used in CLS Hub system.**

---

## Account IDs (Chart of Accounts)

| ID      | Account Name                 | Type      | Usage                             |
| ------- | ---------------------------- | --------- | --------------------------------- |
| **7**   | Accounts Payable (A/P)       | Liability | Default A/P account for all Bills |
| **142** | Subcontractors               | Expense   | Worker labor costs                |
| **148** | Partner Distribution - Sam   | Expense   | Sam's compensation                |
| **149** | Partner Distribution - Steve | Expense   | Steve's compensation              |

### Usage Pattern

```javascript
// Bill Line Items
{
  "DetailType": "AccountBasedExpenseLineDetail",
  "AccountBasedExpenseLineDetail": {
    "AccountRef": {
      "value": "142"  // Subcontractors expense account
    }
  },
  "Amount": 1250.00
}

// Bill Header (A/P Account)
{
  "APAccountRef": {
    "value": "7"  // Standard A/P account
  }
}
```

---

## Service Item IDs (Products and Services)

**IMPORTANT: Service IDs are DYNAMIC (not hardcoded)**

Unlike Account IDs for bills, Service Item IDs vary per invoice line item. Store the Service ID in your invoice line items table and pass it dynamically.

| ID             | Service Name     | Type    | Usage                               |
| -------------- | ---------------- | ------- | ----------------------------------- |
| **1**          | General Labor    | Service | Standard hourly labor               |
| **2**          | Working Lead     | Service | Lead/supervisor labor (higher rate) |
| **1010000031** | Container Unload | Service | Specialized container work          |

### Usage Pattern (Dynamic Service ID)

```javascript
// Invoice Line Items - Service ID comes from line item data
{
  "DetailType": "SalesItemLineDetail",
  "SalesItemLineDetail": {
    "ItemRef": {
      "value": lineItem.serviceId  // ⚠️ DYNAMIC - from database/line item
    },
    "Qty": 8,
    "UnitPrice": 22.00
  },
  "Amount": 176.00
}

// Example: Different labor types use different Service IDs
// General Labor line:    ItemRef.value = "1"
// Working Lead line:     ItemRef.value = "2"
// Container Unload line: ItemRef.value = "1010000031"
```

---

## Implementation Notes

### 1. **Hardcoded vs Dynamic**

**Account IDs (for Bills):** Stable and **can be hardcoded**

```javascript
// config/quickbooks.js
export const QB_ACCOUNTS = {
  AP_ACCOUNT: "7",
  SUBCONTRACTOR_EXPENSE: "142",
  PARTNER_SAM: "148",
  PARTNER_STEVE: "149",
};
```

**Service Item IDs (for Invoices):** Variable and **MUST be dynamic**

```javascript
// ❌ WRONG - Don't hardcode service IDs
export const QB_SERVICES = {
  GENERAL_LABOR: "1", // Bad - different jobs use different service types
};

// ✅ CORRECT - Store Service ID per line item in database
// invoice_line_items table schema:
// - service_item_id (stores "1", "2", or "1010000031")
// - quantity
// - unit_price
// - amount

// Then use it dynamically:
lineItems.map((item) => ({
  ItemRef: { value: item.service_item_id }, // From database
}));
```

### 2. **When to Query vs Store**

- **Account IDs**: Hardcode in config (stable, rarely change)
- **Service Item IDs**: Store in database per line item (varies by job/labor type)
- **Customer IDs**: Query by `DisplayName` or store mapping (dynamic)
- **Vendor IDs**: Query by vendor name (workers change frequently)
- **Class IDs**: If using QB Classes for job costing (query/store mapping)

### 3. **Validation**

Before deploying to production, verify these IDs still exist:

```javascript
// Verify Account IDs (one-time check)
GET /v3/company/{realmId}/account/7?minorversion=65    // A/P Account
GET /v3/company/{realmId}/account/142?minorversion=65  // Subcontractor Expense

// Verify Service Item IDs (one-time check)
GET /v3/company/{realmId}/item/1?minorversion=65           // General Labor
GET /v3/company/{realmId}/item/2?minorversion=65           // Working Lead
GET /v3/company/{realmId}/item/1010000031?minorversion=65  // Container Unload
```

### 4. **Error Handling**

If QB returns "Invalid Reference Id", the account/service may have been:

- Deleted (unlikely for core accounts)
- Merged with another account
- Changed ID during QB company file migration

**Solution**: Re-query the Chart of Accounts/Items list and update config.

---

## Legacy System Reference

The Carolina Lumpers (legacy) system:

- **InvoiceProject**: Dynamically uses Service IDs (1, 2, 1010000031) based on line item data
- **PayrollProject**: Hardcodes Account IDs 142, 148, 149 for expense line items
- **VendorSync**: Hardcodes Account ID 7 for A/P account reference

**Key Pattern Difference:**

- **Bills**: Use hardcoded Account IDs (142 for workers, 148/149 for owners)
- **Invoices**: Use dynamic Service Item IDs stored per line item

See [QB_API_REFERENCE.md](QB_API_REFERENCE.md) for complete API payload examples.

---

## Quick Checklist

When implementing QB integration in CLS Hub:

- [ ] Import `QB_ACCOUNTS` constants (hardcoded Account IDs)
- [ ] Use Account ID **7** for all Bill `APAccountRef` fields
- [ ] Use Account ID **142** for worker labor expense lines (bills)
- [ ] Use Account IDs **148/149** for partner distribution expense lines (bills)
- [ ] Store Service Item IDs **per invoice line item** in database (1, 2, or 1010000031)
- [ ] Pass Service ID dynamically from line item data (NOT hardcoded)
- [ ] Query/store Customer and Vendor IDs dynamically (never hardcode)
- [ ] Include `minorversion=65` on all API calls
- [ ] Validate Account and Service Item IDs exist in production QB company file before go-live

---

**Last Updated**: 2025-01-17  
**Related Docs**: [QB_API_REFERENCE.md](QB_API_REFERENCE.md), [DOCNUMBER_DESIGN_PATTERN.md](DOCNUMBER_DESIGN_PATTERN.md)
