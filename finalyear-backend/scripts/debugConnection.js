import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

async function debugConnection() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('\nConnected to MongoDB');
    console.log('Database URI:', process.env.MONGO_URI);
    
    // Get list of all databases
    const adminDb = mongoose.connection.db.admin();
    const dbInfo = await adminDb.listDatabases();
    console.log('\nAvailable databases:');
    dbInfo.databases.forEach(db => console.log(`- ${db.name}`));
    
    // Get current database name
    const currentDb = mongoose.connection.db.databaseName;
    console.log('\nCurrent database:', currentDb);
    
    // Get collections in current database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nCollections in current database:');
    collections.forEach(collection => console.log(`- ${collection.name}`));
    
    // Get users
    const users = await User.find({}, { password: 0 });
    console.log('\nUsers in collection:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    console.log('\nTotal users:', users.length);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugConnection();