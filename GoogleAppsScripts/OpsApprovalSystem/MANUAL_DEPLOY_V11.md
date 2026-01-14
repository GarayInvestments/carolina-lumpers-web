# Manual Deployment Instructions - Version 11

Due to clasp authentication issues, please manually update the Google Apps Script files and deploy as Version 11.

## Files Already Updated Locally

### ✅ Email_Builder.js - ALREADY UPDATED

- Added `formatDateEST()` function that converts verbose date strings to clean format
- Updated `buildApprovalEmail()` to use `formatDateEST(approvalDate)`
- Added `TEST_formatDateEST()` test function (tests passed ✅)
- **Status**: Ready to deploy

### ✅ Main_Webhook.js - ALREADY UPDATED

- Updated subject line to use formatted date:
  ```javascript
  const formattedDate = formatDateEST(approvalDate);
  const subject = `Daily Operations Approval - ${formattedDate}`;
  ```
- **Status**: Ready to deploy

## Steps to Deploy

### Step 1: Open Google Apps Script

- Go to https://script.google.com
- Select "OpsApprovalSystem" project

### Step 2: Verify Email_Builder.js

Check that the file has:

- `formatDateEST()` function at the top
- `buildApprovalEmail()` uses `const formattedDate = formatDateEST(approvalDate);`
- `TEST_formatDateEST()` function at the bottom

If missing, copy from local files in VS Code.

### Step 3: Verify Main_Webhook.js

Look for lines ~101-103:

```javascript
const approvalDate =
  approvalRecord[CONFIG.COLUMNS.APPROVALS.APPROVAL_DATE] || "Unknown";
const formattedDate = formatDateEST(approvalDate);
const subject = `Daily Operations Approval - ${formattedDate}`;
```

If you see the old version (without formattedDate), update it.

### Step 4: Deploy as Web App

1. Click **Deploy** (top right)
2. Click **Manage deployments**
3. Click the pencil icon on the "Web app" deployment
4. In the dropdown, select **"New version"**
5. Click **Deploy**

### Step 5: Test

Trigger an approval from AppSheet:

- Set `SendForApproval = "Send"` on a task
- Check the approval email subject and body
- Should show: `Daily Operations Approval - Mon Jan 12, 2026` (not the verbose timestamp)

## Expected Results After Deployment

**Email Subject**: `Daily Operations Approval - Mon Jan 12, 2026`
**Email Body**: `Approval Date: Mon Jan 12, 2026`

Both will show clean date format instead of:
`Mon Jan 12 2026 00:00:00 GMT-0500 (Eastern Standard Time)`

## Note

The local files in VS Code are already updated and ready. Just need to manually sync to Google Apps Script and deploy.
