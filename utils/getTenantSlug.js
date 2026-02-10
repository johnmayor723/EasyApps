// utils/getTenantSlug.js
module.exports = function getTenantSlug(req) {
  // --- 1️⃣ Production: subdomain-based ---
  const host = req.headers.host; // e.g., mayowa.easyhostnet.com
  const hostParts = host.split(".");

  if (hostParts.length >= 3) {
    return {
      tenantId: null, // we don't know ID yet; will be fetched by slug
      slug: hostParts[0],
      mode: "production",
    };
  }

  // --- 2️⃣ Local/testing: path-based ---
  const pathSegments = req.path.split("/").filter(Boolean); // remove empty ""
  if (pathSegments.length >= 2) {
    return {
      tenantId: pathSegments[0],
      slug: pathSegments[1],
      mode: "local",
    };
  }

  // Fallback
  return null;
};
