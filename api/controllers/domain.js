// controllers/domainController.js
const axios = require('axios');
const qs = require('querystring');
const registerDomainService = require("../services/registerDomain.services");
const CLOUDFLARE_BASE_URL = 'https://api.cloudflare.com/client/v4';

async function registerDomain(req, res) {
  try {
    const { domain, registrant } = req.body;

    const response = await registerDomainService({
      domain,
      registrant, // optional
    });

    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (err) {
    console.error("Domain registration failed:", err);

    return res.status(500).json({
      success: false,
      message: "Domain registration failed",
      error: err.message || err,
    });
  }
}






/**
 * Create A + CNAME records in Cloudflare
 * - A record: root domain → SERVER_IP
 * - CNAME: slug.easyhostnet.com → root domain
 */
async function createCloudflareDNS(req, res) {
  try {
    const { domain, slug } = req.body;

    if (!domain || !slug) {
      return res.status(400).json({
        success: false,
        message: 'domain and slug are required',
      });
    }

    const zoneId = process.env.CLOUDFLARE_ZONE_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    const serverIP = process.env.SERVER_IP;

    const headers = {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    };

    /** ------------------------
     * 1️⃣ Create A record
     * -----------------------*/
    const aRecord = await axios.post(
      `${CLOUDFLARE_BASE_URL}/zones/${zoneId}/dns_records`,
      {
        type: 'A',
        name: domain,
        content: serverIP,
        ttl: 120,
        proxied: true,
      },
      { headers }
    );

    /** ------------------------
     * 2️⃣ Create CNAME record
     * -----------------------*/
    const cnameRecord = await axios.post(
      `${CLOUDFLARE_BASE_URL}/zones/${zoneId}/dns_records`,
      {
        type: 'CNAME',
        name: `${slug}.easyhostnet.com`,
        content: domain,
        ttl: 120,
        proxied: true,
      },
      { headers }
    );

    return res.status(200).json({
      success: true,
      message: 'Cloudflare DNS records created',
      records: {
        a: aRecord.data.result,
        cname: cnameRecord.data.result,
      },
    });

  } catch (err) {
    console.error(
      'Cloudflare DNS error:',
      err.response?.data || err.message
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to create Cloudflare DNS records',
      error: err.response?.data || err.message,
    });
  }
}


module.exports = {
  registerDomain,
  createCloudflareDNS,
};
