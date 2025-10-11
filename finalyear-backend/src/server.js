import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import compression from "compression";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import metricsRoutes from "./routes/metricsRoutes.js";
import logsRoutes from "./routes/logsRoutes.js";
import projectManagerEmailRoutes from "./routes/projectManagerEmailRoutes.js"; // ✅ New email routes
import teamLeaderEmailRoutes from "./routes/teamLeaderEmailRoutes.js"; // ✅ Team Leader email routes
import teamMemberEmailRoutes from "./routes/teamMemberEmailRoutes.js"; // ✅ Team Member email routes
dotenv.config();

// Initialize database connection
let dbConnection;
(async () => {
  try {
    dbConnection = await connectDB();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
})();

const app = express();

// CORS Configuration with improved error handling
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control', 'Pragma'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // Cache preflight requests for 10 minutes
}));

// Add security headers and improved error handling
app.use((req, res, next) => {
  // Remove problematic headers
  res.removeHeader('Connection');
  
  // Set security and caching headers
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  
  next();
});

// Add compression middleware
app.use(compression());

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/logs", logsRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle specific types of errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Invalid token' });
  }
  
  // Default error response
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Perform cleanup and exit gracefully
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Perform cleanup and exit gracefully
  process.exit(1);
});
app.use("/api/pm-email", projectManagerEmailRoutes); // ✅ New PM email routes
app.use("/api/tl-email", teamLeaderEmailRoutes); // ✅ Team Leader email routes
app.use("/api/tm-email", teamMemberEmailRoutes); // ✅ Team Member email routes
app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
