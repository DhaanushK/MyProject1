import jwt from "jsonwebtoken";

import User from '../models/User.js';

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    console.log('No authorization header found');
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  try {
    console.log('Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verification successful. Decoded data:', decoded);

    // Always fetch fresh user data from database
    try {
      const user = await User.findById(decoded.id).select('email role name');
      if (!user) {
        console.error('User not found in database:', decoded.id);
        return res.status(404).json({ message: "User not found" });
      }

      // Combine token data with fresh database data
      req.user = {
        ...decoded,
        email: user.email, // Prioritize database email
        role: user.role,   // Use current role from database
        name: user.name    // Include user's name
      };

      console.log('Final user data in request:', req.user);
      next();
    } catch (dbError) {
      console.error('Database error while fetching user:', dbError);
      return res.status(500).json({ message: "Error fetching user data" });
    }
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Role-based access check
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};
