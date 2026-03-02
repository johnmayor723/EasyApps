const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

/*
POST /api/domain/claim-domain
*/
router.post("/claim-domain", async (req, res) => {
  try {
    const { tenantId, domain, email } = req.body;

    if (!tenantId || !domain || !email) {
      return res.status(400).json({
        success: false,
        message: "tenantId, domain and email are required"
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    /* ===============================
       1️⃣ Notify Admin
    =============================== */

    await transporter.sendMail({
      from: `"EasyHostNet Domain Request" <${process.env.SMTP_USER}>`,
      to: "info@easyhostnet.com",
      subject: "🚀 New Domain Reservation Request",
      html: `
        <h2>New Domain Claim Request</h2>
        <p><strong>Tenant ID:</strong> ${tenantId}</p>
        <p><strong>Domain:</strong> ${domain}</p>
        <p><strong>User Email:</strong> ${email}</p>
        <hr />
        <p>Please proceed with domain registration and DNS setup.</p>
      `
    });

    /* ===============================
       2️⃣ Confirm To User
    =============================== */

    await transporter.sendMail({
      from: `"EasyHostNet" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "🎉 Your Domain Reservation Has Been Received",
      html: `
        <h2>Domain Reservation Successful 🎉</h2>
        <p>Hello,</p>
        <p>Your domain <strong>${domain}</strong> has been successfully reserved.</p>
        <p>Domain propagation will be completed within <strong>48 hours</strong>.</p>
        <p>Once propagation is complete, your site will be accessible at:</p>
        <p style="font-size:18px;"><strong>https://${domain}</strong></p>
        <br/>
        <p>Thank you for choosing EasyHostNet.</p>
      `
    });

    return res.status(200).json({
      success: true,
      message: "Domain reservation request processed successfully"
    });

  } catch (error) {
    console.error("Claim Domain Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process domain reservation"
    });
  }
});

module.exports = router;