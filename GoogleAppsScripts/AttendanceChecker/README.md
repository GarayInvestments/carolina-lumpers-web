# Attendance Checker System

**Project ID**: `12ScwfQnPliw0lj4qSQy2HlfSoea3n_qC2mYO9_DiprXFHVsMOIylNX9R`

An automated Google Apps Script system for monitoring employee attendance patterns and sending alerts for late arrivals and absences.

## 📋 System Overview

This project monitors attendance data in a Google Sheets "Attendance_Log" and provides:
- Daily automatic absent marking for no-shows
- Weekly attendance summaries 
- Alert flags for repeated tardiness and absences

## 📊 Sheet Schema

**Sheet Name**: `Attendance_Log`

### Complete Table Structure

| Column | Field | Data Type | Description | Formula/Logic |
|--------|-------|-----------|-------------|---------------|
| A | Record_ID | String | Unique identifier for each attendance record | Manual entry |
| B | Worker_ID | String | Employee identifier (e.g., "SG-001") | Manual entry |
| C | Date | Date | Shift date (YYYY-MM-DD) | Manual entry |
| D | Scheduled_Start | Time | Expected start time for shift | Manual entry |
| E | Clock_In_Time | Time | Actual clock-in timestamp | Manual entry |
| F | Clock_Out_Time | Time | Clock-out timestamp | Manual entry |
| G | Is_Late | Boolean | TRUE if late arrival | `=IF(AND(NOT(ISBLANK(E2)), E2 > (D2 + TIME(0,5,0))), TRUE, FALSE)` |
| H | Is_Absent | Boolean | TRUE if absent | `=IF(AND(ISBLANK(E2), NOW() > (DATE(YEAR(C2), MONTH(C2), DAY(C2)) + TIME(12,0,0))), TRUE, FALSE)` |
| I | Minutes_Late | Number | Minutes late (0 if on-time) | `=IF(G2, (E2 - (D2 + TIME(0,5,0))) * 1440, 0)` |
| J | Hours_Worked | Number | Total hours for shift | `=IF(AND(NOT(ISBLANK(E2)), NOT(ISBLANK(F2))), (F2 - E2) * 24, 0)` |
| K | Week_Number | Number | Week number of year | `=IF(C2="", "", WEEKNUM(C2))` |
| L | Month | String | Month name | `=IF(C2="", "", TEXT(C2, "MMMM"))` |
| M | Attendance_Status | String | Status summary | `=IF(H2, "Absent", IF(G2, "Late", "On-Time"))` |
| N | Notes | String | Additional comments | Manual entry |

### Business Rules

**Late Arrival Logic**:
- Employee is "Late" if clock-in time > (scheduled start + 5 minutes)
- Grace period: 5 minutes after scheduled start

**Absence Logic**:
- Employee is "Absent" if no clock-in recorded AND current time > 12:00 PM on shift date
- Auto-absence marking happens at noon

**Status Hierarchy**:
1. **Absent**: No clock-in by 12 PM
2. **Late**: Clock-in after grace period
3. **On-Time**: Clock-in within grace period

### Sample Data

| Record_ID | Worker_ID | Date | Scheduled_Start | Clock_In_Time | Clock_Out_Time | Is_Late | Is_Absent | Minutes_Late | Hours_Worked | Week_Number | Month | Attendance_Status | Notes |
|-----------|-----------|------|----------------|---------------|----------------|---------|-----------|-------------|-------------|-------------|--------|-------------------|--------|
| ATT001 | SG-001 | 2025-11-28 | 8:00 AM | 8:03 AM | 5:00 PM | FALSE | FALSE | 0 | 9 | 48 | November | On-Time | |
| ATT002 | CLS-001 | 2025-11-28 | 8:00 AM | 8:07 AM | 4:30 PM | TRUE | FALSE | 2 | 8.38 | 48 | November | Late | Traffic |
| ATT003 | CLS-002 | 2025-11-28 | 8:00 AM | | | FALSE | TRUE | 0 | 0 | 48 | November | Absent | No call |

## 🔧 Core Functions

### 1. Daily Absent Check (`Daily Absent Check.js`)
```javascript
function dailyAbsentCheck()
```
**Purpose**: Automatically marks employees as absent if they haven't clocked in for today's shift
- **Trigger**: Daily (recommended at 6 PM)
- **Logic**: If no clock-in time (Column E) AND not already marked absent → set absent flag
- **Action**: Updates columns H (Is_Absent=true) and M (Attendance_Status="Absent")
- **Note**: Works with the formula-driven absence detection but provides manual override capability

### 2. Weekly Attendance Summary (`Weekly Attendance Summary.js`)
```javascript
function weeklyAttendanceSummary()
```
**Purpose**: Generates and emails weekly attendance statistics
- **Trigger**: Weekly (recommended: Sunday nights at 11 PM)
- **Metrics**: Total shifts, late count, absent count for current week
- **Data Source**: Reads from columns C (Date), G (Is_Late), H (Is_Absent)
- **Week Calculation**: Uses `getWeekNumber()` helper function
- **Email**: Sends summary to configured address
- **Note**: Update `email` variable before use

### 3. Attendance Flag Alerts (`Flag Trigger.js`)
```javascript
function attendanceFlagTrigger()
```
**Purpose**: Sends alerts for concerning attendance patterns
- **Trigger**: Daily or weekly (recommended: daily at 7 AM)
- **Data Source**: Reads from columns B (Worker_ID), C (Date), G (Is_Late), H (Is_Absent)
- **Late Alert**: 3+ late arrivals in current week per worker
- **Absent Alert**: 2+ absences in last 30 days per worker
- **Thresholds**: Configurable (currently 3 late, 2 absent)
- **Email**: Currently set to `steve@carolinalumpers.com`
- **Note**: Update `email` variable before use

## ⚙️ Setup & Configuration

### 1. Create Attendance Table

First, create the attendance tracking table with proper schema:

```javascript
function createAttendanceTable() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = "Attendance_Log";

  // Check if sheet exists
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  } else {
    sheet.clear(); // optional: wipe old data
  }

  // Define attendance table structure
  const headers = [
    "Record_ID", "Worker_ID", "Date", "Scheduled_Start",
    "Clock_In_Time", "Clock_Out_Time", "Is_Late", "Is_Absent",
    "Minutes_Late", "Hours_Worked", "Week_Number", "Month",
    "Attendance_Status", "Notes"
  ];

  // Write headers and format
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  sheet.getRange("A1:N1").setFontWeight("bold").setBackground("#e8e8e8");
  sheet.setColumnWidths(1, headers.length, 150);

  // Add calculated field formulas (copy to all data rows)
  const row = 2;
  sheet.getRange(row, 7).setFormula('=IF(AND(NOT(ISBLANK(E2)), E2 > (D2 + TIME(0,5,0))), TRUE, FALSE)'); // Is_Late
  sheet.getRange(row, 8).setFormula('=IF(AND(ISBLANK(E2), NOW() > (DATE(YEAR(C2), MONTH(C2), DAY(C2)) + TIME(12,0,0))), TRUE, FALSE)'); // Is_Absent
  sheet.getRange(row, 9).setFormula('=IF(G2, (E2 - (D2 + TIME(0,5,0))) * 1440, 0)'); // Minutes_Late
  sheet.getRange(row, 10).setFormula('=IF(AND(NOT(ISBLANK(E2)), NOT(ISBLANK(F2))), (F2 - E2) * 24, 0)'); // Hours_Worked
  sheet.getRange(row, 11).setFormula('=IF(C2="", "", WEEKNUM(C2))'); // Week_Number
  sheet.getRange(row, 12).setFormula('=IF(C2="", "", TEXT(C2, "MMMM"))'); // Month
  sheet.getRange(row, 13).setFormula('=IF(H2, "Absent", IF(G2, "Late", "On-Time"))'); // Attendance_Status

  Logger.log("Attendance table created with full schema.");
}
```

### 2. Update Configuration

Before using the monitoring system:

1. **Update Email Addresses**:
   ```javascript
   // In Weekly Attendance Summary.js
   const email = "your@email.com"; // Change this
   
   // In Flag Trigger.js  
   const email = "steve@carolinalumpers.com"; // Change this
   ```

2. **Set Up Automated Triggers**:
   - `dailyAbsentCheck()`: Daily at end of workday (6 PM recommended)
   - `weeklyAttendanceSummary()`: Weekly (Sunday nights at 11 PM)
   - `attendanceFlagTrigger()`: Daily or weekly as needed

3. **Column Mapping Updates**:
   The monitoring functions reference the correct column positions:
   - Column B: Worker_ID (not generic "Worker")
   - Column C: Date 
   - Column E: Clock_In_Time (not "ClockIn")
   - Column G: Is_Late (Boolean)
   - Column H: Is_Absent (Boolean)
   - Column M: Attendance_Status (not generic "Status")

## 🚀 Deployment

```powershell
# Navigate to project directory
cd "GoogleAppsScripts/AttendanceChecker"

# Push code to Google Apps Script
clasp push

# Open in Apps Script editor to configure triggers
clasp open
```

## 🔗 Integration Notes

This system appears to be designed to work alongside:
- A time tracking system that populates attendance data
- Employee management workflow
- Notification systems for HR/management

**Related Systems**:
- Could integrate with Carolina Lumpers EmployeeLogin system
- Compatible with existing Google Sheets attendance tracking
- Complements time tracking and payroll workflows

## 📝 Maintenance

- Review email addresses quarterly
- Monitor trigger execution logs
- Adjust alert thresholds as needed (currently 3 late arrivals, 2 absences)
- Verify sheet structure if attendance tracking system changes

## ⚠️ Important Notes

- Email addresses are hardcoded and must be updated
- Assumes specific Google Sheets column structure
- Uses Google Apps Script MailApp for notifications
- Time calculations use GMT-5 time zone
- Week numbering uses Google Sheets `Utilities.formatDate()` function