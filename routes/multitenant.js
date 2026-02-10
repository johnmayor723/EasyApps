const express = require("express");
const router = express.Router();
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");

// ===============================
// API BASE (single source of truth)
// ===============================
const API_BASE =
  process.env.NODE_ENV === "production"
    ? "https://easyhostnet.com/api"
    : "http://localhost:3000/api";

// ===============================
// Multer setup
// ===============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

// ===============================
// Signup page
// ===============================
router.get("/multitenant/signup", (req, res) => {
  res.render("multitenant/signup");
});

// ===============================
// REQUEST OTP
// ===============================
router.post("/multitenant/request-otp", async (req, res) => {
  try {
    const { email } = req.body;

    console.log("Received OTP request for email:", email);

    const response = await axios.post(
      `${API_BASE}/tenant-auth/request-otp`,
      { email }
    );

    req.session.otpEmail = email;

    res.json(response.data);
  } catch (error) {
    console.error("OTP request failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to request OTP",
    });
  }
});

// ===============================
// VERIFY OTP (KEEP ROUTE AS-IS)
// ===============================
router.post("/multitent/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const response = await axios.post(
      `${API_BASE}/tenant-auth/verify-otp`,
      { email, otp }
    );

    req.session.otpVerified = true;

    res.json(response.data);
  } catch (error) {
    console.error("OTP verification failed:", error.message);

    res.status(400).json({
      success: false,
      message: "Invalid or expired OTP",
    });
  }
});

// ===============================
// COMPLETE SIGNUP
// ===============================
router.post("/multitenant/complete-signup", async (req, res) => {
  try {
    if (!req.session.otpVerified) {
      return res.status(403).json({
        success: false,
        message: "OTP not verified",
      });
    }

    const payload = {
      ...req.body,
      email: req.session.otpEmail,
    };

    const response = await axios.post(
      `${API_BASE}/tenant-auth/complete-signup`,
      payload
    );

    res.json(response.data);
  } catch (error) {
    console.error("Signup failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Signup failed",
    });
  }
});

// ===============================
// EMAIL LOGIN
// ===============================
router.post("/multitenant/login", async (req, res) => {
  try {
    const response = await axios.post(
      `${API_BASE}/tenant-auth/email-login`,
      req.body
    );

    req.session.user = response.data.data;

    res.redirect("/multinant/admin"); // 👈 keep typo
  } catch (error) {
    console.error("Login failed:", error.message);

    res.redirect("/multitenant/login?error=1");
  }
});

// ===============================
// ADMIN DASHBOARD (KEEP ROUTE)
// ===============================
router.get("/multinant/admin", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/multitenant/login");
    }

    res.render("multitenant/admin", {
      user: req.session.user,
    });
  } catch (error) {
    console.error("Admin load error:", error.message);
    res.render("errors/500");
  }
});

// ===============================
// SHOP PAGE (KEEP ROUTE)
// ===============================
router.get("/shopp/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;

    const products = await axios.get(
      `${API_BASE}/products`,
      { headers: { "x-tenant-id": tenantId } }
    );

    res.render("shop/index", {
      products: products.data.data,
      tenantId,
    });
  } catch (error) {
    console.error("Shop load failed:", error.message);
    res.render("errors/500");
  }
});

// ===============================
// BRANDING UPDATE
// ===============================
router.post(
  "/multitenant/update-branding",
  upload.single("logo"),
  async (req, res) => {
    try {
      const form = new FormData();

      Object.keys(req.body).forEach((key) =>
        form.append(key, req.body[key])
      );

      if (req.file) {
        form.append("logo", req.file.buffer, req.file.originalname);
      }

      const response = await axios.post(
        `${API_BASE}/tenant-auth/update-branding`,
        form,
        { headers: form.getHeaders() }
      );

      res.json(response.data);
    } catch (error) {
      console.error("Branding update failed:", error.message);

      res.status(500).json({
        success: false,
        message: "Branding update failed",
      });
    }
  }
);

module.exports = router;
