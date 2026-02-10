const express = require("express");
const axios = require("axios");
const Tenant = require("../models/Tenant");

const router = express.Router();

/* ===============================
   GO54 CONFIG (PLACEHOLDERS)
================================ */
const GO54_BASE_URL = "https://api.go54.com/v1"; // placeholder
const GO54_API_TOKEN = "GO54_API_TOKEN_HERE"; // replace later
const GO54_EMAIL = "info@easyhostnet.com";

const go54Client = axios.create({
  baseURL: GO54_BASE_URL,
  headers: {
    Authorization: `Bearer ${GO54_API_TOKEN}`,
    "Content-Type": "application/json",
  },
});

/* ===============================
   1️⃣ DOMAIN SEARCH
   POST /multitenant/domain/search
================================ */

router.get("/ping", (req, res) => {
  res.json({ ok: true });
});

router.get("/check", async (req, res) => {
  try {
    console.log('incoming domain search request')
    const { domain } = req.query;

    if (!domain) {
      return res.status(400).json({ error: "Domain is required" });
    }

    const response = await go54Client.post("/domains/search", {
      domain,
    });

    /**
     * Example response
     * {
     *   domain: "example.com",
     *   available: true,
     *   price: 12000,
     *   currency: "NGN"
     * }
     */

    return res.status(200).json({
      message: "Domain search successful",
      result: response.data,
    });
  } catch (err) {
    console.error("Domain search error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Unable to search domain" });
  }
});

/* ===============================
   2️⃣ DOMAIN RESERVATION / PURCHASE
   POST /multitenant/domain/reserve
================================ */
router.post("/domain/reserve", async (req, res) => {
  try {
    const { domain, tenantId } = req.body;

    if (!domain || !tenantId) {
      return res.status(400).json({
        error: "Domain and tenantId are required",
      });
    }

    const response = await go54Client.post("/domains/reserve", {
      domain,
      customer_email: GO54_EMAIL,
      metadata: {
        tenantId,
        source: "easyhostnet",
      },
    });

    /**
     * Example response
     * {
     *   reservationId: "res_123",
     *   expiresAt: "2026-02-01T12:00:00Z"
     * }
     */

    return res.status(200).json({
      message: "Domain reserved successfully",
      domain,
      reservationId: response.data.reservationId,
      expiresAt: response.data.expiresAt,
    });
  } catch (err) {
    console.error("Domain reservation error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Unable to reserve domain" });
  }
});

/* ===============================
   3️⃣ UPDATE TENANT AFTER SUCCESS
   POST /multitenant/update-tenant-domain
================================ */
router.post("/update-tenant-domain", async (req, res) => {
  try {
    const { domain, tenantId, reservationId } = req.body;

    if (!domain || !tenantId || !reservationId) {
      return res.status(400).json({
        error: "domain, tenantId and reservationId are required",
      });
    }

    const normalizedDomain = domain.trim().toLowerCase();

    // 🔐 Verify reservation with Go54
    const reservationCheck = await go54Client.get(
      `/domains/reservations/${reservationId}`
    );

    if (
      !reservationCheck.data ||
      reservationCheck.data.status !== "active"
    ) {
      return res.status(400).json({
        error: "Domain reservation not active",
      });
    }

    // 🏢 Find tenant
    const tenant = await Tenant.findOne({ tenantId });
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    // 🚫 Prevent duplicate domain usage
    const domainTaken = await Tenant.findOne({
      domain: normalizedDomain,
      tenantId: { $ne: tenantId },
    });

    if (domainTaken) {
      return res.status(400).json({
        error: "Domain already assigned to another tenant",
      });
    }

    // ✅ Update tenant
    tenant.domain = normalizedDomain;
    tenant.url = `https://${normalizedDomain}`;
    tenant.domainStatus = "pending_dns"; // recommended
    tenant.domainReservedAt = new Date();

    await tenant.save();

    return res.status(200).json({
      message: "Tenant domain updated successfully",
      tenant: {
        tenantId: tenant.tenantId,
        name: tenant.name,
        domain: tenant.domain,
        url: tenant.url,
        domainStatus: tenant.domainStatus,
      },
    });
  } catch (err) {
    console.error(
      "Update tenant domain error:",
      err.response?.data || err.message
    );
    return res.status(500).json({
      error: "Unable to update tenant domain",
    });
  }
});

module.exports = router;
