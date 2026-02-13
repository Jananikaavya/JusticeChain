import dotenv from 'dotenv';

dotenv.config();

const testEmailJS = async () => {
  try {
    console.log('Testing EmailJS REST API Configuration...\n');
    console.log('Service ID:', process.env.EMAILJS_SERVICE_ID);
    console.log('Template ID:', process.env.EMAILJS_TEMPLATE_ID);
    console.log('Access Token:', process.env.EMAILJS_ACCESS_TOKEN);

    const templateParams = {
      to_email: process.env.EMAILJS_TEST_EMAIL || 'jananikaavya1104@gmail.com',
      user_name: 'Test User',
      role_id: 'POLI_1707604800000_5432',
      user_role: 'POLICE',
      login_url: 'http://localhost:5173/login'
    };

    console.log('\nSending test email...\n');
    
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_ACCESS_TOKEN,
        template_params: templateParams,
      }),
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      throw new Error(`EmailJS Error: ${response.status} - ${responseText}`);
    }

    console.log('✅ Email sent successfully!');
    console.log('Response:', responseText);

  } catch (error) {
    console.error('❌ EmailJS Error:');
    console.error('Message:', error.message);
  }

  process.exit(0);
};

testEmailJS();
