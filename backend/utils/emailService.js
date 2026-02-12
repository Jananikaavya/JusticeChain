export const sendRoleIdEmail = async (email, username, roleId, role) => {
  try {
    // Check if EmailJS is configured
    if (!process.env.EMAILJS_SERVICE_ID || !process.env.EMAILJS_TEMPLATE_ID || !process.env.EMAILJS_PUBLIC_KEY) {
      console.log(`\n📧 EmailJS Service Note:`);
      console.log(`   Role ID for ${username}: ${roleId}`);
      console.log(`   Email not sent (service not configured)\n`);
      return true;
    }

    const templateParams = {
      to_email: email,
      user_name: username,
      role_id: roleId,
      user_role: role,
      login_url: 'http://localhost:5173/login'
    };

    // Use EmailJS REST API with Public and Private Keys for backend
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        accessToken: process.env.EMAILJS_PRIVATE_KEY,
        template_params: templateParams,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`EmailJS Error: ${response.status} - ${errorData}`);
    }

    console.log(`✅ Email sent successfully to ${email}`);
    return true;

  } catch (error) {
    console.error(`\n⚠️ EmailJS Service Error:`);
    console.error(`   Error: ${error.message}`);
    
    console.log(`\n📧 Role ID for ${username}: ${roleId}`);
    console.log(`   (Email not sent, but registration completed)\n`);
    
    // Don't throw error - allow registration to continue even if email fails
    return true;
  }
};

export const testEmailConfig = async () => {
  try {
    if (!process.env.EMAILJS_SERVICE_ID || !process.env.EMAILJS_TEMPLATE_ID || !process.env.EMAILJS_PUBLIC_KEY) {
      console.log('⚠️ EmailJS service not configured in .env');
      return false;
    }

    console.log('✅ EmailJS service is configured');
    return true;
  } catch (error) {
    console.warn(`⚠️ EmailJS configuration issue: ${error.message}`);
    console.warn(`   Users will still be able to register, but won't receive emails`);
    return false;
  }
};
