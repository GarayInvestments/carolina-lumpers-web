function dailyAbsentCheck() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Attendance_Log");
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const date = row[2];
    const clockIn = row[4];
    const isAbsent = row[7];

    if (!date) continue;

    const rowDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (rowDate.getTime() === today.getTime()) {
      if (!clockIn && !isAbsent) {
        sheet.getRange(i + 1, 8).setValue(true);
        sheet.getRange(i + 1, 13).setValue("Absent");
      }
    }
  }
}
