import express from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get current user's details
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;