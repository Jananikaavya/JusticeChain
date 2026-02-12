import dotenv from 'dotenv';
dotenv.config();

// Optional safety checks
if (!process.env.MONGODB_URI) {
  console.warn("⚠️ MONGODB_URI missing in .env");
}

if (!process.env.PINATA_API_KEY) {
  console.warn("⚠️ PINATA_API_KEY missing in .env");
}

if (!process.env.EMAIL_USER) {
  console.warn("⚠️ EMAIL_USER missing in .env");
}
