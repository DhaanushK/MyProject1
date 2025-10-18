import { google } from "googleapis";
import { getSheets } from "../services/googleSheets.js";

// Create and export the sheets instance
let sheetsInstance = null;

async function initializeSheets() {
  if (!sheetsInstance) {
    sheetsInstance = await getSheets();
  }
  return sheetsInstance;
}

export const sheets = { 
  spreadsheets: { 
    get: async (params) => (await initializeSheets()).spreadsheets.get(params),
    values: {
      get: async (params) => (await initializeSheets()).spreadsheets.values.get(params),
      update: async (params) => (await initializeSheets()).spreadsheets.values.update(params)
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
