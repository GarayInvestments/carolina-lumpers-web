# OpsApprovalSystem - Quick Setup Card

## 🚀 Ready to Deploy

**Script ID**: `1TmN8uy7UiSTaMYEjphN4pVnbd0t8RdNa`
**Deployment URL**: `https://script.google.com/macros/s/1TmN8uy7UiSTaMYEjphN4pVnbd0t8RdNa/usercallback`
**Version**: 1.2 ✅

---

## 📋 Status

✅ All files deployed
✅ Properties configured
✅ Sheets created
✅ Column mappings verified
✅ Tests passing (6/6)
⏳ **NEXT: Configure AppSheet webhook**

---

## 🔧 AppSheet Setup (5 minutes)

1. Open **AppSheet editor** for **cls-hub** app
2. Go to **Automations**
3. Create new automation:
   - **Trigger**: `SendForApproval = TRUE` on DailyOpsApprovals
   - **Action**: Execute Webhook
   - **URL**: `https://script.google.com/macros/s/1TmN8uy7UiSTaMYEjphN4pVnbd0t8RdNa/usercallback`
   - **Method**: POST
   - **Body**:
     ```json
     {
       "ApprovalID": [ApprovalID],
       "ApprovalDate": [ApprovalDate],
       "OperationsManager": [OperationsManager],
       "Status": [Status],
       "Notes": [Notes]
     }
     ```

---

## 🧪 Test It (2 minutes)

1. Create test record in `DailyOpsApprovals`
2. Set `SendForApproval = TRUE`
3. Check `Log` sheet for webhook entry
4. Check email for approval message
5. Click approve button

---

## 📞 Issue? Check This

| Issue              | Solution                                      |
| ------------------ | --------------------------------------------- |
| Webhook not firing | Verify `SendForApproval = TRUE` in AppSheet   |
| Email not received | Check Log sheet for errors                    |
| Column errors      | Run `showTasksColumns()` test                 |
| API errors         | Verify PropertiesService has 3 properties set |

---

## 📁 Files Reference

- **Main_Webhook.js** - Webhook receiver (doPost)
- **Approval_Actions.js** - Email action handler (doGet)
- **Email_Builder.js** - Email generation
- **Utilities.js** - Data fetching & logging
- **Config.js** - Column mappings & configuration
- **Tests.js** - Validation tests (6 included)
- **Setup.js** - Initial setup helper
- **Log sheet** - Activity audit trail

---

**Ready to configure in AppSheet!** 🎯
