# MongoDB Atlas Database User Setup Guide

## What You've Done ✅
- Created MongoDB Atlas account
- Created a cluster
- Whitelisted your IP address
- Got the connection URI with credentials

## Current Setup
Your `.env` file already has:
```
MONGODB_URI=mongodb+srv://jananikaavya1104_db_user:ZiIbOwWc3snCQCu0@justicechain.ukfmnmz.mongodb.net/?appName=Justicechain
```

This includes:
- **Username**: `jananikaavya1104_db_user`
- **Password**: `ZiIbOwWc3snCQCu0`
- **Cluster**: `justicechain.ukfmnmz.mongodb.net`
- **Database**: `justice-chain` (will be created automatically)

## Step-by-Step Verification

### 1. Verify Database User in MongoDB Atlas

1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Select your project and cluster
3. Click **"Database Access"** in the left sidebar
4. You should see your database user:
   - Username: `jananikaavya1104_db_user`
   - Status: **Active** (green)
   - Role: Database admin or similar

### 2. Verify IP Whitelist

1. Still in MongoDB Atlas
2. Click **"Network Access"** in the left sidebar
3. You should see your IP address listed as **Allowed**

### 3. Test the Connection

Run the database initialization script to verify everything works:

```bash
cd backend
npm install
npm run init-db
```

This will:
- Connect to MongoDB Atlas
- Verify credentials
- Show database information
- Confirm collections setup

### Expected Output:
```
🔄 Connecting to MongoDB Atlas...
✅ Connected to MongoDB Atlas successfully!

📊 Database Information:
   Database Name: justice-chain
   Host: justicechain.ukfmnmz.mongodb.net

📦 Collections (0):
   No collections yet. They will be created when you first register a user.

✨ Database initialization successful!
   The following collections will be auto-created on first use:
   - users (for storing user data)
```

## If Connection Fails

### Error: Authentication Failed
```
AuthenticationError: authentication failed
```
**Solution:**
1. Verify username and password in `.env`
2. Make sure you're using the correct password (not your MongoDB Atlas account password)
3. Check if special characters in password are properly encoded

### Error: IP Not Whitelisted
```
MongooseServerSelectionError: connect ECONNREFUSED
```
**Solution:**
1. Go to MongoDB Atlas → Network Access
2. Add your current IP address (you can use `0.0.0.0/0` for development)
3. Wait 1-2 minutes for changes to propagate

### Error: Database Not Found
**Solution:**
- The database will be automatically created when you first register a user
- You don't need to manually create it

## Database Structure

Once you start using the application:

### Database: `justice-chain`

**Collection: users**
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
   role: String (ADMIN, POLICE, FORENSIC, JUDGE),
  roleId: String (unique, auto-generated),
  wallet: String (optional),
  createdAt: Date
}
```

## Viewing Data in MongoDB Atlas

1. Go to MongoDB Atlas → Collections
2. Select cluster → database `justice-chain` → collection `users`
3. You'll see all registered users with their data

## Security Best Practices

✅ **What you've done right:**
- Created a separate database user (not using admin account)
- Set strong password
- Whitelisted specific IP

⚠️ **For Production:**
1. Use more complex password (25+ characters)
2. Whitelist only necessary IPs (not `0.0.0.0/0`)
3. Use environment variables (already doing this)
4. Enable VPC peering for better security
5. Enable database encryption
6. Regular backups enabled

## Next Steps

1. **Verify connection:**
   ```bash
   npm run init-db
   ```

2. **Start backend server:**
   ```bash
   npm run dev
   ```

3. **Test with frontend:**
   - Open http://localhost:5173
   - Register a new user
   - Check MongoDB Atlas Collections to verify user was saved

## Useful MongoDB Atlas Features

- **Monitoring**: Check cluster performance in "Metrics"
- **Backups**: Automatic backups enabled by default
- **Alerts**: Set up alerts for cluster issues
- **Logs**: View real-time logs in "Logs"

## Questions?

If you encounter any issues:
1. Check `.env` file for correct credentials
2. Verify IP whitelist
3. Check MongoDB Atlas logs for errors
4. Restart backend server after making changes

