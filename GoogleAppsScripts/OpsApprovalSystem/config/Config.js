/**
 * OpsApprovalSystem Configuration
 * Version: 1.0
 * Handles daily operational sign-off for container unload Tasks
 */

const CONFIG = {
  /**
   * AppSheet Configuration
   */
  APPSHEET_API_KEY:
    PropertiesService.getScriptProperties().getProperty("APPSHEET_API_KEY"),
  APPSHEET_APP_ID:
    PropertiesService.getScriptProperties().getProperty("APPSHEET_APP_ID") ||
    "cls-hub",
  APPSHEET_BASE_URL: "https://api.appsheet.com/api/v2/apps/",

  /**
   * Google Sheets Configuration
   */
  SPREADSHEET_ID:
    PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID"),

  SHEET_NAMES: {
    DAILY_OPS_APPROVALS: "DailyOpsApprovals",
    TASKS: "Tasks",
    SERVICES: "Services",
    WORKERS: "Workers",
    LOG: "Log",
  },

  /**
   * Column Names - DailyOpsApprovals Table
   */
  COLUMNS: {
    APPROVALS: {
      APPROVAL_ID: "ApprovalID",
      APPROVAL_DATE: "ApprovalDate",
      STATUS: "Status",
      SEND_FOR_APPROVAL: "SendForApproval",
      APPROVED_BY: "ApprovedBy",
      APPROVED_AT: "ApprovedAt",
      APPROVAL_METHOD: "ApprovalMethod",
      NOTES: "Notes",
    },
    TASKS: {
      TASK_ID: "TaskID",
      DATE: "Date",
      CONTAINER_NUMBER: "Container # / Project",
      CLIENT: "Client ID",
      SERVICE_ID: "Service ID",
      SERVICE_RATE_TYPE: "Services:Rate Type",
      START_TIME: "Start Time",
      END_TIME: "End Time",
      DURATION: "Task Duration (Hours)",
      WORKER: "Worker", // This is the actual column name
      WORKER_NAME: "Worker", // Alias for Email_Builder.js
      WORKER_ID: "Worker", // Alias for Email_Builder.js
      CATEGORIES: "Categories",
      OPS_APPROVAL_REF: "OpsApprovalRef",
      STATUS: "Status",
    },
    SERVICES: {
      SERVICE_ID: "Service ID",
      RATE_TYPE: "Rate Type",
    },
    WORKERS: {
      WORKER_ID: "WorkerID",
      FIRST_NAME: "First Name",
      LAST_NAME: "Last Name",
      EMAIL: "Email",
      ROLE: "Role",
    },
  },

  /**
   * Email Configuration
   */
  EMAIL: {
    FROM_EMAIL: "noreply@carolinalumpers.com",
    LOGO_IMAGE_ID: "1JWcy02cP-iRj2LgJPsFE6v7w2u5WaRtL", // Google Drive image ID (same as PayrollProject)
    APPROVAL_EMAIL_TEMPLATE: "Daily Operations Approval - {date}",
  },

  /**
   * Approval Status Values
   */
  APPROVAL_STATUS: {
    DRAFT: "Draft",
    PENDING: "Pending",
    APPROVED: "Approved",
    EXCEPTION: "Exception",
  },

  /**
   * Task Status Values
   */
  TASK_STATUS: {
    COMPLETED: "Completed",
  },
};
