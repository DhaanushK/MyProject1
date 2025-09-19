import ExcelJS from "exceljs";

async function createTestExcel() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Metrics");

  // Add headers
  sheet.addRow(["Date", "Name", "Email", "Tickets Assigned"]);

  // Add some sample data
  sheet.addRow(["2025-09-06", "Alice", "alice@example.com", 10]);
  sheet.addRow(["2025-09-06", "Bob", "bob@example.com", 12]);

  await workbook.xlsx.writeFile("test-metrics.xlsx");
  console.log("✅ Excel file created!");
}

createTestExcel();
