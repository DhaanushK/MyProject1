import express from "express";
import { authMiddleware, authorizeRoles } from "../middleware/auth.js";
import DateValidator from "../middleware/dateValidation.js";
import eventLogger from "../services/eventLogger.js";
import activityLogger from "../utils/activityLogger.js";
import { sheets, appendRow } from "../utils/googleSheets.js";
import { getUserMetricsData, getAllTeamMetricsData } from "../services/userSheetsService.js";
import User from "../models/User.js";
import path from "path";
import fs from "fs";
import { google } from "googleapis";
import { getGoogleAuth } from "../services/googleAuth.js";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// APPROVED EMAILS FOR METRICS SUBMISSION
// Only users with these email addresses can submit metrics to dashboards
const APPROVED_EMAILS = [
  'dhaanushk1110@gmail.com',      // Project Manager - unchanged
  'kanishkka0208@gmail.com',      // Team Member
  'japraveen1212@gmail.com',      // Team Member  
  'winnish0703@gmail.com',        // Team Member
  'reddyvuppu3@gmail.com',        // Team Member - Updated
  'jsam290104@gmail.com',         // Team Member - Updated
  'kkumar05@gmail.com'            // Team Member
];

/**
 * Middleware to validate if user email is approved for metrics submission
 */
const validateApprovedEmail = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!APPROVED_EMAILS.includes(user.email)) {
      return res.status(403).json({ 
        message: "Access denied: Your email is not approved for metrics submission",
        userEmail: user.email,
        approvedEmails: APPROVED_EMAILS
      });
    }

    req.user.email = user.email; // Attach email to request for further use
    next();
  } catch (error) {
    console.error('Error validating email:', error);
    res.status(500).json({ message: "Error validating user email" });
  }
};

console.log('Using spreadsheet ID:', process.env.SPREADSHEET_ID);
router.put(
  "/update",
  authMiddleware,
  validateApprovedEmail, // NEW: Validate email is approved
  DateValidator.validateDateForEntry,
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      console.log(`✅ Metrics update approved for: ${user.email}`);

      const {
        date,
        ticketsAssigned,
        ticketsResolved,
        slaBreaches,
        reopenedTickets,
        clientInteractions,
        remarks
      } = req.body;

      if (!date) {
        return res.status(400).json({ message: "Date is required for updates" });
      }

      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: process.env.SPREADSHEET_ID,
      });

      const userSheet = spreadsheet.data.sheets.find(sheet => 
        sheet.properties.title === user.name
      );

      if (!userSheet) {
        throw new Error("No sheet found for this user");
      }

      // Get current data to find the row to update
      const range = `${user.name}!A:I`;
      const result = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: range,
      });

      const rows = result.data.values || [];
      let rowIndex = -1;
      let oldValues = {};

      // Find the row with matching date
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === date) {
          rowIndex = i + 1; // Sheet rows are 1-indexed
          oldValues = {
            ticketsAssigned: rows[i][3] || '',
            ticketsResolved: rows[i][4] || '',
            slaBreaches: rows[i][5] || '',
            reopenedTickets: rows[i][6] || '',
            clientInteractions: rows[i][7] || '',
            remarks: rows[i][8] || ''
          };
          break;
        }
      }

      if (rowIndex === -1) {
        return res.status(404).json({ message: "No entry found for the specified date" });
      }

      // Update the specific row
      const updateRange = `${user.name}!A${rowIndex}:I${rowIndex}`;
      const newValues = [
        date,
        user.name,
        user.email,
        ticketsAssigned,
        ticketsResolved,
        slaBreaches,
        reopenedTickets,
        clientInteractions,
        remarks,
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: updateRange,
        valueInputOption: 'RAW',
        resource: {
          values: [newValues]
        }
      });

      // Log the update to activity logger
      const eventDetails = activityLogger.formatMetricsEvent('Updated', {
        date,
        ticketsAssigned,
        ticketsResolved,
        slaBreaches,
        reopenedTickets,
        clientInteractions,
        remarks
      });
      activityLogger.logActivity(user.name, user.role, eventDetails);

      // Log each changed field to event logger (existing functionality)
      const fields = [
        { name: 'Tickets Assigned', old: oldValues.ticketsAssigned, new: ticketsAssigned },
        { name: 'Tickets Resolved', old: oldValues.ticketsResolved, new: ticketsResolved },
        { name: 'SLA Breaches', old: oldValues.slaBreaches, new: slaBreaches },
        { name: 'Reopened Tickets', old: oldValues.reopenedTickets, new: reopenedTickets },
        { name: 'Client Interactions', old: oldValues.clientInteractions, new: clientInteractions },
        { name: 'Remarks', old: oldValues.remarks, new: remarks }
      ];

      for (const field of fields) {
        if (field.old !== field.new.toString()) {
          await eventLogger.logEvent({
            userName: user.name,
            userRole: user.role,
            action: 'UPDATE',
            sheetName: user.name,
            cellRange: `Row ${rowIndex}`,
            oldValue: field.old,
            newValue: field.new,
            rowName: `Metrics for ${date}`,
            columnName: field.name
          });
        }
      }

      res.status(200).json({ 
        message: "Metrics updated successfully",
        date: date,
        userName: user.name
      });
    } catch (err) {
      console.error('Error updating metrics:', err);
      res.status(500).json({ message: err.message });
    }
  }
);

// Team Lead checks team's status
router.get(
  "/team",
  authMiddleware,
  authorizeRoles("team_lead"),
  (req, res) => {
    res.json({ message: "Team Lead can see team metrics" });
  }
);

console.log('Using spreadsheet ID:', process.env.SPREADSHEET_ID);

// Consolidated KPI calculation function
function calculateUserKPIs(data, options = { includeEfficiency: false }) {
  const totalTasks = data.reduce((sum, d) => sum + d.totalTasks, 0);
  const completedTasks = data.reduce((sum, d) => sum + d.completed, 0);
  const pendingTasks = data.reduce((sum, d) => sum + d.pending, 0);
  const lateTasks = data.reduce((sum, d) => sum + d.late, 0);
  const totalClientInteractions = data.reduce((sum, d) => sum + (d.clientInteractions || 0), 0);

  const result = {
    totalTasks,
    completedTasks,
    pendingTasks,
    lateTasks,
    totalClientInteractions,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
  };

  if (options.includeEfficiency) {
    result.efficiency = totalClientInteractions > 0 
      ? Math.round((completedTasks / totalClientInteractions) * 100) / 100 
      : 0;
  }

  return result;
}

// Submit metrics route with date validation, email validation, and logging
router.post(
  "/submit",
  authMiddleware,
  validateApprovedEmail, // NEW: Validate email is approved
  DateValidator.validateDateForTeamLead, // Use team lead validation for flexibility
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      console.log(`✅ Metrics submission approved for: ${user.email}`);

      const {
        date,
        ticketsAssigned,
        ticketsResolved,
        slaBreaches,
        reopenedTickets,
        clientInteractions,
        remarks
      } = req.body;

      // Use provided date or current date in MM/DD/YYYY format
      const submissionDate = date || new Date().toLocaleDateString('en-US');

      const values = [
        submissionDate,
        user.name,
        user.email,
        ticketsAssigned,
        ticketsResolved,
        slaBreaches,
        reopenedTickets,
        clientInteractions,
        remarks,
      ];

      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: process.env.SPREADSHEET_ID,
      });

      const userSheet = spreadsheet.data.sheets.find(sheet => 
        sheet.properties.title === user.name
      );

      if (!userSheet) {
        throw new Error("No sheet found for this user");
      }

      await appendRow(process.env.SPREADSHEET_ID, values, userSheet.properties.title);

      // Log the submission to activity logger
      const eventDetails = activityLogger.formatMetricsEvent('Submitted', {
        date: submissionDate,
        ticketsAssigned,
        ticketsResolved,
        slaBreaches,
        reopenedTickets,
        clientInteractions,
        remarks
      });
      activityLogger.logActivity(user.name, user.role, eventDetails);

      // Log the submission to event logger (existing functionality)
      await eventLogger.logEvent({
        userName: user.name,
        userRole: user.role,
        action: 'INSERT',
        sheetName: user.name,
        cellRange: `Row for ${submissionDate}`,
        newValue: JSON.stringify({
          ticketsAssigned,
          ticketsResolved,
          slaBreaches,
          reopenedTickets,
          clientInteractions
        }),
        rowName: `Metrics for ${submissionDate}`,
        columnName: 'All Fields'
      });

      res.status(201).json({ 
        message: "Metrics submitted to Google Sheet",
        date: submissionDate,
        userName: user.name,
        userEmail: user.email
      });
    } catch (err) {
      console.error('Error submitting metrics:', err);
      res.status(500).json({ message: err.message });
    }
  }
);

// Team Lead checks team’s status
router.get(
  "/team",
  authMiddleware,
  authorizeRoles("team_lead"),
  (req, res) => {
    res.json({ message: "Team Lead can see team metrics" });
  }
);

// Get individual user metrics with KPIs (only for approved emails)
router.get(
  "/user",
  authMiddleware,
  validateApprovedEmail, // NEW: Validate email is approved
  async (req, res) => {
    try {
      console.log('User from token:', req.user);
      
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      console.log(`✅ Metrics dashboard access approved for: ${user.email}`);

      // For exact sheet name matching
      const userFullName = user.name; // This should match exactly with the sheet name
      console.log('Found user in database:', {
        id: user._id,
        name: userFullName,
        email: user.email
      });

      console.log('Attempting to get metrics for user:', userFullName, 'with spreadsheet ID:', process.env.SPREADSHEET_ID);
      
      try {
        const metrics = await getUserMetricsData(process.env.SPREADSHEET_ID, userFullName);
        console.log('Retrieved metrics count:', metrics.length);
        
        // Calculate KPIs for the user's data
        const kpis = calculateUserKPIs(metrics, { includeEfficiency: true });
        console.log('Calculated KPIs:', kpis);
        
        res.json({
          metrics,
          kpis,
          userName: user.name,
          userEmail: user.email
        });
      } catch (error) {
        console.error('Error fetching metrics:', error);
        res.status(500).json({
          message: "Failed to fetch user metrics",
          error: error.message,
          userName: userFullName,
          spreadsheetId: process.env.SPREADSHEET_ID
        });
      }
    } catch (err) {
      console.error('Error in /user route:', err);
      // Send a more specific error message
      res.status(500).json({ 
        message: "Failed to fetch user metrics", 
        error: err.message,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  }
);

// Project Manager full control
router.get(
  "/all",
  authMiddleware,
  authorizeRoles("project_manager"),
  async (req, res) => {
    try {
      console.log('=== /metrics/all endpoint called ===');
      console.log('PM user:', req.user);
      
      const allMetrics = await getAllTeamMetricsData(process.env.SPREADSHEET_ID);
      console.log('Total metrics fetched:', allMetrics.length);
      
      // Calculate aggregated KPIs for all team members
      const aggregatedKPIs = calculateUserKPIs(allMetrics, { includeEfficiency: true });
      
      // Group metrics by user for individual analysis
      const userMetrics = {};
      allMetrics.forEach(metric => {
        // Use sheet name for grouping to ensure consistency
        const userName = metric.sheetName || metric.name;
        if (!userMetrics[userName]) {
          userMetrics[userName] = [];
        }
        userMetrics[userName].push(metric);
      });

      // Calculate individual user KPIs
      const individualKPIs = {};
      Object.keys(userMetrics).forEach(userName => {
        individualKPIs[userName] = calculateUserKPIs(userMetrics[userName]);
      });

      console.log('Sending team data:', {
        totalMetrics: allMetrics.length,
        teamMembers: Object.keys(individualKPIs),
        aggregatedKPIs
      });

      res.json({
        allMetrics,
        aggregatedKPIs,
        individualKPIs,
        userMetrics
      });
    } catch (err) {
      console.error('Error fetching all metrics:', err);
      res.status(500).json({ message: err.message });
    }
  }
);

router.get(
  "/download",
  authMiddleware,
  authorizeRoles("team_lead", "project_manager"),
  (req, res) => {
    const filePath = path.join(process.cwd(), "metrics.xlsx");

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Metrics file not found" });
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=metrics.xlsx");

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }
);

export default router;
