const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_GLOBAL_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const SERVER_IP = process.env.SERVER_IP;
const SAAS_DOMAIN = process.env.SAAS_DOMAIN; // e.g. yoursaas.com

/**
 * POST /api/client-domain
 * Body: { domain: "clientdomain.com" }
 * Creates Cloudflare DNS records with proxy enabled (auto SSL)
 */
router.post('/', async (req, res) => {
  const { domain } = req.body;

  if (!domain) {
    return res.status(400).json({
      success: false,
      message: 'Domain is required'
    });
  }

  const url = `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records`;

  // Root A record
  const aRecord = {
    type: 'A',
    name: domain,
    content: SERVER_IP,
    ttl: 3600,
    proxied: true // Cloudflare handles SSL
  };

  // www CNAME record
  const cnameRecord = {
    type: 'CNAME',
    name: 'www',
    content: `${domain}.${SAAS_DOMAIN}`.replace(/\.$/, ''),
    ttl: 3600,
    proxied: true
  };

  try {
    const headers = {
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json'
    };

    const [resA, resCNAME] = await Promise.all([
      axios.post(url, aRecord, { headers }),
      axios.post(url, cnameRecord, { headers })
    ]);

    res.json({
      success: true,
      message: 'DNS records created and proxied by Cloudflare',
      aRecord: resA.data,
      cnameRecord: resCNAME.data
    });

  } catch (err) {
    console.error(err.response?.data || err.message);

    res.status(500).json({
      success: false,
      error: err.response?.data || err.message
    });
  }
});

module.exports = router;
