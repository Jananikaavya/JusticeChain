import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const initializeDatabase = async () => {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('✅ Connected to MongoDB Atlas successfully!');
    
    // Get database info
    const db = mongoose.connection.db;
    const adminDb = db.admin();
    const serverStatus = await adminDb.serverStatus();
    
    console.log('\n📊 Database Information:');
    console.log(`   Database Name: ${db.name}`);
    console.log(`   Host: ${serverStatus.host}`);
    
    // List existing collections
    const collections = await db.listCollections().toArray();
    console.log(`\n📦 Collections (${collections.length}):`);
    
    if (collections.length === 0) {
      console.log('   No collections yet. They will be created when you first register a user.');
    } else {
      collections.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col.name}`);
      });
    }
    
    console.log('\n✨ Database initialization successful!');
    console.log('   The following collections will be auto-created on first use:');
    console.log('   - users (for storing user data)');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('   1. Check if MONGODB_URI is correct in .env');
    console.error('   2. Verify database user credentials');
    console.error('   3. Check if your IP is whitelisted in MongoDB Atlas');
    console.error('   4. Ensure the cluster is running');
    process.exit(1);
  }
};

initializeDatabase();
