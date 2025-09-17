import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const user = await User.findOne({ email: 'dhaanushk1110@gmail.com' });
    if (user) {
      console.log('User found:', {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        // Don't log the hashed password for security
        passwordHash: user.password ? user.password.substring(0, 10) + '...' : 'no password'
      });
    } else {
      console.log('No user found with that email');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUser();