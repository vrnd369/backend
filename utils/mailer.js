const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS.replace(/\s/g, '') // Remove any spaces from password
  },
  debug: true, // Enable debug output
  logger: true // Log to console
});

// Verify transporter configuration with detailed error handling
const verifyTransporter = async () => {
  try {
    // Check if environment variables are set
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('❌ Email configuration error: EMAIL_USER or EMAIL_PASS environment variables are missing');
      console.log('📧 Please check your .env file and ensure both EMAIL_USER and EMAIL_PASS are set');
      return false;
    }

    console.log('🔍 Verifying email configuration...');
    console.log(`📧 Email User: ${process.env.EMAIL_USER}`);
    console.log(`🔑 Password Length: ${process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0} characters`);
    console.log(`🔑 Password (first 4 chars): ${process.env.EMAIL_PASS ? process.env.EMAIL_PASS.substring(0, 4) + '****' : 'Not set'}`);
    
    await transporter.verify();
    console.log('✅ Email server is ready to send messages');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    
    // Provide specific guidance based on error type
    if (error.message.includes('535-5.7.8') || error.message.includes('Invalid login')) {
      console.log('\n🔧 Gmail Authentication Fix Steps:');
      console.log('1. Go to your Google Account settings');
      console.log('2. Enable 2-Factor Authentication');
      console.log('3. Generate an App Password:');
      console.log('   - Go to Security > 2-Step Verification > App passwords');
      console.log('   - Select "Mail" and "Other (Custom name)"');
      console.log('   - Use the generated 16-character password as EMAIL_PASS');
      console.log('4. Update your .env file with the app password');
      console.log('5. Restart your server');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('\n🌐 Network Issue: Check your internet connection');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🚫 Connection Refused: Check if port 587 is blocked by firewall');
    }
    
    return false;
  }
};

// Initialize email verification
verifyTransporter();

// Generic sendMail function with enhanced error handling
const sendMail = async (mailOptions) => {
  try {
    // Verify email is configured before sending
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email configuration missing. Please check EMAIL_USER and EMAIL_PASS in .env file');
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    
    // Provide user-friendly error messages
    if (error.message.includes('535-5.7.8')) {
      throw new Error('Gmail authentication failed. Please check your app password in .env file');
    } else if (error.message.includes('Invalid login')) {
      throw new Error('Invalid email credentials. Please verify EMAIL_USER and EMAIL_PASS');
    } else {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
};

module.exports = sendMail;
