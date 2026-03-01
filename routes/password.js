const express = require("express");
const router = express.Router();
const axios = require("axios");



router.get("/forgot-password", (req, res) => {
    res.render("multitenant/reset-password-otp", { layout: false });
});


router.post("/request-password-reset", async (req, res) => {
  try {
    const { email } = req.body;
    console.log("Password reset request for email:", email);
    if (!email) {
      req.flash("error_msg", "Email is required");
      return res.redirect("/forgot-password");
    }

    // Call backend API
    const response = await axios.post(
      "http://easyhostnet.localhost:3000/api/tenant-auth/request-password-reset",
      { email }
    );

    // If successful
    if (response.status === 200) {

      // Save email in session
      req.session.email = email;
      const otp = response.data.otp; // For testing, log the OTP (remove in production)
      console.log("Data for testing:", response.data);
      const success_msg = `OTP sent to your email`;
      req.session.success_msg = success_msg; // Store in session for display on next page
      req.flash("success_msg", success_msg);

      // Redirect to verify OTP page
      return res.redirect("/password/verify-otp");
    }

  } catch (error) {

    console.error("Request reset error:", error?.response?.data || error.message);

    req.flash(
      "error_msg",
      error?.response?.data?.message || "Failed to send OTP"
    );

    return res.redirect("/password/forgot-password");
  }
});
router.get('/verify-otp', (req, res) => {
  const email = req.session.email;
  res.render("multitenant/verify-otp", { email, message: null });
});
router.post('/verify-otp', async (req, res) => {
  try {
    const { otp } = req.body;
    const email = req.session.email;

    if (!otp || !email) {
      req.flash("error_msg", "OTP and email are required");
      return res.redirect("/multitenant/verify-otp");
    }
    console.log("Verifying OTP for email:", email, "OTP:", otp);
    const response = await axios.post(
      "http://localhost:3000/api/tenant-auth/verify-reset-otp",
      { email, otp }
    );

    if (response.status === 200) {
      req.flash("success_msg", "OTP verified successfully");
      return res.redirect("/multitenant/reset-password");
    }

  } catch (error) {
    console.error("Verify OTP error:", error?.response?.data || error.message);
    req.flash("error_msg", "Failed to verify OTP");
    return res.redirect("/multitenant/verify-otp");
  }
}); 
router.get("/reset-password", (req, res) => {
  const email = req.session.email;
  res.render("multitenant/reset-password", { email, message: null });
});
router.post("/reset-password", async (req, res) => {
  console.log("Reset password request body:", req.body);
  const { email, newPassword, confirmPassword } = req.body;

  if (!email || !newPassword) {
    req.flash("error_msg", "Email and new password are required");
    return res.redirect("/multitenant/reset-password-otp");
  }

  try {
    const response = await axios.post(
      "http://localhost:3000/api/tenant-auth/update-password",
      { email, newPassword, confirmPassword }
    );

    if (response.status === 200) {
      req.flash("success_msg", "Password reset successfully");
      return res.redirect("/multitenant/login");
    }
  } catch (error) {
    console.error("Reset password error:", error?.response?.data || error.message);
    req.flash("error_msg", "Failed to reset password");
    return res.redirect("/multitenant/reset-password");
  }
}); 

module.exports = router;

