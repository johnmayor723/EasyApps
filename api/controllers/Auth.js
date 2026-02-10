// controllers/authController.js
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const jwt = require('jsonwebtoken');
const tenantResolver = require('../middleware/tenantResolver');

const jwtSecret = "%^^__64sffyyyuuyrrrewe32e";

// 🔹 Send Email Function
const sendEmail = async (to, subject, text) => {
  let transporter = nodemailer.createTransport({
    host: "smtp.zoho.com",
    port: 465,
    secure: true,
    auth: {
      user: "info@mfbyforesythebrand.com",
      pass: "#@T1onal",
    },
  });

  await transporter.sendMail({
    from: `"mfbyforesythebrand" <info@mfbyforesythebrand.com>`,
    to,
    subject,
    text,
  });
};

// 🔹 User Registration
exports.register = async (req, res) => {
  try {
    console.log("Register function hit");

    // Resolve tenant
    const tenant = await tenantResolver(req);
    if (!tenant) return res.status(400).json({ error: "Tenant not found" });

    const { name, email, password, roles = ["customer"] } = req.body;

    // Create user with tenantId
    let user = new User({
      tenantId: tenant._id,
      name,
      email,
      password,
      roles,
    });

    // Generate verification token
    user.verificationToken = crypto.randomBytes(32).toString("hex");
    await user.save();

    console.log("Saved user:", user);

    // If user is a customer, add to Tenant.customers
    if (roles.includes("customer")) {
      await Tenant.findByIdAndUpdate(tenant._id, {
        $addToSet: { customers: user._id }
      });
    }

    const verifyLink = `http://93.127.160.233:3060/api/auth/verify-email/${user.verificationToken}`;
    console.log("Generated verification link:", verifyLink);

    await sendEmail(email, "Verify Your Email", `Click here to verify: ${verifyLink}`);

    res.json({
      message: "Registration successful. Check your email for verification link.",
      user: {
        id: user._id,
        tenantId: tenant.tenantId,
        email: user.email,
        roles: user.roles,
      }
    });
  } catch (error) {
    console.error("Error in register:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// 🔹 Delete All Users (per tenant)
exports.deleteAllUsers = async (req, res) => {
  try {
    const tenant = await tenantResolver(req);
    if (!tenant) return res.status(400).json({ error: "Tenant not found" });

    await User.deleteMany({ tenantId: tenant._id });

    // Clear tenant customers as well
    tenant.customers = [];
    await tenant.save();

    res.json({ message: "All users deleted successfully for this tenant" });
  } catch (error) {
    console.error("Error deleting all users:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// 🔹 User Login
exports.login = async (req, res) => {
  try {
    const tenant = await tenantResolver(req);
    if (!tenant) return res.status(400).json({ error: "Tenant not found" });

    const { email, password } = req.body;

    const user = await User.findOne({ email, tenantId: tenant._id });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id, tenantId: tenant._id }, jwtSecret, { expiresIn: '1h' });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        tenantId: tenant.tenantId,
        name: user.name,
        email: user.email,
        roles: user.roles,
        isVerified: user.isVerified || false,
        createdAt: user.createdAt,
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// 🔹 Verify Email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    console.log("Verifying token:", token);

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.redirect("https://mfbyforesythebrand.com/verified-email-login");
  } catch (error) {
    console.error("Error in verifyEmail:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// 🔹 Request Password Reset
exports.requestPasswordReset = async (req, res) => {
  try {
    const tenant = await tenantResolver(req);
    if (!tenant) return res.status(400).json({ error: "Tenant not found" });

    const { email } = req.body;
    const user = await User.findOne({ email, tenantId: tenant._id });

    if (!user) return res.status(404).json({ error: "User not found" });

    user.resetPasswordToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordExpires = Date.now() + 3600000; 
    await user.save();

    const resetUrl = `http://93.127.160.233:3060/api/auth/reset-password/${user.resetPasswordToken}`;
    await sendEmail(user.email, "Password Reset", `Click here to reset your password: ${resetUrl}`);

    res.json({ message: "Password reset link sent to email." });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// 🔹 Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({ 
      resetPasswordToken: token, 
      resetPasswordExpires: { $gt: Date.now() } 
    });

    if (!user) {
      return res.redirect("http://93.127.160.233:3060/api/auth/error-password-reset");
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.redirect("https://mfbyforesythebrand.com/success-password-reset-login");
  } catch (error) {
    res.redirect("http://93.127.160.233:3060/api/auth/error-password-reset");
  }
};
