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
// cart route
 // ===== Initialize cart helper =====
function initializeCart(req) {
  if (!req.session.cart) {
    req.session.cart = { items: [], totalQty: 0, totalPrice: 0 };
  }
}

// ===== Add to cart =====
router.post('/cart/add/:id', async (req, res) => {
  try {
    console.log('Add to cart request for product ID:', req.params.id, 'with qty:', req.body.qty);
    const Id =  req.params.id; // Fallback to URL param if session doesn't have it
    const qty = parseInt(req.body.qty) || 1;
    const storeId = req.query.tenantId || req.session.storeId; // Try query param first, then session
    console.log('Resolved tenant ID for cart:', storeId);
    initializeCart(req);

    const product = await Product.findById(Id);
    if (!product) return res.status(404).send('Product not found');

    const cart = req.session.cart;

    // Check if product already in cart
    const existing = cart.items.find(i => i._id.toString() === Id);

    if (existing) {
      existing.qty += qty;
      existing.total = existing.qty * existing.price;
    } else {
      cart.items.push({
        _id: product._id,
        name: product.name,
        price: product.price,
        image: product.images?.[0],
        qty: qty,
        total: product.price * qty
      });
    }

    // Recalculate totals
    cart.totalQty = cart.items.reduce((acc, i) => acc + i.qty, 0);
    cart.totalPrice = cart.items.reduce((acc, i) => acc + i.total, 0);

    console.log('🛒 Cart updated:', cart);
    req.session.cart = cart; // Save back to session
    res.redirect(`/store/product/${Id}`);
  } catch (err) {
    console.error('❌ Error adding to cart:', err);
    res.status(500).send('Failed to add to cart.');
  }
});
router.post("/cart/update/:id", (req, res) => {

  const { id } = req.params;
  const { change } = req.body;

  if (!req.session.cart) {

    return res.json({ success: false });

  }

  const item = req.session.cart.items.find(i => i._id === id);

  if (!item) {

    return res.json({ success: false });

  }

  item.qty += change;

  if (item.qty <= 0) {

    req.session.cart.items =
      req.session.cart.items.filter(i => i._id !== id);

  }
  else {

    item.total = item.qty * item.price;

  }


  // recalc totals
  req.session.cart.totalQty =
    req.session.cart.items.reduce((sum, i) => sum + i.qty, 0);

  req.session.cart.totalPrice =
    req.session.cart.items.reduce((sum, i) => sum + i.total, 0);


  res.json({
    success: true,
    cart: req.session.cart
  });

});


module.exports = router;
