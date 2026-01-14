# OpsApprovalSystem - Deployment Checklist

## ✅ Project Structure Completed

- [x] `.clasp.json` - Google Apps Script project config (placeholder scriptId)
- [x] `appsscript.json` - Manifest with required scopes
- [x] `config/Config.js` - Centralized configuration
- [x] `handlers/Main_Webhook.js` - Webhook receiver (doPost)
- [x] `handlers/Approval_Actions.js` - Action handler (doGet)
- [x] `utils/Utilities.js` - Logging, sheet access, record operations
- [x] `utils/Email_Builder.js` - HTML email generation
- [x] `utils/AppSheet_API.js` - AppSheet API wrapper
- [x] `README.md` - Complete documentation

## 📋 Pre-Deployment Tasks

### 1. Get Script ID from Google

- [ ] Open [Google Apps Script](https://script.google.com)
- [ ] Create new project
- [ ] Copy Script ID
- [ ] Update `.clasp.json` with Script ID

### 2. Set Up Environment Variables

- [ ] In Google Apps Script Editor: Project Settings → Script Properties
- [ ] Add `APPSHEET_API_KEY`: Your AppSheet API key from Developer Hub
- [ ] Add `APPSHEET_APP_ID`: `cls-hub`

### 3. Configure Google Sheet

- [ ] Verify SPREADSHEET_ID in `config/Config.js` matches your main CLS sheet
- [ ] Verify sheet names exist:
  - [ ] `DailyOpsApprovals` (or map correct name)
  - [ ] `Tasks` (or map correct name)
  - [ ] `Log` (for activity logging)
- [ ] Verify all required columns exist in DailyOpsApprovals:
  - [ ] ApprovalID (unique key)
  - [ ] ApprovalDate
  - [ ] Status (Draft/Pending/Approved/Exception)
  - [ ] SendForApproval (boolean trigger)
  - [ ] OperationsManager (email)
  - [ ] ApprovedBy
  - [ ] ApprovedAt

### 4. Set Gmail Email Sender

- [ ] Verify Google account running the project can send emails
- [ ] Test: In Google Apps Script Editor, run:
  ```javascript
  GmailApp.sendEmail(
    "your-email@example.com",
    "Test",
    "Test email from Apps Script"
  );
  ```

## 🚀 Deployment Steps

### Step 1: Push Code to Google

```powershell
cd GoogleAppsScripts/OpsApprovalSystem
clasp login                    # If not logged in
clasp push
```

- [ ] Code pushed successfully
- [ ] No errors in push output

### Step 2: Create Initial Deployment

```powershell
clasp deploy --description "v1.0 Initial deployment"
```

- [ ] Deployment created successfully
- [ ] Record **Deployment ID** (long string like `AKfycbwxxxxxx...`)
- [ ] Save deployment ID to `.clasp.json` or docs

### Step 3: Configure AppSheet Webhook

In [AppSheet CLS Hub](https://accounts.appsheet.com/):

1. Navigate to **DailyOpsApprovals** table
2. Click **Automations** (Admin panel)
3. Create new Automation:
   - **Name**: `SendForApprovalWebhook`
   - **Trigger**: `SendForApproval = TRUE`
   - **Action**: Webhook
   - **URL**: `https://script.google.com/macros/s/{DEPLOYMENT_ID}/usercallback`
   - **Method**: POST
   - **Request Body Format**: JSON
   - **Payload**:
     ```json
     {
       "approvalId": "[ApprovalID]",
       "approvalDate": "[ApprovalDate]",
       "approverEmail": "[OperationsManager]"
     }
     ```
   - [ ] Automation created
   - [ ] Test trigger enabled

## 🧪 Testing

### Test 1: Manual Webhook Simulation

```javascript
// In Google Apps Script Editor, create test function:
function testWebhook() {
  const testPayload = {
    approvalId: "APR-TEST-001",
    approvalDate: "2026-01-12",
    approverEmail: "your-email@example.com",
  };

  const e = {
    postData: {
      contents: JSON.stringify(testPayload),
    },
  };

  const response = doPost(e);
  Logger.log(response);
}

// Run: testWebhook()
// Expected: Logs response with ✅ Success status
```

- [ ] Test function runs without errors
- [ ] Check Log sheet for "Webhook Received" entry
- [ ] Check Gmail for approval email

### Test 2: End-to-End Workflow

1. [ ] In AppSheet, create manual DailyOpsApprovals record:

   - ApprovalID: `APR-TEST-002`
   - ApprovalDate: today's date
   - Status: `Draft`
   - OperationsManager: your email
   - SendForApproval: TRUE (triggers webhook)

2. [ ] Verify webhook fires (check AppSheet automation logs)
3. [ ] Verify email received with task summary table
4. [ ] Click "✅ Approve" link in email
5. [ ] Verify success page shown
6. [ ] Verify DailyOpsApprovals record updated:
   - Status: `Approved`
   - ApprovedBy: your email
   - ApprovedAt: timestamp recorded

### Test 3: Exception Flag

1. [ ] Create another test record with SendForApproval = TRUE
2. [ ] Click "⚠️ Flag as Exception" in email
3. [ ] Verify record status changed to `Exception`
4. [ ] Verify timestamp and approver recorded

## 📊 Monitoring

### Log Sheet Review

After first deployment, check Log sheet for entries like:

```
Webhook Received      | Info    | Webhook payload received from AppSheet
Webhook Payload       | Info    | Full JSON payload
Approval Fetched      | Info    | Approval record successfully loaded
Email Send Failed     | Error   | (if email not sent)
Approval Email Sent   | Success | Email sent to approver@example.com
Approval Action...    | Success | Approved by approver@example.com
```

### Common Issues

| Issue                  | Solution                                                      |
| ---------------------- | ------------------------------------------------------------- |
| Email not sending      | Check Gmail quota in Google Apps Script console               |
| Webhook not triggering | Verify URL in AppSheet automation, check deployment ID        |
| 404 on approval link   | Verify deployment ID in email link matches current deployment |
| Records not updating   | Check script permissions and row-level security settings      |

## 🔄 Updates & Versioning

After changes to code:

```powershell
clasp push                                    # Update code
clasp deploy --description "v1.1 Bug fixes"  # Create new deployment
```

- Update AppSheet webhook URL if deployment ID changes
- Old deployment IDs remain active until explicitly removed

## 📝 Documentation to Update

After successful deployment:

- [ ] Update main `.github/copilot-instructions.md` with OpsApprovalSystem section
- [ ] Document actual SPREADSHEET_ID in Config.js
- [ ] Document actual Deployment ID in this checklist
- [ ] Add OpsApprovalSystem to project README

---

**Status**: Ready for deployment  
**Created**: 2026-01-12  
**Target Completion**: 2026-01-13
