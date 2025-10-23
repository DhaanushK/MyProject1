import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role });
    res.status(201).json({ message: "User registered", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  console.log('Login attempt:', { email: req.body.email });
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('Missing credentials');
      return res.status(400).json({ message: "Email and password are required" });
    }

    console.log('Finding user in database...');
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log('User found, verifying password...');
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log('Invalid password for user:', email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log('Password verified, generating token...');
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set!');
      return res.status(500).json({ message: "Server configuration error" });
    }

    // Validate user object
    if (!user || !user._id) {
      console.error('Invalid user object:', user);
      return res.status(500).json({ message: "User data corrupted" });
    }

    // Convert user document to plain object and validate required fields
    const userObj = user.toObject();
    const requiredFields = ['email', 'role', 'name'];
    const missingFields = requiredFields.filter(field => !userObj[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing required user fields:', {
        missing: missingFields,
        user: userObj
      });
      return res.status(500).json({ 
        message: `Incomplete user data: missing ${missingFields.join(', ')}` 
      });
    }

    // Create token payload with all necessary user data
    const tokenPayload = {
      id: user._id.toString(),
      email: userObj.email,    // Explicitly include email
      role: userObj.role,      // Explicitly include role
      name: userObj.name       // Explicitly include name
    };

    console.log('Creating token with payload:', tokenPayload);

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log('Login successful for user:', email);
    console.log('Token created with payload:', tokenPayload);
    
    res.json({ 
      token, 
      role: user.role, 
      email: user.email, 
      username: user.name,
      id: user._id.toString()
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      message: "An error occurred during login",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get current user details
router.get("/me", authMiddleware, async (req, res) => {
  try {
    // Log the decoded token data
    console.log('Decoded token data:', req.user);

    // Fetch fresh user data from database
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      console.log('User not found in database');
      return res.status(404).json({ message: "User not found" });
    }

    // Get user data from the token if database fetch fails
    const fallbackEmail = req.user.email;

    const userData = {
      id: user._id,
      role: user.role,
      email: user.email || fallbackEmail, // Use email from token if not in DB
      name: user.name
    };

    console.log('User data to send:', userData);

    // Validate email presence
    if (!userData.email) {
      console.error('No email found in user data or token:', {
        userDoc: user.toObject(),
        tokenData: req.user
      });
      return res.status(500).json({ message: "User email not found" });
    }

    console.log('Sending complete user data:', userData);
    res.json(userData);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
