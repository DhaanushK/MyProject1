import { google } from 'googleapis';

let sheetsInstance = null;

export const sheets = { 
  auth: null,
  spreadsheets: { 
    get: async (params) => (await getSheets()).spreadsheets.get(params),
    values: {
      get: async (params) => (await getSheets()).spreadsheets.values.get(params),
      update: async (params) => (await getSheets()).spreadsheets.values.update(params),
      append: async (params) => (await getSheets()).spreadsheets.values.append(params)
    }
  }
};

/**
 * Append a row to a Google Sheet
 * @param {string} spreadsheetId - The ID of the spreadsheet
 * @param {string} range - The A1 notation of the range to append to
 * @param {Array} values - The values to append
 * @returns {Promise<any>} The append response
 */
export async function appendRow(spreadsheetId, range, values) {
  try {
    if (!spreadsheetId) throw new Error('Spreadsheet ID is required');
    if (!range) throw new Error('Range is required');
    if (!values || !Array.isArray(values)) throw new Error('Values must be an array');
    
    console.log('Appending row:', {
      spreadsheetId,
      range,
      values: values
    });

    const sheetsApi = await getSheets();
    
    // Format values to strings to prevent type issues
    const formattedValues = values.map(val => 
      val === null || val === undefined ? '' : String(val)
    );

    const result = await sheetsApi.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [formattedValues]
      }
    });

    console.log('Successfully appended row:', result.data);
    return result;
  } catch (error) {
    console.error('Error appending row:', {
      error,
      spreadsheetId,
      range,
      values
    });
    throw new Error(`Failed to append row: ${error.message}`);
  }
};

/**
 * Initialize Google Sheets API client
 * @returns {Promise<any>} Google Sheets API client
 */
async function initializeSheetsClient() {
    try {
        if (sheetsInstance) {
            return sheetsInstance;
        }

        console.log('Initializing Google Sheets client...');
        
        // Load credentials
        const credentials = {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            project_id: process.env.GOOGLE_PROJECT_ID
        };

        // Create auth client
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/spreadsheets.readonly',
                'https://www.googleapis.com/auth/drive.readonly'
            ]
        });

        // Create Google Sheets instance
        const sheetsApi = google.sheets({ version: 'v4', auth });
        sheets.auth = auth; // Store auth for other services to use
        console.log('Google Sheets client initialized successfully');
        return sheetsApi;
    } catch (error) {
        console.error('Error initializing Google Sheets client:', error);
        throw new Error(`Failed to initialize Google Sheets: ${error.message}`);
    }
}

/**
 * Get Google Sheets instance (creates one if it doesn't exist)
 * @returns {Promise<any>} Google Sheets API client
 */
export async function getSheets() {
    if (!sheetsInstance) {
        sheetsInstance = await initializeSheetsClient();
    }
    return sheetsInstance;
}

/**
 * Read data from a specific sheet
 * @param {string} spreadsheetId - The ID of the spreadsheet
 * @param {string} range - The A1 notation of the range to read
 * @returns {Promise<Array>} The values from the sheet
 */
export async function readSheetData(spreadsheetId, range) {
    try {
        const sheets = await getSheets();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });
        return response.data.values;
    } catch (error) {
        console.error('Error reading sheet data:', error);
        throw new Error(`Failed to read sheet data: ${error.message}`);
    }
}

/**
 * Export spreadsheet as Excel
 * @param {string} spreadsheetId - The ID of the spreadsheet
 * @returns {Promise<Buffer>} The Excel file as a buffer
 */
export async function exportAsExcel(spreadsheetId) {
    try {
        await getSheets(); // Initialize the sheets client if needed
        const drive = google.drive({ version: 'v3', auth: sheets.auth });

        // Get file info
        const fileInfo = await drive.files.get({
            fileId: spreadsheetId,
            fields: 'name'
        });

        // Export the file as Excel
        const response = await drive.files.export({
            fileId: spreadsheetId,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            alt: 'media'
        }, { responseType: 'arraybuffer' });

        const buffer = Buffer.from(response.data);
        return {
            data: buffer,
            filename: `${fileInfo.data.name || 'spreadsheet'}.xlsx`
        };
    } catch (error) {
        console.error('Error exporting sheet:', error);
        throw new Error(`Failed to export sheet: ${error.message}`);
    }
}

/**
 * Validate sheet existence and access
 * @param {string} spreadsheetId - The ID of the spreadsheet
 * @returns {Promise<boolean>} True if sheet exists and is accessible
 */
export async function validateSheet(spreadsheetId) {
    try {
        const sheets = await getSheets();
        await sheets.spreadsheets.get({
            spreadsheetId,
            fields: 'spreadsheetId'
        });
        return true;
    } catch (error) {
        console.error('Sheet validation failed:', error);
        return false;
    }
}