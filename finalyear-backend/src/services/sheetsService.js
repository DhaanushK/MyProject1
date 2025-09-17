import { google } from "googleapis";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Authenticate with service account JSON
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "../config/credentials.json"), // <-- place your service account JSON here
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets({ version: "v4", auth });

// Replace with your sheet ID
const SHEET_ID = "1vl5gTB6OkLVSvYvnCfLwHW_FyjKUinkiKxav-5zaA80";

export async function getMetricsData() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Sheet1!A2:I", // A=Date → I=Notes
  });

  const rows = res.data.values || [];

  return rows.map(
    ([date, name, email, totalTasks, completed, pending, late, hours, notes]) => ({
      date,
      name,
      email,
      totalTasks: parseInt(totalTasks, 10) || 0,
      completed: parseInt(completed, 10) || 0,
      pending: parseInt(pending, 10) || 0,
      late: parseInt(late, 10) || 0,
      hours: parseInt(hours, 10) || 0,
      notes: notes || "",
    })
  );
}

