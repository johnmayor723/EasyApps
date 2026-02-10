const express = require('express');
const axios = require('axios');
const router = express.Router();
const {registerDomain} = require('../controllers/domain')
//const {createZoneAndRecords } = require('../controllers/cloudfare')

router.get("/ping", (req, res) => {
  res.json({ ok: true });
});


router.post('/check-domain', async (req, res) => {
  const { domain } = req.body;

  if (!domain) {
    return res.status(400).json({ error: 'Domain is required' });
  }

  try {
    await axios.get(
      `https://rdap.nic.net.ng/domain/${domain}`,
      {
        headers: {
          Accept: 'application/rdap+json',
          'User-Agent': 'KeemaDomainChecker/1.0'
        },
        timeout: 10000
      }
    );

    // 200 → exists
    return res.json({
      domain,
      available: false,
      source: 'rdap'
    });

  } catch (err) {
    const status = err.response?.status;

    if (status === 404 || status === 500) {
      return res.json({
        domain,
        available: true,
        source: 'rdap'
      });
    }

    return res.status(500).json({
      domain,
      available: null,
      error: 'RDAP_UNREACHABLE'
    });
  }
});

router.post('/register-domain', registerDomain); 

//router.post('/clouflare-dns',createZoneAndRecords);


module.exports = router;
