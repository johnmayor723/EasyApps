const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// ----------------------
// Initialize Payment
// ----------------------
router.post("/paystack/initialize", async (req, res) => {
  try {
    const { email, amount, plan, tenantId } = req.body;

    if (!email || !amount || !plan || !tenantId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const payload = {
      email,
      amount: amount * 100, // Paystack expects kobo
      currency: "NGN",
      metadata: {
        plan,
        tenantId
      },
      callback_url: `https://yourdomain.com/paystack/callback`
    };

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      payload,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.json({ success: true, data: response.data.data });
  } catch (err) {
    console.error("Paystack init error:", err.response?.data || err.message);
    res.status(500).json({ error: "Payment initialization failed" });
  }
});

// ----------------------
// Verify Payment
// ----------------------
router.get("/paystack/verify/:reference", async (req, res) => {
  try {
    const { reference } = req.params;
    if (!reference) {
      return res.status(400).json({ error: "Reference is required" });
    }

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const paymentData = response.data.data;

    if (paymentData.status === "success") {
      // TODO: Update tenant subscription, save payment record etc.
      return res.json({ success: true, payment: paymentData });
    } else {
      return res.status(400).json({ error: "Payment not successful" });
    }
  } catch (err) {
    console.error("Paystack verify error:", err.response?.data || err.message);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

module.exports = router;
