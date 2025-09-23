import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

async function listAllUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const users = await User.find({}).select('name email role');
    
    console.log('\n📋 All Users in Database:');
    console.log('========================');
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    }
    
    console.log(`\nTotal users: ${users.length}`);
    
    // Show team members specifically
    const teamMembers = users.filter(user => user.role === 'team_member');
    const teamLeads = users.filter(user => user.role === 'team_lead');
    const projectManagers = users.filter(user => user.role === 'project_manager');
    
    console.log('\n📊 Users by Role:');
    console.log('=================');
    console.log(`Project Managers: ${projectManagers.length}`);
    console.log(`Team Leads: ${teamLeads.length}`);
    console.log(`Team Members: ${teamMembers.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

listAllUsers();