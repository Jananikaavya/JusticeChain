# EmailJS Setup Guide

EmailJS allows you to send emails directly from your backend without managing SMTP credentials.

## Steps to Set Up EmailJS:

### 1. Create EmailJS Account
- Go to https://www.emailjs.com/
- Sign up for a free account
- Verify your email

### 2. Connect Gmail Service
- In Dashboard, go to **Email Services**
- Click **Add Service**
- Select **Gmail**
- Click **Connect Account**
- Sign in with your Gmail account (jananikaavya1104@gmail.com)
- Authorize EmailJS to access your Gmail
- Copy the **Service ID** and save it

### 3. Create Email Template
- Go to **Email Templates** in Dashboard
- Click **Create New Template**
- Configure template with these variables:
  - `{{to_email}}` - recipient email
  - `{{user_name}}` - username
  - `{{role_id}}` - the generated Role ID
  - `{{user_role}}` - user role (LAWYER, JUDGE, POLICE, ADMIN)
  - `{{login_url}}` - login page URL
  
Example template HTML:
```
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Welcome to Justice Chain!</h2>
  <p>Dear <strong>{{user_name}}</strong>,</p>
  <p>Your registration is successful. Here are your credentials:</p>
  
  <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p><strong>Username:</strong> {{user_name}}</p>
    <p><strong>Role:</strong> {{user_role}}</p>
    <p><strong>Your Role ID:</strong> {{role_id}}</p>
  </div>
  
  <p><a href="{{login_url}}">Login to Justice Chain</a></p>
</div>
```

- Copy the **Template ID** and save it

### 4. Get API Keys
- Go to **Account** > **API Keys**
- Copy your **Public Key**
- Copy your **Private Key** (for backend use)
- Save both keys

### 5. Update .env File
Update `backend/.env` with:
```
EMAILJS_PUBLIC_KEY=your_public_key_here
EMAILJS_PRIVATE_KEY=your_private_key_here
EMAILJS_SERVICE_ID=your_service_id_here
EMAILJS_TEMPLATE_ID=your_template_id_here
```

### 6. Test
Restart the backend server:
```bash
npm run dev
```

Register a new user - they should receive an email with their Role ID!

## Free Tier Limits
- EmailJS free tier: 200 emails/month
- Perfect for development and testing

## Troubleshooting
If emails aren't sending:
1. Check that all four env variables are filled correctly
2. Verify Template ID and Service ID are correct
3. Check EmailJS dashboard for error logs
4. Make sure Gmail service is connected in EmailJS dashboard
