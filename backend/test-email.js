import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const testEmail = async () => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Testing email configuration...');
    console.log('Email User:', process.env.EMAIL_USER);
    console.log('Email Pass Length:', process.env.EMAIL_PASS?.length);
    
    await transporter.verify();
    console.log('✅ Email service verified successfully!');
    
    // Try sending a test email
    await transporter.sendMail({
      from: `"Justice Chain Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: 'Justice Chain - Test Email',
      html: `<h2>This is a test email from Justice Chain</h2><p>If you received this, email configuration is working!</p>`
    });
    
    console.log('✅ Test email sent successfully!');
    
  } catch (error) {
    console.error('❌ Email Error:', error.message);
    console.error('Error Code:', error.code);
    if (error.response) {
      console.error('SMTP Response:', error.response);
    }
  }
  
  process.exit(0);
};

testEmail();
