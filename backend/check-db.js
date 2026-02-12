import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const checkDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const adminDb = db.admin();
    
    // Get server status
    const status = await adminDb.serverStatus();
    console.log('\n📊 Database Info:');
    console.log('   Database:', mongoose.connection.name);
    console.log('   Host:', status.host);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📁 Collections:');
    collections.forEach(col => console.log('   -', col.name));

    // Check users collection
    if (collections.some(c => c.name === 'users')) {
      const userCount = await db.collection('users').countDocuments();
      console.log(`\n👥 Users Count: ${userCount}`);
      
      if (userCount > 0) {
        const users = await db.collection('users').find({}).toArray();
        console.log('\n📋 Registered Users:');
        users.forEach(user => {
          console.log(`   - ${user.username} (${user.role}) - Email: ${user.email} - Role ID: ${user.roleId}`);
        });
      } else {
        console.log('\n⚠️ No users found in database');
      }
    } else {
      console.log('\n⚠️ Users collection does not exist yet');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkDatabase();
