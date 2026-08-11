const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Auth for the decoupled React dashboard. Verifies a Bearer JWT (issued by
// POST /api/tenant-auth/email-login) and derives tenantId server-side from
// the authenticated user -- callers never get to supply their own tenantId.
module.exports = async function dashboardAuth(req, res, next) {
  try {
    const authHeader = req.header('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret');
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.tenantId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.userId = user._id;
    req.tenantId = user.tenantId;
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
