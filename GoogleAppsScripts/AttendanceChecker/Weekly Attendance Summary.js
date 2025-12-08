function weeklyAttendanceSummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Attendance_Log");
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  const today = new Date();
  const currentWeek = getWeekNumber(today);
  const email = "your@email.com"; // update

  let lateCount = 0;
  let absentCount = 0;
  let totalShifts = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const date = row[2];
    const isLate = row[6];
    const isAbsent = row[7];

    if (!date) continue;

    const week = getWeekNumber(date);
    if (week === currentWeek) {
      totalShifts++;
      if (isLate) lateCount++;
      if (isAbsent) absentCount++;
    }
  }

  const summary = `
Weekly Attendance Summary
Week: ${currentWeek}

Total Shifts: ${totalShifts}
Late: ${lateCount}
Absent: ${absentCount}
  `.trim();

  MailApp.sendEmail(email, "Weekly Attendance Summary", summary);
}

function getWeekNumber(date) {
  return Utilities.formatDate(date, "GMT-5", "w");
}
