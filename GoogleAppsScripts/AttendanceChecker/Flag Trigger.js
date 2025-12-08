function attendanceFlagTrigger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Attendance_Log");
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  const now = new Date();
  const email = "steve@carolinalumpers.com"; // update
  
  const weeklyLate = {};
  const monthlyAbsent = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const worker = row[1];
    const date = row[2];
    const isLate = row[6];
    const isAbsent = row[7];

    if (!worker || !date) continue;

    const week = getWeekNumber(date);
    const daysAgo = Math.floor((now - date) / (1000 * 3600 * 24));

    if (isLate) {
      weeklyLate[worker] = (weeklyLate[worker] || 0) + 1;
    }

    if (isAbsent && daysAgo <= 30) {
      monthlyAbsent[worker] = (monthlyAbsent[worker] || 0) + 1;
    }
  }

  let msg = "";

  Object.keys(weeklyLate).forEach(worker => {
    if (weeklyLate[worker] >= 3) {
      msg += `${worker} has ${weeklyLate[worker]} late arrivals this week.\n`;
    }
  });

  Object.keys(monthlyAbsent).forEach(worker => {
    if (monthlyAbsent[worker] >= 2) {
      msg += `${worker} has ${monthlyAbsent[worker]} absences in the last 30 days.\n`;
    }
  });

  if (msg.trim() !== "") {
    MailApp.sendEmail(email, "Attendance Flag Alert", msg.trim());
  }
}
