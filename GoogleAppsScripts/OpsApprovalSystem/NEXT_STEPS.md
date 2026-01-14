# OpsApprovalSystem - Next Steps & Implementation Guide

## 🎯 Current Status: Ready for Deployment

**Completed**:
✅ Project structure created (8 files)
✅ Webhook receiver (Main_Webhook.js)
✅ Action handler (Approval_Actions.js)
✅ Supporting utilities (Config, Utilities, Email_Builder, AppSheet_API)
✅ Test functions (Tests.js)
✅ Complete documentation (README.md, DEPLOYMENT_CHECKLIST.md)

**Not Yet Done**:
⏳ Push code to Google Apps Script
⏳ Create deployment ID
⏳ Configure AppSheet webhook
⏳ End-to-end testing

---

## 📋 Pre-Deployment Configuration

### 1. Create Script ID

1. Go to https://script.google.com
2. Click "New project"
3. Name it: `OpsApprovalSystem`
4. Copy the **Script ID** from Project Settings
5. Update `.clasp.json`:
   ```json
   {
     "scriptId": "YOUR_COPIED_SCRIPT_ID_HERE",
     "rootDir": "GoogleAppsScripts/OpsApprovalSystem"
   }
   ```

### 2. Configure Google Sheet

1. Determine your main Google Sheet ID (CLS_Hub_Backend or similar)
2. Update `config/Config.js` line ~3:

   ```javascript
   SPREADSHEET_ID: '1U8hSNREN5fEhskp0UM-Z80iiW39beaOj3oIsaLZyFzk', // Your actual Sheet ID
   ```

3. Verify sheet names exist:
   - `DailyOpsApprovals` (new table in AppSheet)
   - `Tasks` (existing table)
   - `Log` (create if doesn't exist, for activity logging)

### 3. Set Environment Variables in Google Apps Script

1. Open the Script Editor (after pushing code)
2. Go to **Project Settings** → **Script Properties**
3. Add two properties:

   ```
   Key: APPSHEET_API_KEY
   Value: [Your AppSheet Developer API Key - see AppSheet Developer Hub]

   Key: APPSHEET_APP_ID
   Value: cls-hub
   ```

---

## 🚀 Deployment Process

### Step 1: Push Code

```powershell
cd GoogleAppsScripts/OpsApprovalSystem
clasp push
```

**Expected Output**:

```
Pushed 8 files.
├ Main_Webhook.js
├ Approval_Actions.js
├ Tests.js
├ config/Config.js
├ utils/Utilities.js
├ utils/Email_Builder.js
├ utils/AppSheet_API.js
└ README.md
```

### Step 2: Create Deployment

```powershell
clasp deploy --description "v1.0 Initial release"
```

**Expected Output**:

```
Created version 1.
Deployment ID: AKfycbw...your...deployment...id...
```

**⚠️ IMPORTANT**: Save this Deployment ID - you'll need it for AppSheet webhook!

### Step 3: Test Functions

In Google Apps Script Editor (opened automatically after clasp push):

1. **Select function**: Choose `TEST_runAll` from dropdown
2. **Run**: Click ▶️ button
3. **Check Logs**: View → Logs (should show all 6 tests passing)

Expected output:

```
✅ RUNNING ALL TESTS
📍 Running: Gmail Quota
✅ Gmail daily quota remaining: 450
📍 Running: Log Sheet
✅ Can access sheet: DailyOpsApprovals
...
✅ Passed: 6/6
```

### Step 4: Configure AppSheet Webhook

**In [AppSheet CLS Hub](https://accounts.appsheet.com/):**

1. Navigate to **DailyOpsApprovals** table → **Automations**
2. Create **New Automation**:
   - **Name**: `SendForApproval`
   - **Trigger Type**: `App: A row was changed, and a condition is true`
   - **Trigger Condition**: `[SendForApproval] = TRUE`
   - **Action**: `Webhook`
   - **Webhook URL**:
     ```
     https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/usercallback
     ```
   - **Method**: `POST`
   - **Body Format**: `JSON`
   - **Request Body**:
     ```json
     {
       "approvalId": "[ApprovalID]",
       "approvalDate": "[ApprovalDate]",
       "approverEmail": "[OperationsManager]"
     }
     ```
3. **Save** and **Enable** automation

---

## 🧪 Testing Procedure

### Manual Test 1: Webhook Simulation

1. Open Google Apps Script Editor for OpsApprovalSystem
2. Select **TEST_simulateWebhook** from function dropdown
3. Click ▶️ Run
4. Check **Logs** - should see:
   ```
   ✅ Webhook Received
   ✅ Approval Fetched
   ✅ Email Send Would Succeed (or actual send if implemented)
   ```
5. Check **Google Sheet** → **Log** sheet for new entry

### Manual Test 2: End-to-End Approval

1. **In AppSheet CLS Hub**:

   - Open **DailyOpsApprovals** table
   - Create manual row:
     - ApprovalID: `APR-MANUAL-001`
     - ApprovalDate: Today's date
     - Status: `Draft`
     - OperationsManager: your email
     - SendForApproval: **TRUE** (this triggers the automation)

2. **Verify webhook fired**:

   - AppSheet → Admin panel → Automations → Check logs
   - Google Apps Script Editor → Logs (should see webhook entries)

3. **Check email**:

   - Your inbox should receive email titled: "Daily Operations Approval - [date]"
   - Email should have:
     - Task summary table with Container#, Client, Times, Crew Count
     - "✅ Approve" button
     - "⚠️ Flag as Exception" button

4. **Click "Approve"**:
   - Browser should show green success page
   - Go back to AppSheet and refresh DailyOpsApprovals row
   - Verify Status changed to `Approved`
   - Verify ApprovedBy = your email
   - Verify ApprovedAt = timestamp

### Manual Test 3: Exception Flag

1. Create another test row with SendForApproval = TRUE
2. Click "Flag as Exception" link in email
3. Verify status changed to `Exception` in AppSheet

---

## 🔄 Data Flow Verification

After setup, verify data flows correctly:

```
AppSheet Automation Triggered (SendForApproval = TRUE)
    ↓
AppSheet sends webhook POST to OpsApprovalSystem
    ↓
Main_Webhook.js: doPost(e) receives request
    ↓
Fetches DailyOpsApprovals record
    ↓
Fetches linked Tasks from Tasks table
    ↓
Builds approval email with task summary
    ↓
Sends email to OperationsManager
    ↓
Updates DailyOpsApprovals: Status = Pending
    ↓
Logs event to Log sheet
    ↓
Returns JSON response to AppSheet
```

**Check each step**:

- [ ] Log sheet shows "Webhook Received" entry
- [ ] Log sheet shows "Approval Fetched" entry
- [ ] Log sheet shows "Email Send" entry
- [ ] Email received with correct task count
- [ ] DailyOpsApprovals status updated to Pending

---

## 📊 Monitoring & Support

### Daily Checks

- **Google Sheet → Log sheet**: Review for any errors
- **AppSheet → Automations logs**: Verify webhook firing correctly
- **Gmail quota**: Check GmailApp.getRemainingDailyQuota() (50/day limit)

### Troubleshooting

| Problem                  | Diagnosis                       | Solution                                               |
| ------------------------ | ------------------------------- | ------------------------------------------------------ |
| Webhook not firing       | Check AppSheet automation logs  | Verify SendForApproval automation enabled              |
| 404 error on webhook URL | Deployment ID wrong or inactive | Re-run `clasp deploy` to create new deployment         |
| Email not received       | Gmail quota exceeded            | Check daily limit (max 50 emails/day) or check spam    |
| Records not updating     | Script permissions or RLS       | Verify sheet permissions, check script error logs      |
| Task table not in email  | Tasks sheet empty or not linked | Verify Tasks sheet has data, ApprovalID column matches |

### Quick Diagnostics

```javascript
// Run in Google Apps Script console:
GmailApp.getRemainingDailyQuota(); // Check email limit
getApprovalsSheet().getLastRow(); // Check if sheet has data
fetchApprovalRecord("APR-TEST-001"); // Check record fetch
fetchLinkedTasks("APR-TEST-001"); // Check task linking
```

---

## 📝 Documentation Updates

After successful deployment:

1. [ ] Update this file's "Current Status" section
2. [ ] Add OpsApprovalSystem section to `.github/copilot-instructions.md`
3. [ ] Document Deployment ID in project notes
4. [ ] Create AppSheet column mapping document (if needed)

---

## 🎓 Architecture Quick Reference

**Request Flow**:

```
AppSheet → Webhook → Main_Webhook.js (doPost) → Email → GmailApp
                  ↓
          Approval_Actions.js (doGet) ← Email Link Click
                  ↓
          Update DailyOpsApprovals Record
```

**Key Files**:

- `Main_Webhook.js` - Webhook receiver, email builder trigger
- `Approval_Actions.js` - Web page for approve/flag actions
- `Config.js` - All configuration, column mappings, enums
- `Utilities.js` - Logging, sheet access, record operations
- `Email_Builder.js` - HTML email with task summary
- `AppSheet_API.js` - AppSheet integration (stub for future)

---

## 🚀 What's Next?

1. **Immediate** (Today):

   - [ ] Update `config/Config.js` with actual sheet ID
   - [ ] Create Google Apps Script project
   - [ ] Add environment variables

2. **Short-term** (Tomorrow):

   - [ ] Run `clasp push` and `clasp deploy`
   - [ ] Configure AppSheet webhook
   - [ ] Run manual tests

3. **Follow-up** (Next week):

   - [ ] Monitor Log sheet for any issues
   - [ ] Test with real approval batches
   - [ ] Adjust email template or task columns as needed

4. **Future enhancements**:
   - Add PDF generation for approved batches
   - Add Slack notifications
   - Add per-task signatures (if needed)
   - Integrate with mobile app for approvals

---

**Version**: 1.0 Pre-Deployment  
**Created**: 2026-01-12  
**Target Deployment**: 2026-01-13
