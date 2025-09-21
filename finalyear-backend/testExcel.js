import ExcelJS from "exceljs";

async function createTestExcel() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Metrics");

  // Add headers
  sheet.addRow(["Date", "Name", "Email", "Tickets Assigned"]);

  // Add some sample data with updated email format
  sheet.addRow(["2025-09-06", "Alice Johnson", "alice@company.com", 10]);
  sheet.addRow(["2025-09-06", "Bob Smith", "bob@company.com", 12]);

  await workbook.xlsx.writeFile("test-metrics.xlsx");
  console.log("✅ Excel file created!");
}

createTestExcel();
