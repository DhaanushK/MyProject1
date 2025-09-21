import express from "express";
import { authMiddleware, authorizeRoles } from "../middleware/auth.js";
import activityLogger from "../utils/activityLogger.js";
import path from "path";
import fs from "fs";

const router = express.Router();

// Get activity logs (admin/team lead only)
router.get(
  "/activity",
  authMiddleware,
  authorizeRoles("project_manager", "team_lead"),
  async (req, res) => {
    try {
      console.log(`Activity logs requested by: ${req.user.name} (${req.user.role})`);
      
      const logs = activityLogger.readLogs();
      
      res.json({ 
        logs, 
        total: logs.length,
        message: logs.length === 0 ? 'No activity logs found' : `Found ${logs.length} activity logs`
      });
      
    } catch (error) {
      console.error('Error reading activity logs:', error);
      res.status(500).json({ message: 'Error retrieving activity logs' });
    }
  }
);

// Download activity logs as Excel file
router.get(
  "/activity/download",
  authMiddleware,
  authorizeRoles("project_manager", "team_lead"),
  async (req, res) => {
    try {
      console.log(`Activity logs download requested by: ${req.user.name} (${req.user.role})`);
      
      const logFilePath = activityLogger.getLogFilePath();
      
      if (!fs.existsSync(logFilePath)) {
        return res.status(404).json({ message: 'No activity logs found' });
      }

      const fileName = `activity_log_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      
      res.sendFile(path.resolve(logFilePath));
      
    } catch (error) {
      console.error('Error downloading activity logs:', error);
      res.status(500).json({ message: 'Error downloading activity logs' });
    }
  }
);

// Get activity logs summary/stats
router.get(
  "/activity/stats",
  authMiddleware,
  authorizeRoles("project_manager", "team_lead"),
  async (req, res) => {
    try {
      const logs = activityLogger.readLogs();
      
      // Calculate stats
      const totalLogs = logs.length;
      const submissionCount = logs.filter(log => log.Event && log.Event.includes('Submitted')).length;
      const updateCount = logs.filter(log => log.Event && log.Event.includes('Updated')).length;
      
      // Get unique users
      const uniqueUsers = [...new Set(logs.map(log => log.Name))];
      
      // Get logs by role
      const roleStats = logs.reduce((acc, log) => {
        const role = log.Role || 'Unknown';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {});
      
      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentLogs = logs.filter(log => {
        const logDate = new Date(log.Date);
        return logDate >= sevenDaysAgo;
      });
      
      res.json({
        totalLogs,
        submissionCount,
        updateCount,
        uniqueUsers: uniqueUsers.length,
        roleStats,
        recentActivity: recentLogs.length,
        usersList: uniqueUsers
      });
      
    } catch (error) {
      console.error('Error getting activity stats:', error);
      res.status(500).json({ message: 'Error retrieving activity statistics' });
    }
  }
);

export default router;