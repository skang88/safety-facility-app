const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return false;
    }
  },
  name: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['center_user', 'center_approver', 'station_admin', 'hq_admin', 'user', 'admin'],
    default: 'center_user'
  },
  center: {
    type: String,
    default: '의령'
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true
  },
  licensePlates: {
    type: [String],
    default: []
  },
  otp: String,
  otpExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true
});

// Instance method to generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Token is valid for 10 minutes
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
