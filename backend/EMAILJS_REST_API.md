# EmailJS Backend Setup - REST API Method

EmailJS restricts the Node.js SDK to browser-only. For backend, we must use the REST API with an **Access Token**.

## Steps to Fix Email Configuration:

### 1. Get Your Access Token
- Go to https://dashboard.emailjs.com/
- Click on **Account** menu (top right)
- Go to **API Keys** tab
- Copy your **Access Token** (this is what we need!)

### 2. Update .env File
Replace your .env with:
```
EMAILJS_SERVICE_ID=service_37m8psq
EMAILJS_TEMPLATE_ID=template_kwkcpde
EMAILJS_ACCESS_TOKEN=your_access_token_here
```

### 3. Example Access Token Location
In EmailJS Dashboard:
```
Account > API Keys > Access Token (long string starting with...)
```

## How It Works
- The REST API at `https://api.emailjs.com/api/v1.0/email/send` is used
- Access Token authenticates backend requests
- No browser restriction with this method

## Testing
After updating .env with your Access Token, run:
```bash
node test-emailjs.js
```

You should see: ✅ Email sent successfully!

## Troubleshooting
- **403 Error**: Wrong or missing Access Token
- **Invalid Template**: Check EMAILJS_TEMPLATE_ID matches your EmailJS dashboard
- **Invalid Service**: Check EMAILJS_SERVICE_ID matches your EmailJS dashboard
