import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";  // ✅ import
import metricsRoutes from "./routes/metricsRoutes.js";
dotenv.config();
connectDB();

const app = express();

// CORS Configuration
app.use(cors({
  origin: 'http://localhost:5173',  // Match your Vite dev server exactly
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

app.use("/api/auth", authRoutes);  // ✅ mount route
app.use("/api/metrics", metricsRoutes);
app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
