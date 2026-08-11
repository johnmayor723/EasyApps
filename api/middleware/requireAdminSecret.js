// Shared-secret gate for admin/maintenance routes that don't have a real
// admin-role login flow yet (see ADMIN_API_SECRET in .env).
module.exports = function requireAdminSecret(req, res, next) {
  const secret = process.env.ADMIN_API_SECRET;
  const provided = req.headers['x-admin-secret'] || req.query.adminSecret || req.body?.adminSecret;

  if (!secret || !provided || provided !== secret) {
    return res.status(403).json({ error: "Not authorized. Provide correct secret via x-admin-secret header." });
  }

  next();
};
