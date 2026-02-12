# Gmail Setup for Email Notifications

## Current Status
Email is currently **disabled** for testing. Registration works without it - users see their Role ID in an alert.

## To Enable Gmail Email Service

### Step 1: Update Gmail Security Settings

1. **Go to your Gmail account**: https://myaccount.google.com
2. **Click "Security"** in the left menu
3. **Enable 2-Step Verification** (if not already enabled):
   - Click "2-Step Verification"
   - Follow Google's setup instructions
   - Verify your phone number
   - Save recovery codes

### Step 2: Generate App Password

1. **Go back to Security settings**
2. **Look for "App passwords"** (this only appears if 2FA is enabled)
3. **Click "App passwords"**
4. **Select:**
   - Select app: **Mail**
   - Select device: **Windows Computer**
5. **Click "Generate"**
6. **Copy the 16-digit password** (shown in yellow box)
7. **Do NOT close this window yet** - you'll need to copy it

### Step 3: Update .env File

Replace the PASSWORD in backend/.env:

```env
EMAIL_USER=jananikaavya1104@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
```

The app password format is usually 4 groups of 4 characters (with spaces).

In your .env, remove the spaces:
```env
EMAIL_PASS=xxxxxxxxxxxxxxxx
```

### Step 4: Test Email Configuration

Run the initialization script:
```bash
cd backend
npm run init-db
```

If successful, you'll see:
```
✅ Email configuration is valid
```

### Step 5: Restart Backend

Stop the backend server (Ctrl+C) and restart:
```bash
npm run dev
```

You should see:
```
✅ Email configuration is valid
```

### Step 6: Test with Registration

1. Go to http://localhost:5173
2. Register a new user with your test email
3. Check your email inbox for the Role ID email

## Common Issues

### "Username and Password not accepted"
- **Check 1**: Make sure you copied the **App Password**, not your regular Gmail password
- **Check 2**: Verify 2FA is enabled on your Gmail account
- **Check 3**: Make sure you're using the 16-digit code without spaces in .env

### "Less secure app access"
- Gmail no longer supports "Less Secure App Access"
- You MUST use App Passwords with 2FA enabled

### Email Arrives in Spam
- Check your spam/junk folder
- Mark the email as "Not Spam"
- Add noreply@justice-chain.com to contacts

### Still Not Working?

Try this test:
1. Go to [Google's App Passwords page](https://myaccount.google.com/apppasswords)
2. Generate a NEW app password
3. Copy it exactly (including any spaces)
4. Update .env:
   ```env
   EMAIL_PASS=the new password you just copied
   ```
5. Restart backend and test again

## For Production

Change the email service to use a professional email service:

### Option 1: SendGrid
```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});
```

### Option 2: AWS SES
```javascript
const transporter = nodemailer.createSES({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY
});
```

### Option 3: Mailgun
```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.mailgun.org',
  port: 587,
  auth: {
    user: process.env.MAILGUN_USERNAME,
    pass: process.env.MAILGUN_PASSWORD
  }
});
```

## For Now - Development Mode

You can continue development without email:
- Users see their Role ID in the registration alert
- They can copy it from there
- All other functionality works normally

Email is a nice-to-have for production, not essential for development.

