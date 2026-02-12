import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const dropEmailIndex = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Drop the email unique index
    try {
      await db.collection('users').dropIndex('email_1');
      console.log('✅ Dropped email_1 unique index');
    } catch (err) {
      if (err.message.includes('index not found')) {
        console.log('ℹ️ Email index does not exist');
      } else {
        throw err;
      }
    }

    await mongoose.connection.close();
    console.log('\n✅ Done! Email can now be reused for multiple registrations');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

dropEmailIndex();
