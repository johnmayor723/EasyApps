const express = require("express");
const router = express.Router();
const Tenant = require("../api/models/Tenant"); 
const Product = require("../api/models/Product");


// Storefront route
router.get("/featured/:tenantId/", async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ tenantId: req.params.tenantId });
    req.session.tenant = tenant; // Store tenant in session for later use
    if (!tenant) {
      return res.status(404).send("Tenant not found");
    }
    console.log("Fetched tenant for store:", tenant);
    const name = tenant.name || "Store";
    const email = tenant.owner?.email || "N/A";
    const products = await Product.find({ tenantId: tenant.tenantId});
    console.log("Fetched products for tenant:", products, products.length);
    console.log("Tenant contact info:", tenant.contact);
    console.log("Tenant name:", tenant.name);
    res.render("multitenant/store/featured", { tenant, products, name, contact: tenant.contact || "N/A", email });
  } catch (error) {
    console.error("Error fetching tenant/store:", error);
    res.status(500).send("Internal Server Error");
  }
});
router.get('/product/:productId', async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    const sessionTenant = req.session.tenant;
    const tenant = await Tenant.findOne({ tenantId: sessionTenant.tenantId });
     const name = tenant.name || "Store";
    const email = tenant.owner?.email || "N/A";
    
    if (!product) {
      return res.status(404).send("Product not found");
    }
    res.render('multitenant/store/product', { product, tenant, name, email, contact: tenant.contact || "N/A" });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).send("Internal Server Error");
  }
});
module.exports = router;
