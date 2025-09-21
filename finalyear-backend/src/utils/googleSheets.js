import { google } from "googleapis";
import { getGoogleAuth } from "../services/googleAuth.js";

// Create and export the sheets instance
let sheetsInstance = null;

async function getSheets() {
  if (!sheetsInstance) {
    const auth = await getGoogleAuth();
    sheetsInstance = google.sheets({ version: "v4", auth });
  }
  return sheetsInstance;
}

export const sheets = { 
  spreadsheets: { 
    get: async (params) => (await getSheets()).spreadsheets.get(params),
    values: {
      get: async (params) => (await getSheets()).spreadsheets.values.get(params),
      update: async (params) => (await getSheets()).spreadsheets.values.update(params)
    }
  } 
};

export async function appendRow(spreadsheetId, values, sheetName = "Sheet1") {
  const sheetsApi = await getSheets();
  
  await sheetsApi.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:I`, // adjust if more columns
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [values],
    },
  });
}
