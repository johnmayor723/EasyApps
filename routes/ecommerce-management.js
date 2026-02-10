const express = require("express");
const axios = require("axios");
const { loadTenant } = require("../middleware/tenantLoader");

const API_BASE = process.env.API_BASE || "http://easyhostnet.localhost:3000/api";
const router = express.Router();

// Home / All products page
router.get("/", loadTenant, async (req, res) => {
  try {
    const { tenantId } = req.session.tenant;

    // Fetch all products
    const productRes = await axios.get(`${API_BASE}/products`);
    const allProducts = productRes.data.products || [];

    // Filter by tenant
    const tenantProducts = allProducts.filter(p => p.tenantId === tenantId);

    res.render("ecommerce/home", {
      tenant: req.session.tenant,
      products: tenantProducts,
    });
  } catch (err) {
    console.error("Home page error:", err.message);
    res.render("ecommerce/home", {
      tenant: req.session.tenant,
      products: [],
    });
  }
});

// Single product page
router.get("/:id", loadTenant, async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.session.tenant;

    // Fetch all products and find by ID
    const productRes = await axios.get(`${API_BASE}/products`);
    const allProducts = productRes.data.products || [];
    const product = allProducts.find(p => String(p._id || p.id) === id && p.tenantId === tenantId);

    if (!product) return res.status(404).render("ecommerce/product", { tenant: req.session.tenant, product: null });

    res.render("ecommerce/product", {
      tenant: req.session.tenant,
      product,
    });
  } catch (err) {
    console.error("Single product page error:", err.message);
    res.render("ecommerce/product", {
      tenant: req.session.tenant,
      product: null,
    });
  }
});

module.exports = router;
