import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';

dotenv.config();

async function createUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const userData = {
      name: 'Dhaanush K',
      email: 'dhaanushk1110@gmail.com',
      password: await bcrypt.hash('Dhaanush_1110', 10), // Using the password from your .env
      role: 'project_manager' // Since this is your project, setting as project_manager
    };

    const user = await User.create(userData);
    console.log('\nUser created successfully:', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    if (error.code === 11000) {
      console.error('Error: Email already exists');
    } else {
      console.error('Error:', error);
    }
  } finally {
    await mongoose.disconnect();
  }
}

createUser();