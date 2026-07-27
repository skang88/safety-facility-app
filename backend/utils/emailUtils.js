const nodemailer = require('nodemailer');

// Create transporter helper
const getTransporter = () => {
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT || 587;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  
  if (!host || !user || !pass) {
    console.warn('⚠️ SMTP settings are not fully configured in environment variables. Emails will be logged to the console instead.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(port, 10),
    secure: port == 465, // true for 465, false for other ports
    auth: {
      user,
      pass
    }
  });
};

const sendEmail = async (options) => {
  const transporter = getTransporter();
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Safety Facility App" <noreply@safetyfacility.com>',
    to: options.to,
    subject: options.subject,
    html: options.html
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`✉️ Email successfully sent to ${options.to}`);
    } catch (error) {
      console.error(`❌ Failed to send email to ${options.to}:`, error);
      throw error;
    }
  } else {
    console.log('\n=================== MOCK EMAIL SENT ===================');
    console.log(`To:      ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Body:\n${options.text || options.html.replace(/<[^>]*>/g, ' ').trim()}`);
    console.log('========================================================\n');
  }
};

/**
 * Send email verification link
 */
const sendVerificationEmail = async (email, emailToken) => {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  const verificationUrl = `${backendUrl}/api/auth/verify-email?token=${emailToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #1a73e8; text-align: center;">Welcome to Safety Facility App!</h2>
      <p>Thank you for registering. Please click the button below to verify your email address and activate your account:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="background-color: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Verify Email Address</a>
      </div>
      <p style="color: #5f6368; font-size: 12px; text-align: center;">This link will expire in 24 hours.</p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
      <p style="color: #9aa0a6; font-size: 11px;">If you didn't request this email, you can safely ignore it. If the button doesn't work, copy and paste this link in your browser: <br>${verificationUrl}</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: '[Safety Facility App] Email Verification',
    html,
    text: `Welcome to Safety Facility App! Please verify your email by opening: ${verificationUrl}`
  });
};

/**
 * Send password reset link
 */
const sendPasswordResetEmail = async (email, resetToken) => {
  // Normally the password reset page is in the frontend.
  // In the reference, it is exports.resetPassword which handles /api/auth/reset-password/:token as API.
  // So the link should direct either to frontend reset page (which then calls backend API)
  // or directly to frontend.
  // Let's configure FRONTEND_URL or default to localhost:8090.
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8090';
  const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #d93025; text-align: center;">Password Reset Request</h2>
      <p>You are receiving this email because you (or someone else) requested a password reset for your account.</p>
      <p>Please click the button below to choose a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #d93025; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p style="color: #5f6368; font-size: 12px; text-align: center;">This link is only valid for 10 minutes.</p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
      <p style="color: #9aa0a6; font-size: 11px;">If you didn't request a password reset, please ignore this email. If the button doesn't work, copy and paste this link in your browser: <br>${resetUrl}</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: '[Safety Facility App] Password Reset Request',
    html,
    text: `Please reset your password by opening: ${resetUrl}`
  });
};

/**
 * Send OTP Verification Email
 */
const sendOTPEmail = async (email, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #1a73e8; text-align: center;">Your Verification Code</h2>
      <p>To complete your login, please enter the following 6-digit verification code:</p>
      <div style="text-align: center; margin: 30px 0; background-color: #f1f3f4; padding: 20px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #202124;">
        ${otp}
      </div>
      <p style="color: #5f6368; font-size: 12px; text-align: center;">This code is valid for 10 minutes. Do not share it with anyone.</p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
      <p style="color: #9aa0a6; font-size: 11px;">If you did not request this code, you can safely ignore this email.</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: '[Safety Facility App] Your Login Verification Code',
    html,
    text: `Your login verification code is: ${otp}. It will expire in 10 minutes.`
  });
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOTPEmail
};
