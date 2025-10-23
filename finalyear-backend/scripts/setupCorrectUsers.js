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

async function setupCorrectUsers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing users (remove duplicates)
        await User.deleteMany({});
        console.log('Cleared existing users');

        const correctUsers = [
            // Project Manager
            {
                name: 'Dhaanush K',
                email: 'dhaanushk1110@gmail.com',
                password: 'Dhaanush_1110',
                role: 'project_manager'
            },
            // Team Leaders
            {
                name: 'Kanishkka',
                email: 'kanishkka0208@gmail.com',
                password: 'System.out.println("Hey Kanishkka");',
                role: 'team_lead'
            },
            {
                name: 'Praveen',
                email: 'japraveen1212@gmail.com',
                password: 'System.out.println("Hey Praveen");',
                role: 'team_lead'
            },
            // Team Members
            {
                name: 'Winnish',
                email: 'winnish0703@gmail.com',
                password: 'System.out.println("Hey Winnish");',
                role: 'team_member'
            },
            {
                name: 'Reddy',
                email: 'reddyvuppu3@gmail.com',
                password: 'System.out.println("Hey Reddy");',
                role: 'team_member'
            },
            {
                name: 'Kiran Kumar',
                email: 'kkumar05@gmail.com',
                password: 'System.out.println("Hey Kiran");',
                role: 'team_member'
            },
            {
                name: 'Sam',
                email: 'jsam01@gmail.com',
                password: 'System.out.println("Hey Sam");',
                role: 'team_member'
            }
        ];

        console.log('\n=== Creating Correct Users ===');
        
        for (const userData of correctUsers) {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const user = await User.create({
                name: userData.name,
                email: userData.email,
                password: hashedPassword,
                role: userData.role
            });

            console.log(`✅ Created: ${user.name} (${user.email}) - ${user.role}`);
        }

        console.log('\n🎉 All users created successfully!');
        console.log('\n=== Login Credentials ===');
        console.log('Project Manager:');
        console.log('  📧 dhaanushk1110@gmail.com');
        console.log('  🔑 Dhaanush_1110');
        console.log('\nTeam Leaders:');
        console.log('  📧 kanishkka0208@gmail.com');
        console.log('  🔑 System.out.println("Hey Kanishkka");');
        console.log('  📧 japraveen1212@gmail.com');
        console.log('  🔑 System.out.println("Hey Praveen");');
        console.log('\nTeam Members:');
        console.log('  📧 winnish0703@gmail.com');
        console.log('  🔑 System.out.println("Hey Winnish");');
        console.log('  📧 reddyvuppu3@gmail.com');
        console.log('  🔑 System.out.println("Hey Reddy");');
        console.log('  📧 kkumar05@gmail.com');
        console.log('  🔑 System.out.println("Hey Kiran");');
        console.log('  📧 jsam01@gmail.com');
        console.log('  🔑 System.out.println("Hey Sam");');
        console.log('========================');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

setupCorrectUsers();