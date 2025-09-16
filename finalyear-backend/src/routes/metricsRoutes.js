import express from "express";
import { authMiddleware, authorizeRoles } from "../middleware/auth.js";
import { updateMetricsExcel } from "../utils/excelHelper.js";
import User from "../models/User.js";
import path from "path";
import fs from "fs";
import { appendRow, sheets } from "../utils/googleSheets.js";
import { getUserMetricsData, getAllTeamMetricsData } from "../services/userSheetsService.js";

const router = express.Router();
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || "1vl5gTB6OkLVSvYvnCfLwHW_FyjKUinkiKxav-5zaA80";

console.log('Using spreadsheet ID:', SPREADSHEET_ID);

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

// Submit metrics route
router.post(
  "/submit",
  authMiddleware,
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const {
        ticketsAssigned,
        ticketsResolved,
        slaBreaches,
        reopenedTickets,
        clientInteractions,
        remarks
      } = req.body;

      const values = [
        new Date().toLocaleDateString(),
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
        spreadsheetId: SPREADSHEET_ID,
      });

      const userSheet = spreadsheet.data.sheets.find(sheet => 
        sheet.properties.title === user.name
      );

      if (!userSheet) {
        throw new Error("No sheet found for this user");
      }

      await appendRow(SPREADSHEET_ID, values, userSheet.properties.title);
      res.status(201).json({ message: "Metrics submitted to Google Sheet" });
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

// Get individual user metrics with KPIs
router.get(
  "/user",
  authMiddleware,
  async (req, res) => {
    try {
      console.log('User from token:', req.user);
      
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // For exact sheet name matching
      const userFullName = user.name; // This should match exactly with the sheet name
      console.log('Found user in database:', {
        id: user._id,
        name: userFullName,
        email: user.email
      });

      console.log('Attempting to get metrics for user:', userFullName, 'with spreadsheet ID:', SPREADSHEET_ID);
      
      try {
        const metrics = await getUserMetricsData(SPREADSHEET_ID, userFullName);
        console.log('Retrieved metrics count:', metrics.length);
        
        // Calculate KPIs for the user's data
        const kpis = calculateUserKPIs(metrics, { includeEfficiency: true });
        console.log('Calculated KPIs:', kpis);
        
        res.json({
          metrics,
          kpis,
          userName: user.name
        });
      } catch (error) {
        console.error('Error fetching metrics:', error);
        res.status(500).json({
          message: "Failed to fetch user metrics",
          error: error.message,
          userName: userFullName,
          spreadsheetId: SPREADSHEET_ID
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
      
      const allMetrics = await getAllTeamMetricsData(SPREADSHEET_ID);
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
