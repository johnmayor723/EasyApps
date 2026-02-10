const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema } = mongoose;

// Address sub-schema
const addressSchema = new Schema({
  flatNumber: String,
  street: String,
  city: String,
  postCode: {
    type: String,
    match: [/^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/, 'Please enter a valid UK postcode'],
  },
  country: {
    type: String,
    default: 'United Kingdom',
  },
});

// User schema with tenant reference
const userSchema = new Schema({
  tenantId: {
  type: String,
  index: true,
},

  name: String,
  email: {
    type: String,
    index: true, // fast lookup
  },
  otp: String,
  otpExpires: Date,
  isEmailVerified: { type: Boolean, default: false },

  password: String,
  phoneNumber: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  verificationToken: String,

  addresses: {
    type: [addressSchema],
    default: [],
  },
  roles: {
    type: [String],
    default: ['customer'],
  },
  isVerified: { type: Boolean, default: false },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 🔐 Hash the password before saving (only if password exists & is modified)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false; // handle OTP-only users
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
