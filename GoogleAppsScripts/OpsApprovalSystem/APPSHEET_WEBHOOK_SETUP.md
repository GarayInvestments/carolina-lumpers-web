# AppSheet Webhook Configuration Guide

## ✅ OpsApprovalSystem Deployment Ready

**Deployment URL**: `https://script.google.com/macros/s/1TmN8uy7UiSTaMYEjphN4pVnbd0t8RdNa/usercallback`

**Version**: 1.2 (Updated with correct Tasks sheet column mappings)

---

## 📋 Configuration Checklist

- [x] Google Apps Script project created
- [x] All 8 production files deployed
- [x] PropertiesService configured (SPREADSHEET_ID, APPSHEET_API_KEY, APPSHEET_APP_ID)
- [x] Google Sheets created (DailyOpsApprovals, Tasks with OpsApprovalRef, Log)
- [x] Column mappings verified and updated
- [x] Tests passing (6/6)
- [ ] AppSheet webhook configured (THIS STEP)

---

## 🔧 AppSheet Webhook Setup Steps

### 1. Open AppSheet Editor

- Navigate to **cls-hub** app in AppSheet
- Go to **Automations** section
- Find or create the automation for `DailyOpsApprovals` table

### 2. Configure the Webhook Action

**Automation Trigger:**

```
When: A record is created or updated
   AND SendForApproval = TRUE
Then: Execute Webhook
```

**Webhook Configuration:**
| Setting | Value |
|---------|-------|
| **Name** | `OpsApprovalWebhook` |
| **URL** | `https://script.google.com/macros/s/1TmN8uy7UiSTaMYEjphN4pVnbd0t8RdNa/usercallback` |
| **Method** | `POST` |
| **Content Type** | `application/json` |
| **Body Type** | `JSON` |

**Request Body Mapping:**

```json
{
  "ApprovalID": [ApprovalID],
  "ApprovalDate": [ApprovalDate],
  "OperationsManager": [OperationsManager],
  "Status": [Status],
  "Notes": [Notes]
}
```

### 3. Configure Success/Error Handling

**Success Response:**

- Expected: HTTP 200
- Response contains: `"ok":true` or success indicator

**Error Handling:**

- Retry on failure: Yes
- Max retries: 3
- Backoff delay: 5 seconds

---

## 📊 Webhook Payload Structure

When the webhook fires, the following data is sent to Google Apps Script:

```javascript
{
  "ApprovalID": "APR-OPS-20260112-001",          // Unique approval identifier
  "ApprovalDate": "2026-01-12",                  // Date approval was submitted
  "OperationsManager": "john.doe@company.com",   // Manager email
  "Status": "Pending",                           // Current approval status
  "Notes": "Container unload completion review"  // Any notes
}
```

**Processing Flow:**

1. `Main_Webhook.js` receives POST
2. Validates ApprovalID exists in DailyOpsApprovals sheet
3. Fetches linked Tasks from AppSheet API
4. `Utilities.js` retrieves task details from Tasks sheet
5. `Email_Builder.js` generates approval email with task summary
6. Email sent to OperationsManager with approval/flag action buttons
7. Event logged to Log sheet with all details

---

## 📧 Email Output

When webhook fires, recipient receives:

**Subject**: `Daily Operations Approval - 2026-01-12`

**Body Contains**:

- Approval ID and date
- Summary of linked tasks:
  - Container/Project
  - Client
  - Start time, End time, Duration
  - Worker assigned
  - Current status
- Two action buttons:
  - ✅ Approve (blue link)
  - 🚩 Flag for Review (red link)
- Timestamped log entry

---

## 🧪 Testing the Webhook

### Step 1: Create a Test Record

1. Open `DailyOpsApprovals` table in AppSheet
2. Create new record with:
   - **ApprovalID**: `APR-TEST-20260112-001`
   - **ApprovalDate**: Today's date
   - **OperationsManager**: Your email
   - **Status**: `Pending`
   - **SendForApproval**: `TRUE` ← **This triggers the webhook**

### Step 2: Monitor the Webhook

1. Check **Log sheet** in Google Sheets for new entry
2. Verify columns:
   - **LogID**: `LOG-{timestamp}-{random}`
   - **Timestamp**: Current time
   - **EventType**: `WEBHOOK_RECEIVED`
   - **ApprovalID**: `APR-TEST-20260112-001`
   - **Status**: `SUCCESS` or error message
   - **Details**: Full JSON with processing info

### Step 3: Verify Email Sent

1. Check inbox for approval email
2. Verify sender: `noreply@carolinalumpers.com`
3. Verify subject matches approval date
4. Click "Approve" button to test response handling

### Step 4: Check Approval Update

1. Return to `DailyOpsApprovals` record
2. Verify **ApprovedBy**, **ApprovedAt**, **ApprovalMethod** fields updated
3. Verify **Status** changed to `Approved` or `Exception` (if flagged)

---

## 🔗 Column Mapping Reference

### DailyOpsApprovals Sheet

```
ApprovalID          → Unique identifier (e.g., "APR-OPS-20260112-001")
ApprovalDate        → Date of approval request
OperationsManager   → Email of manager to approve
Status              → One of: "Draft", "Pending", "Approved", "Exception"
SendForApproval     → TRUE to trigger webhook, FALSE to skip
ApprovedBy          → Manager name (populated after approval)
ApprovedAt          → Timestamp (populated after approval)
ApprovalMethod      → How approved ("Email", "Phone", etc.)
Notes               → Additional context
```

### Tasks Sheet

```
TaskID                  → Task identifier
Date                    → Task date
Container # / Project   → Container/project number
Client ID               → Client identifier
Start Time              → Task start time
End Time                → Task end time
Task Duration (Hours)   → Calculated duration
Worker                  → Assigned worker
Categories              → Work categories
OpsApprovalRef          → Link to DailyOpsApprovals (ApprovalID)
Status                  → Task status ("Completed", etc.)
```

### Log Sheet

```
LogID               → Unique log identifier
Timestamp           → When event occurred
EventType           → Type of event (WEBHOOK_RECEIVED, APPROVAL_SENT, etc.)
ApprovalID          → Related approval ID
Status              → Event status (SUCCESS, ERROR, etc.)
Details             → JSON with full event details
```

---

## 🚨 Troubleshooting

### Webhook Not Firing

- [ ] Check `SendForApproval = TRUE` in AppSheet record
- [ ] Verify automation exists and is enabled in AppSheet
- [ ] Check Log sheet for any error entries
- [ ] Confirm APPSHEET_API_KEY is valid in PropertiesService

### Email Not Received

- [ ] Check Log sheet for email send status
- [ ] Verify OperationsManager email is valid
- [ ] Check Gmail quota (GmailApp has quota limits)
- [ ] Review Details field in Log sheet for error message

### Column Mapping Errors

- [ ] Run `showTasksColumns()` in Google Apps Script
- [ ] Verify all actual columns match CONFIG.COLUMNS.TASKS
- [ ] If mismatch found, update Config.js accordingly
- [ ] Re-deploy with `clasp push`

### AppSheet API Integration

- [ ] Verify APPSHEET_API_KEY in PropertiesService
- [ ] Verify APPSHEET_APP_ID matches your app ID
- [ ] Test API access by checking Log sheet for fetch errors
- [ ] Review AppSheet API documentation at https://support.appsheet.com/hc/en-us/articles/360044275972-API

---

## 📝 Next Steps

1. **Configure AppSheet webhook** (steps above)
2. **Create test DailyOpsApprovals record** with SendForApproval = TRUE
3. **Monitor Log sheet** for webhook processing
4. **Verify email received** with task summary
5. **Test Approve button** to verify response handling
6. **Test Flag button** to verify exception workflow
7. **Enable full automation** when confident

---

## 🔐 Security Notes

- **PropertiesService**: API keys stored securely in Apps Script
- **Email**: Uses noreply address (no reply capability)
- **Logging**: All events logged to Log sheet for audit trail
- **Authorization**: AppSheet user must have edit access to record to trigger

---

## 📞 Support

For issues:

1. Check **Log sheet** for detailed error messages
2. Review **Tests.js** for validation functions
3. Consult **Config.js** for current configuration
4. Check **Utilities.js** for data fetching logic

---

**Last Updated**: 2026-01-12
**Status**: Ready for AppSheet Integration
