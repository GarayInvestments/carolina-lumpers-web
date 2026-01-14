# OpsApprovalSystem - Daily Operational Approval Workflow

## 📋 Overview

Google Apps Script project that orchestrates daily operational approval workflows for container unload Tasks. Uses AppSheet webhooks to trigger approval email generation and handles approval/flag actions via email links.

**Status**: Ready for initial deployment and AppSheet integration

## 🏗️ Architecture

```
AppSheet Hub (CLS Hub)
    ↓ DailyOpsApprovals table
    ↓ SendForApproval = TRUE (bot trigger)
    ↓ Webhook POST
OpsApprovalSystem (Apps Script)
    ├── Main_Webhook.js (doPost handler)
    │   ├── Validate ApprovalID, fetch record
    │   ├── Fetch linked Tasks
    │   ├── Build approval email
    │   └── Send to Operations Manager
    │
    ├── Approval_Actions.js (doGet handler)
    │   ├── ?action=approve → Status = Approved
    │   ├── ?action=flag → Status = Exception
    │   └── Update record, show success
    │
    └── Supporting Utils
        ├── Config.js (AppSheet API, Sheets config)
        ├── Utilities.js (logging, sheet access, record ops)
        ├── Email_Builder.js (HTML email with task table)
        └── AppSheet_API.js (AppSheet API wrapper)
```

## 📁 Project Structure

```
OpsApprovalSystem/
├── .clasp.json                    # Google Apps Script project config
├── appsscript.json               # Manifest (scopes, timeZone)
├── config/
│   └── Config.js                 # Centralized configuration
├── handlers/
│   ├── Main_Webhook.js           # doPost - webhook receiver
│   └── Approval_Actions.js        # doGet - approval action handler
└── utils/
    ├── Utilities.js              # Logging, sheet access, record ops
    ├── Email_Builder.js          # HTML email generation
    └── AppSheet_API.js           # AppSheet REST API wrapper
```

## 🚀 Deployment Steps

### 1. Update Project Configuration

Edit `.clasp.json`:

```json
{
  "scriptId": "YOUR_SCRIPT_ID_HERE",
  "rootDir": "GoogleAppsScripts/OpsApprovalSystem"
}
```

### 2. Set Environment Variables (PropertiesService)

In Google Apps Script Editor → Project Settings → Script Properties:

```
APPSHEET_API_KEY = Your AppSheet API key
APPSHEET_APP_ID = Your AppSheet App ID
```

### 3. Deploy to Google Apps Script

```powershell
cd GoogleAppsScripts/OpsApprovalSystem
clasp login
clasp push
clasp deploy
```

Record the deployment ID that appears after `clasp deploy`.

### 4. Configure AppSheet Bot

In AppSheet CLS Hub:

1. Open DailyOpsApprovals table
2. Add new Automation:
   - **Trigger**: SendForApproval = TRUE
   - **Type**: Webhook
   - **URL**: `https://script.google.com/macros/s/{DEPLOYMENT_ID}/usercallback`
   - **Method**: POST
   - **Payload**:
     ```json
     {
       "approvalId": "[ApprovalID]",
       "approvalDate": "[ApprovalDate]",
       "approverEmail": "[OperationsManager]"
     }
     ```

## 📧 Workflow

### Step 1: Trigger Approval

- In AppSheet, batch-select container unload Tasks
- Click "Send for Approval" (DailyOpsApprovals record created with Status = Draft)
- Set SendForApproval = TRUE

### Step 2: Webhook Triggered

- AppSheet bot fires webhook POST to OpsApprovalSystem
- Main_Webhook.js receives payload
- Fetches DailyOpsApprovals record and linked Tasks
- Builds HTML email with task summary table
- Updates Status to "Pending"
- Sends approval email to OperationsManager

### Step 3: Manager Reviews & Actions

- Manager receives email with task summary
- Clicks "✅ Approve" or "⚠️ Flag as Exception"
- Approval_Actions.js processes action:
  - Updates DailyOpsApprovals record
  - Sets Status = Approved or Exception
  - Records approver email and timestamp
- Returns confirmation page

### Step 4: Task Status Updated (Manual or Automated)

- Once approved, Tasks can be marked complete in AppSheet
- Or use AppSheet action to auto-update Tasks with OpsApprovalRef

## 🔧 Configuration

### Key Settings (Config.js)

```javascript
CONFIG = {
  // AppSheet API
  APPSHEET_API_KEY:
    PropertiesService.getScriptProperties().getProperty("APPSHEET_API_KEY"),
  APPSHEET_APP_ID: "cls-hub",

  // Google Sheets
  SPREADSHEET_ID: "...", // Your Google Sheet ID
  SHEETS: {
    APPROVALS: "DailyOpsApprovals",
    TASKS: "Tasks",
    LOG: "Log",
  },

  // Column Mappings
  COLUMNS: {
    APPROVALS: {
      ID: "ApprovalID",
      DATE: "ApprovalDate",
      STATUS: "Status",
      APPROVED_BY: "ApprovedBy",
      APPROVED_AT: "ApprovedAt",
    },
    TASKS: {
      ID: "TaskID",
      APPROVAL_REF: "OpsApprovalRef",
    },
  },

  // Status Enums
  APPROVAL_STATUS: {
    DRAFT: "Draft",
    PENDING: "Pending",
    APPROVED: "Approved",
    EXCEPTION: "Exception",
  },

  TASK_STATUS: {
    PENDING: "Pending",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    FLAGGED: "Flagged",
  },
};
```

## 🧪 Testing

### Test Webhook Locally

In Google Apps Script Editor → Execution logs:

1. Run `testWebhookPayload()` to simulate AppSheet webhook
2. Check Log sheet for entries
3. Verify email would be sent (check `sendApprovalEmail()` stub)

### Stub Functions for Testing

```javascript
// In Main_Webhook.js - Add test function:
function testWebhookPayload() {
  const testData = {
    approvalId: "APR-20260112-001",
    approvalDate: "2026-01-12",
    approverEmail: "ops-manager@example.com",
  };

  const e = {
    postData: {
      contents: JSON.stringify(testData),
    },
  };

  doPost(e);
}
```

## 📊 Database Schema

### DailyOpsApprovals Table (AppSheet/Sheets)

```
ApprovalID      | TEXT | Unique ID (APR-YYYYMMDD-###)
ApprovalDate    | DATE | Date of approval batch
Status          | TEXT | Draft → Pending → Approved/Exception
SendForApproval | BOOL | Trigger for webhook bot
OperationsManager | EMAIL | Manager email (approver)
ApprovedBy      | EMAIL | Email of approver who actioned request
ApprovedAt      | DATETIME | Timestamp of approval/flag
ApprovalMethod  | TEXT | "Web Link" | "Mobile App" | "Manual"
Notes           | TEXT | Any flagged items or exceptions
CreatedBy       | EMAIL | Who initiated approval request
CreatedAt       | DATETIME | When approval record was created
```

### Tasks Table (AppSheet/Sheets)

```
TaskID          | TEXT | Unique task ID
ContainerNumber | TEXT | Container being unloaded
Client          | TEXT | Client name
StartTime       | DATETIME | Task start time
EndTime         | DATETIME | Task end time
CrewCount       | INT | Number of crew members
OpsApprovalRef  | TEXT | Links to ApprovalID (linked column)
Status          | TEXT | Pending → In Progress → Completed → Flagged
```

### Activity Log Table (Sheets)

```
Timestamp       | DATETIME | When event occurred
Event           | TEXT | Event type (Webhook Received, Approval Fetched, etc.)
Details         | TEXT | Full details/error message
ApprovalID      | TEXT | Related approval (if applicable)
Status          | TEXT | Info | Warning | Error | Success
```

## 🔐 Security Considerations

- **API Key**: Stored in PropertiesService (not in code)
- **Email Validation**: Links include approverEmail parameter (verifies correct recipient)
- **Action Tokens**: Query params are human-readable; consider adding HMAC for production
- **AppSheet Auth**: Uses existing AppSheet authentication (no additional auth needed)

## 🐛 Troubleshooting

### Webhook Not Triggering

1. Verify SendForApproval = TRUE in record
2. Check AppSheet Automation logs (Admin → Automations)
3. Verify webhook URL matches deployment ID exactly
4. Test manually: Paste deployment URL in browser, should return HTML/JSON response

### Email Not Sending

1. Check Gmail quota (GmailApp.getRemainingDailyQuota())
2. Verify approverEmail is valid
3. Check Log sheet for "Email Send Failed" entries
4. Verify service account has Gmail permissions

### Status Not Updating

1. Check approval action URL (verify action, approvalId, email params)
2. Check Log sheet for "Approval Action Completed" entry
3. Refresh AppSheet to see updated status
4. Check if user has permission to edit DailyOpsApprovals table

## 📝 Logging

All events logged to Activity Log sheet with:

- Timestamp (DATETIME)
- Event (TEXT) - Webhook Received, Approval Fetched, Email Sent, etc.
- Details (TEXT) - JSON payload, error message, or descriptive info
- ApprovalID (TEXT) - Related approval record
- Status (TEXT) - Info, Warning, Error, Success

## 🔗 API Endpoints

### Webhook Receiver (POST)

```
https://script.google.com/macros/s/{DEPLOYMENT_ID}/usercallback
```

**Payload**:

```json
{
  "approvalId": "APR-20260112-001",
  "approvalDate": "2026-01-12",
  "approverEmail": "ops-manager@example.com"
}
```

### Approval Actions (GET)

```
https://script.google.com/macros/s/{DEPLOYMENT_ID}/usercallback?action=approve&approvalId=APR-20260112-001&email=ops-manager@example.com
```

## 📚 Related Documentation

- [CLS Hub Database Schema](.github/DATABASE_SCHEMA.md)
- [PayrollProject](../PayrollProject/README.md) - QBO Bill creation pattern
- [InvoiceProject](../InvoiceProject/README.md) - Webhook/email pattern

## 📞 Support

For issues or questions, check the Log sheet first, then review troubleshooting section above.

---

**Version**: 1.0  
**Created**: 2026-01-12  
**Last Updated**: 2026-01-12
