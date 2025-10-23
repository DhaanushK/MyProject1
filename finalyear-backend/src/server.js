import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import compression from "compression";
import mongoose from "mongoose";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import metricsRoutes from "./routes/metricsRoutes.js";
import logsRoutes from "./routes/logsRoutes.js";
import sheetRoutes from "./routes/sheetRoutes.js";
import projectManagerEmailRoutes from "./routes/projectManagerEmailRoutes.js";
import teamLeaderEmailRoutes from "./routes/teamLeaderEmailRoutes.js";
import teamMemberEmailRoutes from "./routes/teamMemberEmailRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import googleAuthRoutes from "./routes/googleAuthRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

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

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'https://my-project1-wine.vercel.app'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Type']
}));

// Add security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// Add compression middleware
app.use(compression());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`, {
    body: req.body,
    query: req.query,
    params: req.params
  });
  next();
});

// Parse JSON payloads
app.use(express.json({
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Parse URL-encoded bodies
app.use(express.urlencoded({ 
  extended: true,
  limit: '50mb'
}));

// Mount all routes
app.use("/api/auth", authRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/sheets", sheetRoutes);
app.use("/api/pm-email", projectManagerEmailRoutes);
app.use("/api/tl-email", teamLeaderEmailRoutes);
app.use("/api/tm-email", teamMemberEmailRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", googleAuthRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  
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

const PORT = process.env.PORT || 5001;
let server;

// Function to gracefully shutdown the server
const shutdownGracefully = () => {
  console.log('\nInitiating graceful shutdown...');
  if (server) {
    server.close(() => {
      console.log('Server closed');
      if (mongoose.connection.readyState === 1) {
        mongoose.connection.close(false, () => {
          console.log('Database connection closed');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });

    // Force shutdown after 10 seconds if graceful shutdown fails
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  }
};

// Start the server with error handling
const startServer = () => {
  try {
    server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`⚠️ Port ${PORT} is already in use`);
        console.log('Attempting to find another port...');
        const newPort = PORT + 1;
        console.log(`Trying port ${newPort}...`);
        server = app.listen(newPort, () => {
          console.log(`🚀 Server running on alternate port ${newPort}`);
        });
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
