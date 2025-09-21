import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

// EMAIL MAPPING CONFIGURATION
// Update this object with your actual old and new email mappings
// NOTE: dhaanushk1110@gmail.com is kept unchanged as requested
const emailMapping = {
  // From your MongoDB Compass screenshot, actual new email addresses:
  // 'dhaanushk1110@gmail.com': 'dhaanushk1110@gmail.com', // KEEPING ORIGINAL - DO NOT CHANGE
  'kanishka.a0208@gmail.com': 'kanishkka0208@gmail.com', 
  'praveenj.jio@gmail.com': 'japraveen1212@gmail.com',
  'winnishej703@gmail.com': 'winnish0703@gmail.com',
  'reddyvuppu@gmail.com': 'reddyvuppu@gmail.com', // This one seems already correct
  'jsam01@gmail.com': 'jsam01@gmail.com', // This one seems already correct
  'kkumar05@gmail.com': 'kkumar05@gmail.com' // This one seems already correct
};

async function updateAllEmails() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔌 Connected to MongoDB');
    console.log('📧 Starting email updates...\n');

    let successCount = 0;
    let failureCount = 0;

    for (const [oldEmail, newEmail] of Object.entries(emailMapping)) {
      try {
        console.log(`🔄 Updating: ${oldEmail} → ${newEmail}`);
        
        // Check if old email exists
        const existingUser = await User.findOne({ email: oldEmail });
        if (!existingUser) {
          console.log(`   ⚠️  User with email ${oldEmail} not found`);
          failureCount++;
          continue;
        }

        // Check if new email already exists (to prevent duplicates)
        const duplicateCheck = await User.findOne({ email: newEmail });
        if (duplicateCheck && duplicateCheck._id.toString() !== existingUser._id.toString()) {
          console.log(`   ❌ New email ${newEmail} already exists for another user`);
          failureCount++;
          continue;
        }

        // Perform the update
        const result = await User.updateOne(
          { email: oldEmail },
          { email: newEmail }
        );

        if (result.modifiedCount === 1) {
          console.log(`   ✅ Successfully updated`);
          successCount++;
        } else {
          console.log(`   ⚠️  No changes made`);
          failureCount++;
        }
      } catch (error) {
        console.log(`   ❌ Error updating ${oldEmail}: ${error.message}`);
        failureCount++;
      }
      console.log('');
    }

    console.log('📊 SUMMARY:');
    console.log(`   ✅ Successful updates: ${successCount}`);
    console.log(`   ❌ Failed updates: ${failureCount}`);
    console.log(`   📧 Total attempted: ${Object.keys(emailMapping).length}`);

    // Display final state
    console.log('\n📋 CURRENT USERS IN DATABASE:');
    const allUsers = await User.find({}, { name: 1, email: 1, role: 1 }).sort({ name: 1 });
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
    });

  } catch (error) {
    console.error('❌ Database connection error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the update
console.log('🚀 EMAIL UPDATE SCRIPT');
console.log('=====================');
console.log('⚠️  IMPORTANT: This script will update user emails in your database');
console.log('📝 Please verify the email mappings above are correct before proceeding\n');

updateAllEmails();