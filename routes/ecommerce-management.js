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
// -------------------- Product Routes --------------------
// Create, read, edit, delete products (all remain same)
router.post('/add-products', upload.single('image'), async (req, res) => {
  try {
    if (!req.session.user) return res.status(401).send('Unauthorized: Please log in.');

    const tenantId = req.session.user.tenantId;
    const { name, description, price, quantity, category, sku } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const product = new Product({
      tenantId,
      name,
      description,
      price: parseFloat(price),
      quantity: parseInt(quantity) || 0,
      category,
      sku,
      images: imagePath ? [imagePath] : []
    });

    await product.save();
    const allProducts = await Product.find({ tenantId });

    res.render('multitenant/dashboard-products', { message: 'Product created successfully!', user: req.session.user, products: allProducts });
  } catch (err) {
    console.error('❌ Error creating product:', err);
    res.status(500).send('Failed to create product.');
  }
});

// -------------------- Other Routes --------------------
// All axios calls replaced with `${API_BASE}/...`
// ... keep all your other routes as in your original code
// For example: /cart, /menu, /reservations, /tenant-auth calls

module.exports = router;
