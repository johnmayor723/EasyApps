const { v4: uuidv4 } = require('uuid');
const Tenant = require('../models/Tenant');
const TenantEmail = require('../models/TenantEmail');
const User = require('../models/User');
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const jwtSecret = process.env.JWT_SECRET || "supersecret";

// 🔧 Mail transport (Zoho or replace with another SMTP)

/*
var transporter = nodemailer.createTransport({
    host: "smtp.zeptomail.com",
    port: 587,
    auth: {
    user: "emailapikey",
    pass: "wSsVR610qxD5WKkpn2f/Lro7mFhTDlqiHE5/3FD3un6uTPHCpcdqwhbOVlKuHvAaGTVrEzUToLl/kUgIhzJdhtguzAxTXSiF9mqRe1U4J3x17qnvhDzKW2tdlRKAJYgBwgxsmWBkE8wm+g=="
    }
});

// Verify SMTP connection
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP VERIFY FAILED:", error);
  } else {
    console.log("✅ SMTP READY");
  }
});*/




const transport = nodemailer.createTransport({
  host: "smtp.mail.yahoo.com",
  port: 465,
  secure: true, // use SSL
  auth: {
    user: "johnmayor723@yahoo.com",
    pass: process.env.SMTP_PASS, // your app password
  },
});

transport.verify((err, success) => {
  if (err) console.log("❌ SMTP VERIFY FAILED:", err);
  else console.log("✅ SMTP Verified: Ready to send emails");
});

// ✉️ Utility: Send email
const sendEmail = async (to, subject, text) => {
  await transport.sendMail({
    from: `"EasyApps" <johnmayor723@yahoo.com>`,
    to,
    subject,
    text,
  });
};

exports.deleteAllTenantsAndUsers = async (req, res) => {
  try {
    // Safeguard: require a secret to run this destructive action
    const secret = process.env.WIPE_SECRET;
    const provided = req.body.secret || req.headers['x-wipe-secret'] || req.query.secret;
    if ( provided !== secret) {
      return res.status(403).json({ error: "Wipe not authorized. Provide correct secret via x-wipe-secret header or ?secret=" });
    }

    // Delete all tenants and users
    const tenantResult = await Tenant.deleteMany({});
    const userResult = await User.deleteMany({});

    return res.status(200).json({
      message: "All tenants and users removed",
      tenantsDeleted: tenantResult.deletedCount ?? 0,
      usersDeleted: userResult.deletedCount ?? 0,
    });
  } catch (err) {
    console.error("Error wiping tenants/users:", err);
    return res.status(500).json({ error: "Server error during wipe" });
  }
};

/**
 * 📌 Tenant Sign Up (creates tenant + owner user)
 */

//const sendEmail = require('../utils/sendMail'); // Adjust the path as necessary

exports.requestOtp = async (req, res) => {
  try {
    console.log("---- requestOtp called ----");

    const { email } = req.body;
    console.log("Request body:", req.body);

    if (!email) {
      console.log("No email provided in request body");
      return res.status(400).json({ error: "Email is required" });
    }

    console.log("Looking up user by email:", email);
    let user = await User.findOne({ email });
    console.log(user ? `User found: ${user._id}` : "No user found");

    if (user && user.isEmailVerified) {
      console.log("Email already verified — cannot request OTP again.");
      return res.status(400).json({ error: "Email already in use" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("Generated OTP:", otp);

    if (!user) {
      console.log("No existing user, creating new one...");
      user = new User({ email });
    } else {
      console.log("Updating existing user with OTP...");
    }

    // Save OTP and expiry
    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
    console.log("Saving user with OTP and expiry:", user);
    await user.save();
    console.log("User saved successfully");

    // Send OTP
    console.log(`Sending OTP email to: ${email}`);
    await sendEmail(email, "Your OTP Code", `Your verification code is: ${otp}`);
    console.log("OTP email sent successfully");

    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    console.error("Error in requestOtp:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    if (!user.otp || !user.otpExpires) {
      return res.status(400).json({ error: "No OTP requested" });
    }

    if (Date.now() > user.otpExpires) {
      return res.status(400).json({ error: "OTP expired" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.completeSignup = async (req, res) => {
  try {
    const { name, email, password, slug, domain, plan,type ,url, contact, address,
      city,
      state,
      country,
      zip, phone} = req.body;
    console.log("➡️ Incoming signup request:", { name, email, slug, domain, plan, type, contact,address,
      city,
      state,
      country,
      zip, phone });

    const user = await User.findOne({ email });
    console.log("🔍 Found user:", user ? user._id : "not found");

    if (!user || !user.isEmailVerified) {
      console.log("❌ Email not verified for:", email);
      return res.status(400).json({ error: "Email not verified" });
    }

    // Check if tenant slug or domain already exists
    const query = [{ slug }];

    if (domain && domain.trim() !== "") {
      query.push({ domain });
    }

    const existingTenant = await Tenant.findOne({
      $or: query
    });


    if (existingTenant) {
      return res.status(400).json({ error: "Tenant slug or domain already in use" });
    }
    
    // Ensure contact is always an array
    const contactArray = {
      email: contact?.email || "",
      phone: contact?.phone || "",
      address: contact?.address || "",
      city: contact?.city || "",
      state: contact?.state || "",
      country: contact?.country || "",
      zip: contact?.zip || "",
      phone: contact?.phone || ""
    }
     // Generate tenantId once and use it for both tenant + user
    const tenantId = uuidv4();
    console.log("🆔 Generated tenantId:", tenantId);

    // TEMP: manual baseUrl per environment (refactor later)
    const baseUrl =
      process.env.NODE_ENV === "production"
        ? "https://easyhostnet.com"
        : "http://localhost:3000";

    const appUrl = `${baseUrl}/multitenant/${tenantId}/${slug}`;

    console.log("🌍 Generated app URL:", appUrl);

    // Update user with signup details
    user.name = name;
    user.password = password;
    user.isVerified = true;
    user.type = type;
    user.url = appUrl;
    user.roles = ["tenant_admin"];
    await user.save();
    console.log("✅ User updated:", user._id);

   


    // Create tenant
    let tenant = new Tenant({
      name,
      slug,
      domain,
      owner: {
        userId: user._id,
        name,
        email,
      },
      tenantId,
      plan,
      type,
      contact: {
        email: contact?.email || "",
        phone: contact?.phone || "",
        address: contact?.address || "",
        city: contact?.city || "",
        state: contact?.state || "",
        country: contact?.country || "",
        zip: contact?.zip || "",
      },  
      address,
      city,
      state,
      country,
      zip,
      phone,
      url: appUrl,
      provider: "paystack",
      status: "pending",
      email, // also store tenant email
    });

    await tenant.save();
    console.log("✅ Tenant created:", tenant._id);

    // Link tenantId to user
    user.tenantId = tenant.tenantId;
    await user.save();
    console.log("✅ User linked with tenantId:", user.tenantId);

    res.status(201).json({
      message: "Tenant created successfully",
      tenant: { id: tenant._id, slug: tenant.slug, domain: tenant.domain, plan: tenant.plan, tenantId: tenant.tenantId, url: tenant.url },
      owner: { id: user._id, email: user.email, tenantId: user.tenantId , url: user.url },
      type: tenant.type,
    });
  } catch (error) {
    console.error("🔥 Complete signup error:", error);
    res.status(500).json({ error });
  }
};
// controllers/tenant.controller.js
exports.updateTenantBranding = async (req, res) => {
  try {
    const { logoUrl, primaryColor, secondaryColor, theme, ourStory } = req.body;

    const tenantId = req.session.tenantId || req.user?.tenantId;

    console.log("➡️ Branding update request:", {
      tenantId,
      logoUrl,
      primaryColor,
      secondaryColor,
      theme,
      ourStory
    });

    if (!tenantId) {
      return res.status(401).json({ error: "Unauthorized tenant access" });
    }

    const tenant = await Tenant.findOne({ tenantId });
    console.log("🔍 Tenant lookup:", tenant ? tenant._id : "not found");

    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    // 🔹 Update branding fields safely
    if (logoUrl !== undefined) tenant.branding.logoUrl = logoUrl;
    if (primaryColor) tenant.branding.primaryColor = primaryColor;
    if (secondaryColor) tenant.branding.secondaryColor = secondaryColor;
    if (theme) tenant.branding.theme = theme;
    if (ourStory) tenant.branding.ourStory = ourStory;

    await tenant.save();
    console.log("✅ Tenant branding updated:", tenant._id);

    // Optional: sync branding into session
    req.session.branding = tenant.branding;

    res.status(200).json({
      message: "Branding updated successfully",
      branding: tenant.branding,
    });

  } catch (error) {
    console.error("🔥 Branding update error:", error);
    res.status(500).json({ error: "Failed to update branding" });
  }
};

exports.tenantSignup = async (req, res) => {
  try {
    const { name, email, password, slug, domain, plan } = req.body;

    // Check if tenant slug or domain already exists
    let existingTenant = await Tenant.findOne({ $or: [{ slug }, { domain }] });
    if (existingTenant) {
      return res.status(400).json({ error: "Tenant slug or domain already in use" });
    }

    // Create the owner user
    let ownerUser = new User({
      name,
      email,
      password,
      roles: ["tenant_admin"],
      verificationToken: crypto.randomBytes(32).toString("hex"),
    });

    await ownerUser.save();

    // Create tenant and link to owner
    let tenant = new Tenant({
      name,
      slug,
      domain,
      owner: {
        userId: ownerUser._id,
        name,
        email,
      },
      plan: plan || { provider: "paystack", status: "pending" },
    });

    await tenant.save();

    // Assign tenantId to ownerUser
    ownerUser.tenantId = tenant._id;
    await ownerUser.save();

    // Send verification email
    const verifyUrl = `http://yourdomain.com/api/tenant-auth/verify-email/${ownerUser.verificationToken}`;
    await sendEmail(ownerUser.email, "Verify Your Tenant Account", `Click here to verify: ${verifyUrl}`);

    res.status(201).json({
      message: "Tenant created. Please verify your email.",
      tenant: { id: tenant._id, slug: tenant.slug, domain: tenant.domain },
      owner: { id: ownerUser._id, email: ownerUser.email },
    });
  } catch (error) {
    console.error("Tenant signup error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * 📌 Tenant Login
 */
exports.tenantLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Step 1: Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // ✅ Step 2: Compare using model method
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // ✅ Step 3: Return user + token
    const token = jwt.sign(
      { userId: user._id },
      jwtSecret,
      { expiresIn: "7d" }
    );
    const tenant = await Tenant.findOne({ tenantId: user.tenantId });
     res.status(201).json({
      message: "Logged in successfully",
      tenant: { id: tenant._id, slug: tenant.slug, domain: tenant.domain, plan: tenant.plan, tenantId: tenant.tenantId, url: tenant.url },
      owner: { id: user._id, email: user.email, tenantId: user.tenantId , url: user.url },
      type: tenant.type,
      token,
    });
  } catch (error) {
    console.error("Tenant login error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * 📌 Get tenants
 */

exports.getAllTenants = async (req, res) => {
  try {
    const tenants = await User.find();

    res.json({
      count: tenants.length,
      tenants: tenants.map((tenant) => ({
        tenantId: tenant.tenantId,
        otp: tenant.resetOtp || null,
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
        url: tenant.url,
        plan: tenant.plan,
        type: tenant.type,
        owner: tenant.owner,
        status: tenant.status,
        branding: {
          logo: tenant.logo || null,
          primaryColor: tenant.primaryColor || "#2563eb",
          secondaryColor: tenant.secondaryColor || "#111827",
          contactColor: tenant.contactColor || "#10b981",
        },
        contact: {
          email: tenant.email || "",
          phone: tenant.phone || "",
        },
      })),
    });
  } catch (err) {
    console.error("Get all tenants error:", err);
    res.status(500).json({ error: "Server error fetching tenants" });
  }
};


/**
 * GET /api/tenants/:idOrSlug
 * Fetch tenant by tenantId or slug
 */
exports.getTenant = async (req, res) => {
  try {
    const { tenantId } = req.body;

    let tenant;

    // First try by tenantId (custom unique string)
    tenant = await Tenant.findOne({ tenantId });

 
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found"});
    }
    const contactInfo = tenant.contact || {};
    // Return tenant as JSON
    res.json({
      tenant: {
        tenantId: tenant.tenantId,
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
        url: tenant.url,
        plan: tenant.plan,
        type: tenant.type,
        owner: tenant.owner,
        status: tenant.status,
        branding: {
          logo: tenant.logo || null,
          primaryColor: tenant.primaryColor || "#2563eb",
          secondaryColor: tenant.secondaryColor || "#111827",
          contactColor: tenant.contactColor || "#10b981",
        },
        contact: contactInfo,
      },
    });
  } catch (err) {
    console.error("Get tenant error:", err);
    res.status(500).json({ error: "Server error fetching tenant" });
  }
};



/**
 * 📌 Request Password Reset
 */
/**
 * 📌 Request Password Reset OTP
 * POST /auth/request-password-reset
 */
exports.requestPasswordResetOtp = async (req, res) => {
  try {
    console.log("🔐 Password reset OTP request received");

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // 1️⃣ Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    // 2️⃣ Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3️⃣ Set expiry (10 minutes)
    const otpExpiry = Date.now() + 10 * 60 * 1000;

    // 4️⃣ Save OTP to user
    user.resetOtp = otp;
    user.resetOtpExpires = otpExpiry;
    user.resetOtpVerified = false;

    await user.save();

    console.log(`✅ OTP generated for ${email}: ${otp}`);

    // 5️⃣ Send OTP email
    const subject = "Password Reset OTP - EasyApps";

    const message = `
Hello,

You requested to reset your password.

Your password reset OTP is:

${otp}

This OTP will expire in 10 minutes.

If you did not request this, please ignore this email.

EasyApps Security Team
`;

    await sendEmail(email, subject, message);

    console.log("✅ Password reset OTP email sent");

    // 6️⃣ Return success response
    res.status(200).json({
      success: true,
      message: "OTP sent to email",
      otp, // For testing purposes only - remove in production!
    });

  } catch (error) {
    console.error("❌ requestPasswordResetOtp error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email, roles: { $in: ["tenant_admin"] } });

    if (!user) return res.status(404).json({ error: "User not found" });

    user.resetPasswordToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const resetUrl = `http://yourdomain.com/api/tenant-auth/reset-password/${user.resetPasswordToken}`;
    await sendEmail(user.email, "Tenant Password Reset", `Click here to reset your password: ${resetUrl}`);

    res.json({ message: "Password reset link sent." });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};*/

/**
 * 📌 Reset Password
 */
/**
 * 📌 Verify Password Reset OTP
 * POST /auth/verify-reset-otp
 */
exports.verifyResetOtp = async (req, res) => {
  try {
    console.log("🔐 Verify reset OTP request");

    const { email, otp } = req.body;

    // 1️⃣ Validate input
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // 2️⃣ Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 3️⃣ Check OTP exists
    if (!user.resetOtp || !user.resetOtpExpires) {
      return res.status(400).json({
        success: false,
        message: "No password reset OTP found",
      });
    }

    // 4️⃣ Check OTP expiry
    if (Date.now() > user.resetOtpExpires) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    // 5️⃣ Validate OTP
    if (user.resetOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // 6️⃣ Mark OTP as verified
    user.resetOtpVerified = true;

    await user.save();

    console.log(`✅ OTP verified for ${email}`);

    // 7️⃣ Send success response
    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });

  } catch (error) {
    console.error("❌ verifyResetOtp error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * 📌 Reset Password (after OTP verification)
 * POST /auth/reset-password
 */
exports.completePasswordReset = async (req, res) => {
  try {
    console.log("🔐 Reset password request received");

    const { email, newPassword, confirmPassword } = req.body;

    // 1️⃣ Validate input
    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, new password and confirm password are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // 2️⃣ Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 3️⃣ Check OTP verified
    if (!user.resetOtpVerified) {
      return res.status(400).json({
        success: false,
        message: "OTP not verified",
      });
    }

    // 4️⃣ Update password
    // Hashing will happen automatically via user model pre-save hook
    user.password = newPassword;

    // 5️⃣ Delete OTP fields
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    user.resetOtpVerified = undefined;

    await user.save();

    console.log(`✅ Password reset successful for ${email}`);

    // 6️⃣ Send confirmation email
    const subject = "Your Password Has Been Reset - EasyApps";

    const message = `
Hello,

Your password has been successfully reset.

If you did not perform this action, please contact support immediately.

EasyApps Security Team
`;

    await sendEmail(email, subject, message);

    console.log("✅ Password reset confirmation email sent");

    // 7️⃣ Return success response
    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });

  } catch (error) {
    console.error("❌ resetPasswordOtp error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successful." });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};*/

exports.selectPlan = async (req, res) => {
  try {
    const { plan, email } = req.body;

    if (!plan || !email) {
      return res.status(400).json({
        error: "Plan and email are required",
      });
    }

    // ✅ Update user's plan
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { plan },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // ✅ API returns JSON — NOT views
    return res.status(200).json({
      message: "Plan selected successfully",
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        plan: updatedUser.plan,
        tenantId: updatedUser.tenantId,
      },
    });

  } catch (err) {
    console.error("❌ Select plan error:", err);
    return res.status(500).json({
      error: "Server error while selecting plan",
    });
  }
};

exports.updateTenantDomain = async (req, res) => {
  try {
    const { email, domain } = req.body;

    if (!email || !domain) {
      return res.status(400).json({ error: "Email and domain are required" });
    }

    const normalizedDomain = domain.trim().toLowerCase();

    // Find the tenant using email
    const tenant = await Tenant.findOne({ "owner.email": email });
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found for this email" });
    }

    // Ensure domain is not already taken by another tenant
    const domainTaken = await Tenant.findOne({
      domain: normalizedDomain,
      _id: { $ne: tenant._id },
    });
    if (domainTaken) {
      return res.status(400).json({ error: "Domain already in use" });
    }

    // Update tenant domain and URL
    tenant.domain = normalizedDomain;
    tenant.url = `https://${normalizedDomain}`;

    await tenant.save();

    return res.status(200).json({
      message: "Domain updated successfully",
      tenant: {
        tenantId: tenant.tenantId,
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
        url: tenant.url,
        status: tenant.status,
      },
    });
  } catch (err) {
    console.error("Update domain error:", err);
    return res.status(500).json({ error: "Server error while updating domain" });
  }
};
