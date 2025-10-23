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

async function createTestUsers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const testUsers = [
            {
                name: 'Dhaanush K',
                email: 'dhaanushk1110@gmail.com',
                password: 'password123',
                role: 'project_manager'
            },
            {
                name: 'Team Lead User',
                email: 'teamlead@example.com',
                password: 'password123',
                role: 'team_lead'
            },
            {
                name: 'Team Member User',
                email: 'member@example.com',
                password: 'password123',
                role: 'team_member'
            }
        ];

        for (const userData of testUsers) {
            const existingUser = await User.findOne({ email: userData.email });
            
            if (existingUser) {
                console.log(`User ${userData.email} already exists`);
                continue;
            }

            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const user = await User.create({
                name: userData.name,
                email: userData.email,
                password: hashedPassword,
                role: userData.role
            });

            console.log(`Created user: ${user.email} (${user.role})`);
        }

        console.log('\n=== Test Credentials ===');
        console.log('Project Manager: dhaanushk1110@gmail.com / password123');
        console.log('Team Lead: teamlead@example.com / password123');
        console.log('Team Member: member@example.com / password123');
        console.log('========================');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

createTestUsers();