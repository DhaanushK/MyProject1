import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json", // downloaded from Google Cloud
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// Create and export the sheets instance
let sheetsInstance = null;

async function getSheets() {
  if (!sheetsInstance) {
    const client = await auth.getClient();
    sheetsInstance = google.sheets({ version: "v4", auth: client });
  }
  return sheetsInstance;
}

export const sheets = { spreadsheets: { get: async (params) => (await getSheets()).spreadsheets.get(params) } };

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
