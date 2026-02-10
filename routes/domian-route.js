import express from "express";
import { registerDomain } from "../services/go54.service.js";
import { createCloudflareDNS } from "../services/cloudflare.service.js";
import { contacts } from "../utils/contacts.js";

const router = express.Router();

router.post("/buy-domain", async (req, res) => {
  const { domain } = req.body;

  try {
    // 1️⃣ Register domain via Go54
    const order = await registerDomain({
      domain,
      regperiod: 1,
      nameservers: {
        ns1: "raquel.ns.cloudflare.com",
        ns2: "sri.ns.cloudflare.com"
      },
      contacts
    });

    // 2️⃣ Create Cloudflare DNS (proxied = SSL auto)
    await createCloudflareDNS(domain);

    res.json({
      success: true,
      message: "Domain registered & connected to SaaS",
      order
    });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({
      success: false,
      error: err.response?.data || err.message
    });
  }
});

export default router;
