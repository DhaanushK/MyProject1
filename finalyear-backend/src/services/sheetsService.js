import { google } from "googleapis";
import { getGoogleAuth } from './googleAuth.js';

// Initialize Google Sheets API client
const initializeSheets = async () => {
  const auth = await getGoogleAuth();
  return google.sheets({ version: "v4", auth });
};

// Replace with your sheet ID
const SHEET_ID = "1vl5gTB6OkLVSvYvnCfLwHW_FyjKUinkiKxav-5zaA80";

export async function getMetricsData() {
  try {
    const sheets = await initializeSheets();
    
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
  } catch (error) {
    console.error('Error in getMetricsData:', error);
    throw new Error('Failed to fetch metrics data: ' + error.message);
  }
}

