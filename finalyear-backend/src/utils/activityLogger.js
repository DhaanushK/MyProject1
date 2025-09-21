import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ActivityLogger {
  constructor() {
    this.logFilePath = path.join(__dirname, '../../logs/activity_log.xlsx');
    this.ensureLogFileExists();
  }

  ensureLogFileExists() {
    const logDir = path.dirname(this.logFilePath);
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
      console.log('Created logs directory:', logDir);
    }

    // Create log file with headers if it doesn't exist
    if (!fs.existsSync(this.logFilePath)) {
      console.log('Creating new activity log file...');
      const headers = ['Date', 'Name', 'Role', 'Event'];
      const worksheet = XLSX.utils.aoa_to_sheet([headers]);
      
      // Auto-size columns
      const columnWidths = [
        { wch: 20 }, // Date
        { wch: 25 }, // Name
        { wch: 15 }, // Role
        { wch: 60 }  // Event
      ];
      worksheet['!cols'] = columnWidths;
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Activity Log');
      XLSX.writeFile(workbook, this.logFilePath);
      console.log('Activity log file created at:', this.logFilePath);
    }
  }

  logActivity(userName, userRole, eventDetails) {
    try {
      console.log(`Logging activity: ${userName} (${userRole}) - ${eventDetails}`);
      
      // Read existing workbook
      const workbook = XLSX.readFile(this.logFilePath);
      const worksheet = workbook.Sheets['Activity Log'];
      
      // Convert to array of arrays
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Create new log entry with timestamp
      const timestamp = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      
      const newEntry = [timestamp, userName, userRole, eventDetails];
      
      // Add new entry
      data.push(newEntry);
      
      // Convert back to worksheet
      const newWorksheet = XLSX.utils.aoa_to_sheet(data);
      
      // Auto-size columns
      const columnWidths = [
        { wch: 20 }, // Date
        { wch: 25 }, // Name
        { wch: 15 }, // Role
        { wch: 60 }  // Event
      ];
      newWorksheet['!cols'] = columnWidths;
      
      // Update workbook
      workbook.Sheets['Activity Log'] = newWorksheet;
      
      // Write back to file
      XLSX.writeFile(workbook, this.logFilePath);
      
      console.log(`✅ Activity logged successfully: ${userName} (${userRole})`);
      
    } catch (error) {
      console.error('❌ Error logging activity:', error);
      // Don't throw error to prevent breaking the main functionality
    }
  }

  formatMetricsEvent(action, metricsData) {
    const { date, ticketsAssigned, ticketsResolved, slaBreaches, reopenedTickets, clientInteractions, remarks } = metricsData;
    
    let event = `${action} metrics for ${date} - `;
    event += `Assigned: ${ticketsAssigned}, Resolved: ${ticketsResolved}, `;
    event += `SLA Breaches: ${slaBreaches}, Reopened: ${reopenedTickets}, `;
    event += `Client Interactions: ${clientInteractions}`;
    
    if (remarks && remarks.trim()) {
      const truncatedRemarks = remarks.length > 100 ? remarks.substring(0, 100) + '...' : remarks;
      event += ` | Remarks: ${truncatedRemarks}`;
    }
    
    return event;
  }

  // Get log file path for download
  getLogFilePath() {
    return this.logFilePath;
  }

  // Read logs from file
  readLogs() {
    try {
      if (!fs.existsSync(this.logFilePath)) {
        return [];
      }

      const workbook = XLSX.readFile(this.logFilePath);
      const worksheet = workbook.Sheets['Activity Log'];
      const logs = XLSX.utils.sheet_to_json(worksheet);

      // Sort by date (newest first)
      return logs.sort((a, b) => new Date(b.Date) - new Date(a.Date));
      
    } catch (error) {
      console.error('Error reading activity logs:', error);
      return [];
    }
  }
}

// Export a singleton instance
const activityLogger = new ActivityLogger();
export default activityLogger;