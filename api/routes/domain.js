const express = require('express');
const axios = require('axios');
const router = express.Router();
const { registerDomain } = require('../controllers/domain');
const nodemailer = require('nodemailer'); 

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
      user: process.env.SMTP_USER || 'your-email@gmail.com',
      pass: process.env.SMTP_PASS || 'your-email-password'
  }
});

// Generic sendMail function
async function sendMail({ to, subject, text, from }) {
  const mailOptions = {
    from: from || process.env.SMTP_FROM || 'no-reply@example.com',
    to,
    subject,
    text
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err);
    throw err;
  }
}

// Ping route
router.get("/ping", (req, res) => {
  res.json({ ok: true });
});

// Domain check route
router.post('/check-domain', async (req, res) => {
  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: 'Domain is required' });

  try {
    await axios.get(`https://rdap.nic.net.ng/domain/${domain}`, {
      headers: {
        Accept: 'application/rdap+json',
        'User-Agent': 'KeemaDomainChecker/1.0'
      },
      timeout: 10000
    });

    return res.json({ domain, available: false, source: 'rdap' });
  } catch (err) {
    const status = err.response?.status;
    if (status === 404 || status === 500) {
      return res.json({ domain, available: true, source: 'rdap' });
    }
    return res.status(500).json({ domain, available: null, error: 'RDAP_UNREACHABLE' });
  }
});

// Domain registration route
router.post('/register-domain', async (req, res) => {
  const { email, domain } = req.body;
  if (!email || !domain) return res.status(400).json({ error: 'email and domain are required' });

  const cleaned = String(domain).trim().toLowerCase();
  const displayDomain = cleaned.endsWith('.com.ng') ? cleaned : `${cleaned}.com.ng`;

  const userEmailContent = {
    to: email,
    subject: 'Domain Reservation Received',
    text: `We have received your reservation request for ${displayDomain}.\n\nYour domain will propagate within 48 hours. After propagation, you will be able to see your website at http://${displayDomain}\n\nIf you have any questions, reply to this email.`
  };

  const adminEmailContent = {
    to: process.env.ADMIN_EMAIL || 'admin-email@example.com',
    subject: 'New Domain Reservation',
    text: `New domain reservation received:\n\nDomain: ${displayDomain}\nRequester email: ${email}\n\nPlease process the request.`
  };

  try {
    await sendMail(userEmailContent);
    await sendMail(adminEmailContent);

    return res.json({
      ok: true,
      message: 'Domain reservation received. Confirmation sent to user and admin notified.',
      domain: displayDomain,
      email
    });
  } catch (err) {
    return res.status(500).json({ error: 'EMAIL_SEND_FAILED' });
  }
});

module.exports = router;
