// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const LoginHistory = require('../models/loginHistoryModel');
const { sendVerificationEmail, sendPasswordResetEmail, sendOTPEmail } = require('../utils/emailUtils');
const crypto = require('crypto');

// --- 📧 Passwordless Login: OTP System ---

// @desc    Request a 6-digit OTP via email
// @route   POST /api/auth/request-otp
exports.requestOTP = async (req, res) => {
  let { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });
  
  email = email.toLowerCase().trim();

  // Domain validation
  const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN || '@seohan.com';
  if (!email.endsWith(allowedDomain)) {
    return res.status(400).json({ message: `Only ${allowedDomain} emails are allowed.` });
  }

  try {
    let user = await User.findOne({ email });

    // If user doesn't exist, create one (Auto-registration)
    if (!user) {
      const employeeId = email.split('@')[0].toUpperCase();
      user = new User({
        email,
        employeeId,
        isVerified: true, // Auto-verify as they have company email
        isActive: true
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP via Email
    await sendOTPEmail(email, otp);

    res.status(200).json({ message: 'Verification code sent to your email.' });
  } catch (error) {
    console.error('Request OTP Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Verify OTP and login
// @route   POST /api/auth/verify-otp
exports.verifyOTP = async (req, res) => {
  let { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required.' });

  email = email.toLowerCase().trim();

  try {
    const user = await User.findOne({ 
      email,
      otp,
      otpExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired verification code.' });
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated.' });
    }

    // Issue JWT Token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_jwt_secret',
      { expiresIn: '1d' }
    );

    // Log login history
    await LoginHistory.create({
      user: user._id,
      email: user.email,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({ 
      token,
      user: {
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// --- 🎫 External Integration: Ticket System ---

// @desc    Issue a short-lived ticket for external apps (C# etc.)
// @route   POST /api/auth/external-ticket
exports.issueExternalTicket = async (req, res) => {
  const { employeeId, apiKey } = req.body;

  // Simple security check (Should use process.env.EXTERNAL_API_KEY in production)
  const masterKey = process.env.EXTERNAL_API_KEY || 'sag_external_secret';
  if (apiKey !== masterKey) {
    return res.status(401).json({ message: 'Unauthorized access.' });
  }

  try {
    const user = await User.findOne({ employeeId: employeeId.toUpperCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Generate a very short-lived ticket (5 minutes)
    const ticket = jwt.sign(
      { userId: user._id, type: 'EXT_TICKET' },
      process.env.JWT_SECRET || 'fallback_jwt_secret',
      { expiresIn: '5m' }
    );

    res.status(200).json({ ticket });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Exchange ticket for a full session JWT
// @route   POST /api/auth/ticket-exchange
exports.exchangeTicket = async (req, res) => {
  const { ticket } = req.body;

  try {
    const decoded = jwt.verify(ticket, process.env.JWT_SECRET || 'fallback_jwt_secret');
    
    if (decoded.type !== 'EXT_TICKET') {
      return res.status(400).json({ message: 'Invalid ticket type.' });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(403).json({ message: 'Account inactive or not found.' });
    }

    // Issue a regular 1-day session token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_jwt_secret',
      { expiresIn: '1d' }
    );

    // Log login history
    await LoginHistory.create({
      user: user._id,
      email: user.email,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({ 
      token, 
      user: { 
        email: user.email, 
        role: user.role, 
        employeeId: user.employeeId, 
        name: user.name 
      } 
    });
  } catch (error) {
    res.status(401).json({ message: 'Ticket expired or invalid.' });
  }
};

// --- Helper Function ---
const generateEmailVerificationToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback_jwt_secret', { expiresIn: '1d' });
};


// 회원가입
exports.register = async (req, res) => {
  let { email, password, name, role, center } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  email = email.toLowerCase().trim();

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: 'Email or ID is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const employeeId = email.includes('@') ? email.split('@')[0].toUpperCase() : email.toUpperCase();

    const user = new User({ 
      email, 
      password: hashedPassword, 
      name: name || employeeId,
      employeeId,
      role: role || 'center_user',
      center: center || '의령',
      isVerified: true,
      isActive: true
    });

    await user.save();

    res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 로그인
exports.login = async (req, res) => {
  let { email, username, password } = req.body;
  const loginId = (username || email || '').toLowerCase().trim();

  if (!loginId || !password) {
    return res.status(400).json({ message: 'Please provide ID/Email and password.' });
  }

  try {
    const searchConditions = [
      { email: loginId },
      { employeeId: loginId.toUpperCase() }
    ];

    if (!loginId.includes('@')) {
      searchConditions.push({ email: `${loginId}@korea.kr` });
      searchConditions.push({ email: `${loginId}@local` });
    }

    const user = await User.findOne({
      $or: searchConditions
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact an administrator.' });
    }

    // Auto-update isVerified if false for legacy accounts
    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, center: user.center },
      process.env.JWT_SECRET || 'fallback_jwt_secret',
      { expiresIn: '1d' }
    );

    // Log login history
    await LoginHistory.create({
      user: user._id,
      email: user.email,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({ 
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name || user.employeeId || user.email,
        role: user.role,
        center: user.center || '의령',
        employeeId: user.employeeId
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 이메일 인증 컨트롤러
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      throw new Error('Verification token was not provided.');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_jwt_secret');
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new Error('User not found.');
    }

    if (user.isVerified) {
      const alreadyVerifiedHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Already Verified</title>
          <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f8ff; }
              .container { text-align: center; padding: 40px; background-color: white; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
              h1 { color: #1e90ff; }
              p { color: #333; font-size: 1.1em; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>ℹ️</h1>
              <h1>This Email is Already Verified</h1>
              <p>This account has already been activated. You can now log in or close this window.</p>
          </div>
      </body>
      </html>
    `;
      return res.status(200).send(alreadyVerifiedHtml);
    }

    user.isVerified = true;
    await user.save();

    // --- 인증 성공 HTML ---
    const successHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verified!</title>
          <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #e6ffe6; }
              .container { text-align: center; padding: 40px; background-color: white; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
              h1 { color: #28a745; }
              p { color: #333; font-size: 1.1em; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>✅</h1>
              <h1>Email Successfully Verified!</h1>
              <p>Your email address has been successfully verified. You can now close this window and log in to your account.</p>
          </div>
      </body>
      </html>
    `;
    res.status(200).send(successHtml);

  } catch (error) {
    // --- 인증 실패 HTML ---
    let errorMessage = 'The token is invalid or has expired.';
    if (error.name === 'TokenExpiredError') {
      errorMessage = 'The verification link has expired. Please request a new one.';
    } else if (error.message && error.message !== 'This account has already been verified.') {
      errorMessage = error.message;
    }

    const errorHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verification Failed!</title>
          <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #ffe6e6; }
              .container { text-align: center; padding: 40px; background-color: white; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
              h1 { color: #dc3545; }
              p { color: #333; font-size: 1.1em; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>❌</h1>
              <h1>Email Verification Failed!</h1>
              <p>${errorMessage}</p>
              <p>Please try again or contact support.</p>
          </div>
      </body>
      </html>
    `;
    res.status(400).send(errorHtml);
  }
};


// 비밀번호 재설정 요청
exports.forgotPassword = async (req, res) => {
    let { email } = req.body;
    email = email.toLowerCase(); // Convert email to lowercase

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User with that email does not exist.' });
        }

        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });

        // 비밀번호 재설정 이메일 전송
        await sendPasswordResetEmail(user.email, resetToken);

        res.status(200).json({ message: 'Password reset link sent to your email.' });

    } catch (error) {
        console.error('Forgot Password Error:', error);
        if (user) {
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });
        }
        res.status(500).json({ message: 'There was an error sending the password reset email. Please try again later.' });
    }
};

// 비밀번호 재설정
exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    try {
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Token is invalid or has expired.' });
        }

        user.password = await bcrypt.hash(password, 10);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.isVerified = true;

        await user.save();

        res.status(200).json({ message: 'Password has been reset successfully.' });

    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ message: 'There was an error resetting your password. Please try again.' });
    }
};
