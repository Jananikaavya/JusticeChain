# Justice Chain Backend Setup Guide

## Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas cloud)
- Gmail account (for email functionality)

## Installation

1. **Navigate to backend directory:**
```bash
cd backend
npm install
```

2. **Create `.env` file** (or update the existing one):
```env
MONGODB_URI=mongodb://localhost:27017/justice-chain
JWT_SECRET=justice-chain-secret-key-2026
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-digit-app-password
PORT=5000
NODE_ENV=development
```

### Email Setup (Gmail)
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account → Security → App passwords
   - Select "Mail" and "Windows Computer"
   - Copy the 16-digit password
   - Paste it as `EMAIL_PASS` in `.env`

### MongoDB Setup
Option 1: Local MongoDB
```bash
# Install MongoDB Community Edition
# Start MongoDB service
mongod
```

Option 2: MongoDB Atlas (Cloud)
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/justice-chain
```

## Running the Backend

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Backend will run on `http://localhost:5000`

## API Endpoints

### Register User
**POST** `/api/auth/register`
```json
{
  "username": "john_police",
  "email": "john.police@example.com",
  "password": "password123",
  "role": "POLICE"
}
```

Response:
```json
{
  "message": "Registration successful! Check your email for Role ID",
  "user": {
    "id": "...",
    "username": "john_police",
    "email": "john.police@example.com",
    "role": "POLICE",
    "roleId": "POLI_1707604800000_5432"
  }
}
```

### Login User
**POST** `/api/auth/login`
```json
{
  "username": "john_police",
  "password": "password123",
  "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

Response:
```json
{
  "message": "Login successful",
  "token": "jwt-token-here",
  "user": {
    "id": "...",
    "username": "john_police",
    "email": "john.police@example.com",
    "role": "POLICE",
    "roleId": "POLI_1707604800000_5432",
    "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }
}
```

### Get User by ID
**GET** `/api/auth/user/:id`

### Get All Users (Admin)
**GET** `/api/auth/users`

## Features

✅ User registration with auto-generated Role ID
✅ Role ID sent via email
✅ Secure password hashing (bcryptjs)
✅ JWT authentication
✅ Wallet address management
✅ Role-based access (ADMIN, POLICE, FORENSIC, JUDGE)
✅ Email notifications

## Frontend Integration

The React frontend at `http://localhost:5173` automatically connects to the backend at `http://localhost:5000`

Register API endpoint: `POST http://localhost:5000/api/auth/register`
Login API endpoint: `POST http://localhost:5000/api/auth/login`

## Database Schema

### User Model
- username (String, unique, required)
- email (String, unique, required)
- password (String, hashed, required)
- role (Enum: ADMIN, POLICE, FORENSIC, JUDGE, required)
- roleId (String, unique, auto-generated)
- wallet (String, optional)
- createdAt (Date, auto)

## Troubleshooting

**Email not sending?**
- Check `.env` file for correct EMAIL_USER and EMAIL_PASS
- Verify Gmail App Password is correct
- Allow less secure app access if needed

**MongoDB connection error?**
- Ensure MongoDB is running
- Check MONGODB_URI in `.env`
- For Atlas, whitelist your IP address

**CORS errors?**
- Backend CORS is configured to allow requests from `http://localhost:5173`
- Update origin in server.js if frontend URL changes

## Production Deployment

1. Update environment variables for production
2. Use a proper database service (MongoDB Atlas)
3. Configure email service properly
4. Set secure JWT_SECRET
5. Deploy to hosting service (Heroku, AWS, etc.)

