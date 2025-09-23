import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

// CORS Configuration
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json());

// Simple test route to check if server is working
app.get("/", (req, res) => {
  res.json({ message: "Backend server is running!", timestamp: new Date().toISOString() });
});

// Test route for email connection (without auth for testing)
app.get("/api/pm-email/test-connection", (req, res) => {
  res.json({ 
    message: "Test route is working",
    status: "connected",
    service: "test",
    timestamp: new Date().toISOString()
  });
});

// Test route for team members (without auth for testing)
app.get("/api/pm-email/team-members", (req, res) => {
  res.json({
    teamMembers: [
      { name: "Test User", email: "test@example.com", role: "team_member" }
    ],
    totalMembers: 1
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📡 Test the routes:`);
  console.log(`   - http://localhost:${PORT}/`);
  console.log(`   - http://localhost:${PORT}/api/pm-email/test-connection`);
  console.log(`   - http://localhost:${PORT}/api/pm-email/team-members`);
});