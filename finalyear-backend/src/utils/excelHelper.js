// src/utils/excelHelper.js
import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";

const filePath = path.join(process.cwd(), "metrics.xlsx");

export async function updateMetricsExcel(user, metricsData) {
  const workbook = new ExcelJS.Workbook();
  let sheet;

  if (fs.existsSync(filePath)) {
    try {
      await workbook.xlsx.readFile(filePath);
      sheet = workbook.getWorksheet("Metrics");
      if (!sheet) {
        sheet = workbook.addWorksheet("Metrics");
        sheet.addRow([
          "Date",
          "Name",
          "Email",
          "Tickets Assigned",
          "Tickets Resolved",
          "SLA Breaches",
          "Reopened Tickets",
          "Client Interactions",
          "Remarks",
        ]);
      }
    } catch (err) {
      console.error("Failed to read existing Excel, creating new one:", err);
      sheet = workbook.addWorksheet("Metrics");
      sheet.addRow([
        "Date",
        "Name",
        "Email",
        "Tickets Assigned",
        "Tickets Resolved",
        "SLA Breaches",
        "Reopened Tickets",
        "Client Interactions",
        "Remarks",
      ]);
    }
  } else {
    sheet = workbook.addWorksheet("Metrics");
    sheet.addRow([
      "Date",
      "Name",
      "Email",
      "Tickets Assigned",
      "Tickets Resolved",
      "SLA Breaches",
      "Reopened Tickets",
      "Client Interactions",
      "Remarks",
    ]);
  }

  // ✅ Add one new row
  sheet.addRow([
    new Date().toLocaleDateString('en-US'), // Use MM/DD/YYYY format
    user.name,
    user.email,
    metricsData.ticketsAssigned,
    metricsData.ticketsResolved,
    metricsData.slaBreaches,
    metricsData.reopenedTickets,
    metricsData.clientInteractions,
    metricsData.remarks,
  ]);

  await workbook.xlsx.writeFile(filePath);
  console.log("Metrics updated in Excel:", filePath);
}
