# MongoDB Atlas Database User Verification & Creation

## Current Issue
Authentication failed when connecting. This means either:
1. The database user credentials are incorrect
2. The database user doesn't exist
3. The password contains special characters that need URL encoding

## How to Fix This

### Step 1: Verify Database User Exists

1. **Open MongoDB Atlas**: https://cloud.mongodb.com
2. **Login** with your MongoDB account
3. **Select Your Organization** and **Project**
4. **Select Your Cluster** (justicechain)
5. **Click "Database Access"** in left sidebar
6. **Look for user**: `jananikaavya1104_db_user`

**If user exists:**
- Status should be **ACTIVE** (green checkmark)
- Role should be **Database Admin** or similar
- Note the **database** it has access to

**If user does NOT exist:**
- You need to create one (see Step 2 below)

### Step 2: Create/Reset Database User (if needed)

1. In **Database Access**, click **"+ Add New Database User"**
2. Fill in the form:
   - **Authentication Method**: Password
   - **Username**: `jananikaavya1104_db_user`
   - **Password**: Create a strong password (25+ characters)
     - Mix of uppercase, lowercase, numbers, special characters
     - Example: `Justice@2026Chain#Secure1104`
   - **Built-in Role**: `Database Admin`
   - **Specific Privileges**: Not needed for development
3. **Click "Add User"**
4. **Copy the password** immediately (you won't see it again)

### Step 3: Update .env with Correct Credentials

If you created/reset the user, update your `.env`:

```env
MONGODB_URI=mongodb+srv://jananikaavya1104_db_user:YOUR_PASSWORD@justicechain.ukfmnmz.mongodb.net/justice-chain?retryWrites=true&w=majority
```

Replace `YOUR_PASSWORD` with the password you just created.

**If password contains special characters:**

Encode special characters using [URL Encoder](https://www.urlencoder.org/):
- `@` → `%40`
- `:` → `%3A`
- `#` → `%23`
- `!` → `%21`

Example:
- Original password: `Justice@2026#Pass`
- Encoded: `Justice%402026%23Pass`
- In URI: `mongodb+srv://jananikaavya1104_db_user:Justice%402026%23Pass@justicechain.ukfmnmz.mongodb.net/...`

### Step 4: Verify Network Access (IP Whitelist)

1. Still in MongoDB Atlas
2. Click **"Network Access"** in left sidebar
3. You should see your IP listed

**If your IP is NOT listed:**
1. Click **"+ Add IP Address"**
2. Choose one of:
   - **Add Current IP Address** (recomm for development)
   - **Allow Access from Anywhere** (0.0.0.0/0) - only for development
3. Click **"Confirm"**
4. **Wait 1-2 minutes** for the change to propagate

### Step 5: Test Connection

After updating .env and verifying IP, run:

```bash
cd backend
npm run init-db
```

### Expected Success Output:

```
🔄 Connecting to MongoDB Atlas...
✅ Connected to MongoDB Atlas successfully!

📊 Database Information:
   Database Name: justice-chain
   Host: justicechain.ukfmnmz.mongodb.net

📦 Collections (0):
   No collections yet. They will be created when you first register a user.

✨ Database initialization successful!
```

## Still Getting "Authentication failed"?

**Try these steps:**

1. **Double-check credentials in .env**
   ```bash
   cat backend/.env
   ```
   Make sure the username and password match exactly

2. **Get Fresh Connection String from MongoDB**
   - Go to Cluster → Connect → Drivers → Node.js
   - Copy the connection string again
   - Ensure it includes your database name: `/?appName=Justicechain`

3. **Reset User Password**
   - In Database Access, find the user
   - Click the menu (three dots)
   - Select "Edit Password"
   - Create a new simple password (no special chars for testing)
   - Update .env

4. **Check Cluster Status**
   - Go to Clusters
   - Make sure cluster status is "RUNNING" (green)
   - If it says "PAUSED", click Resume

5. **Wait for Network Changes**
   - If you just added IP, wait 2 minutes
   - Then try again

## Once Connection Works ✅

1. **Start backend server:**
   ```bash
   npm run dev
   ```

2. **Start frontend (in another terminal):**
   ```bash
   cd ../
   npm run dev
   ```

3. **Test registration:**
   - Go to http://localhost:5173
   - Click Register
   - Fill in form and register
   - Check email for Role ID
   - Login with username, password, and MetaMask

4. **Verify data in MongoDB:**
   - Go to MongoDB Atlas
   - Cluster → Collections
   - Select `justice-chain` database → `users` collection
   - You should see the registered user

## MongoDB Atlas Features After Setup

- **Monitor** cluster performance in Metrics
- **Automatic backups** enabled by default
- **Real-time monitoring** of connections and queries
- **View logs** in "Logs" section

## Need Help?

Check these files in the backend folder:
- `MONGODB_SETUP.md` - Complete setup guide
- `README.md` - Backend API documentation
- `.env.example` - Example environment variables

