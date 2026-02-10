/*const Cloudflare = require('cloudflare');

const cf = new Cloudflare({
  apiToken: process.env. CLOUDFLARE_API_TOKEN,
});

const createZoneAndRecords = async (req, res) => {
  try {
    const { domain, slug } = req.body;

    if (!domain || !slug) {
      return res.status(400).json({
        success: false,
        message: 'domain and slug are required',
      });
    }

    /**
     * 1. Create Zone
 
    const zone = await cf.zones.create({
      account: { id: process.env.CLOUDFLARE_ACCOUNT_ID },
      name: domain,
      type: 'full',
    });

    const zoneId = zone.id;

    /**
     * 2. A Record → root domain → SERVER_IP

    await cf.dns.records.create(zoneId, {
      type: 'A',
      name: domain,
      content: process.env.SERVER_IP,
      ttl: 120,
      proxied: true,
    });

    /**
     * 3. CNAME → slug.easyhostnet.com
     * example: tenant1.example.com → slug.easyhostnet.com

    await cf.dns.records.create(zoneId, {
      type: 'CNAME',
      name: `${slug}.${domain}`,
      content: 'slug.easyhostnet.com',
      ttl: 120,
      proxied: true,
    });

    return res.json({
      success: true,
      message: 'Zone and DNS records created successfully',
      data: {
        zoneId,
        domain,
        aRecord: domain,
        cname: `${slug}.${domain} → slug.easyhostnet.com`,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: 'Cloudflare operation failed',
      error: error?.message || error,
    });
  }
};

module.exports = {
  createZoneAndRecords,
};
*/