import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function createDefaultUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Check if user exists
        const existingUser = await User.findOne({ email: 'dhaanushk1110@gmail.com' });
        
        if (existingUser) {
            console.log('Default user already exists');
            return;
        }

        // Create default user
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = await User.create({
            name: 'Dhaanush K',
            email: 'dhaanushk1110@gmail.com',
            password: hashedPassword,
            role: 'project_manager'
        });

        console.log('Default user created:', user);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

createDefaultUser();