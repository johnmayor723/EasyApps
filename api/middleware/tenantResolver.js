// middleware/tenantResolver.js
const Tenant = require('../models/Tenant');

module.exports = async function tenantResolver(req, res, next) {
  try {
    const hostHeader = (req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0];
    if (!hostHeader) {
      req.tenant = null;
      req.tenantId = null;
      return next();
    }

    const MAIN_DOMAIN = process.env.MAIN_DOMAIN || 'example.com'; // set this in .env for your platform

    let tenant = null;

    // If request is subdomain of MAIN_DOMAIN, extract subdomain
    if (hostHeader.endsWith(MAIN_DOMAIN)) {
      const parts = hostHeader.split('.');
      // e.g., shop1.fooddeck.com => subdomain 'shop1'
      if (parts.length > 2) {
        const subdomain = parts[0];
        tenant = await Tenant.findOne({ slug: subdomain }).lean();
      }
    }

    // fallback: check custom domain mapping
    if (!tenant) {
      tenant = await Tenant.findOne({ domain: hostHeader }).lean();
    }

    if (!tenant) {
      req.tenant = null;
      req.tenantId = null;
      return next(); // Not found — allow main app routes to continue (landing page)
    }

    req.tenant = tenant;
    req.tenantId = tenant._id;
    res.locals.tenant = tenant; // for templating if using EJS
    return next();
  } catch (err) {
    return next(err);
  }
};
