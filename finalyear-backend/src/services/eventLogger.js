import { google } from 'googleapis';
import { getGoogleAuth } from './googleAuth.js';

class EventLogger {
    constructor() {
        this.logSheetId = process.env.SPREADSHEET_ID; // Use the same spreadsheet for logs
        this.logSheetName = 'Event_Logs';
    }

    /**
     * Log an event to Google Sheets
     * @param {Object} eventData - The event data to log
     * @param {string} eventData.userName - Name of the user
     * @param {string} eventData.userRole - Team Lead / Team Member
     * @param {string} eventData.action - Type of action (INSERT, UPDATE, DELETE)
     * @param {string} eventData.sheetName - Name of the sheet modified
     * @param {string} eventData.cellRange - Cell range modified (e.g., "B5")
     * @param {string} eventData.oldValue - Previous value (for updates)
     * @param {string} eventData.newValue - New value
     * @param {string} eventData.rowName - Row identifier/name
     * @param {string} eventData.columnName - Column identifier/name
     */
    async logEvent(eventData) {
        try {
            const auth = await getGoogleAuth();
            const sheets = google.sheets({ version: 'v4', auth });

            // Ensure log sheet exists
            await this.ensureLogSheetExists(sheets);

            // Format the log entry
            const logEntry = this.formatLogEntry(eventData);

            // Append to log sheet
            await sheets.spreadsheets.values.append({
                spreadsheetId: this.logSheetId,
                range: `${this.logSheetName}!A:H`,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [logEntry]
                }
            });

            console.log(`✅ Event logged: ${eventData.userName} - ${eventData.action} in ${eventData.sheetName}`);
            return true;
        } catch (error) {
            console.error('❌ Failed to log event:', error);
            // Don't throw error to prevent disrupting main operations
            return false;
        }
    }

    /**
     * Format log entry for Google Sheets
     */
    formatLogEntry(eventData) {
        const timestamp = new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const changeDescription = this.buildChangeDescription(eventData);

        return [
            timestamp,                    // Column A: Date-Time
            eventData.userName,           // Column B: Name
            eventData.userRole,          // Column C: Role
            eventData.action,            // Column D: Action Type
            eventData.sheetName,         // Column E: Sheet Name
            changeDescription,           // Column F: Change Description
            eventData.cellRange || '',   // Column G: Cell Range
            eventData.newValue || ''     // Column H: New Value
        ];
    }

    /**
     * Build human-readable change description
     */
    buildChangeDescription(eventData) {
        const { action, rowName, columnName, oldValue, newValue, cellRange } = eventData;

        switch (action) {
            case 'INSERT':
                return `Added entry "${newValue}" in ${rowName || cellRange}`;
            
            case 'UPDATE':
                if (oldValue && newValue) {
                    return `Modified entry from "${oldValue}" to "${newValue}" in ${rowName || cellRange}`;
                }
                return `Updated entry to "${newValue}" in ${rowName || cellRange}`;
            
            case 'DELETE':
                return `Deleted entry "${oldValue}" from ${rowName || cellRange}`;
            
            case 'BULK_UPDATE':
                return `Performed bulk update in ${rowName || 'multiple rows'}`;
            
            default:
                return `${action} operation in ${rowName || cellRange}`;
        }
    }

    /**
     * Ensure the log sheet exists with proper headers
     */
    async ensureLogSheetExists(sheets) {
        try {
            // Check if log sheet exists
            const response = await sheets.spreadsheets.get({
                spreadsheetId: this.logSheetId
            });

            const logSheetExists = response.data.sheets.some(
                sheet => sheet.properties.title === this.logSheetName
            );

            if (!logSheetExists) {
                console.log('📋 Creating Event_Logs sheet...');
                
                // Create log sheet
                await sheets.spreadsheets.batchUpdate({
                    spreadsheetId: this.logSheetId,
                    requestBody: {
                        requests: [{
                            addSheet: {
                                properties: {
                                    title: this.logSheetName,
                                    gridProperties: {
                                        rowCount: 1000,
                                        columnCount: 8
                                    }
                                }
                            }
                        }]
                    }
                });

                // Add headers
                await sheets.spreadsheets.values.update({
                    spreadsheetId: this.logSheetId,
                    range: `${this.logSheetName}!A1:H1`,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: {
                        values: [[
                            'Date-Time',
                            'Name',
                            'Role',
                            'Action',
                            'Sheet Name',
                            'Change Description',
                            'Cell Range',
                            'New Value'
                        ]]
                    }
                });

                console.log(`✅ Created log sheet: ${this.logSheetName}`);
            }
        } catch (error) {
            console.error('❌ Error ensuring log sheet exists:', error);
        }
    }

    /**
     * Get recent logs for a specific user or all users
     */
    async getRecentLogs(userName = null, limit = 50) {
        try {
            const auth = await getGoogleAuth();
            const sheets = google.sheets({ version: 'v4', auth });

            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: this.logSheetId,
                range: `${this.logSheetName}!A2:H`
            });

            let logs = response.data.values || [];
            
            // Filter by user if specified
            if (userName) {
                logs = logs.filter(log => log[1] === userName);
            }

            // Sort by date (most recent first) and limit
            return logs
                .sort((a, b) => new Date(b[0]) - new Date(a[0]))
                .slice(0, limit)
                .map(log => ({
                    timestamp: log[0],
                    userName: log[1],
                    userRole: log[2],
                    action: log[3],
                    sheetName: log[4],
                    changeDescription: log[5],
                    cellRange: log[6],
                    newValue: log[7]
                }));
        } catch (error) {
            console.error('❌ Failed to get recent logs:', error);
            return [];
        }
    }
}

export default new EventLogger();