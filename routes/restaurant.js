const express = require('express');
const axios = require('axios');
const { loadTenant } = require('../middleware/tenantLoader');

const API_BASE = process.env.API_BASE || 'http://easyhostnet.localhost:3000/api';

const router = express.Router();

// GET /restaurants - list all restaurants
router.get("/", loadTenant, async (req, res) => {
  try {
    const { tenantId } = req.session.tenant;

    // Fetch all menus from API
    const menuRes = await axios.get(`${API_BASE}/menus`);
    const allMenus = menuRes.data.menus || [];

    // Filter menus for the current tenant
    const tenantMenus = allMenus.filter(menu => menu.tenantId === tenantId);

    res.render("restaurant/home", {
      tenant: req.session.tenant,
      menus: tenantMenus,
    });
  } catch (err) {
    console.error("Homepage error:", err.message);

    res.render("../multitenant/restaurant/home", {
      tenant: req.session.tenant,
      menus: [],
    });
  }
});

router.get("/:tenantId/menu", async (req, res) => {
  console.log("Rendering menu page");
  console.log("Accessing menu for tenant:", req.params.tenantId);
  const { tenantId } = req.params;

  try {
    const response = await axios.post(
      "http://easyhostnet.localhost:3060/api/menus/menus-by-tenant",
      { tenantId }
    );

    const menu = response.data?.menus || [];
    return res.render("multitenant/restaurant/menu", {
      tenant: req.session.tenant,
      menu,
    });
  } catch (err) {
    console.error("Error fetching menu:", err.message);
    return res.status(500).render("errors/500");
  }
});

//subcription success page
// routes/subscription.js


// menu page
router.get("/menu", loadTenant, async (req, res) => {
  try {
    const { tenantId } = req.session.tenant;

    // Fetch all menus from API
    const menuRes = await axios.get(`${API_BASE}/menus`);
    const allMenus = menuRes.data.menus || [];

    // Filter menus for the current tenant
    const tenantMenus = allMenus.filter(menu => menu.tenantId === tenantId);

    res.render("restaurant/menu", {
      tenant: req.session.tenant,
      menus: tenantMenus,
    });
  } catch (err) {
    console.error("Homepage error:", err.message);

    res.render("../multitenant/restaurant/home", {
      tenant: req.session.tenant,
      menus: [],
    });
  }
});

// reservation page

router.get("/", loadTenant, async (req, res) => {
  try {
    const { tenantId } = req.session.tenant;

    // Fetch all reservations
    const resRes = await axios.get(`${API_BASE}/reservations`);
    const allReservations = resRes.data.reservations || [];

    // Filter reservations for current tenant
    const tenantReservations = allReservations.filter(
      reservation => reservation.tenantId === tenantId
    );

    res.render("restaurant/reservation", {
      tenant: req.session.tenant,
      reservations: tenantReservations,
    });
  } catch (err) {
    console.error("Reservation page error:", err.message);

    res.render("restaurant/reservation", {
      tenant: req.session.tenant,
      reservations: [],
    });
  }
});

// CART routes and helpers
const ensureSessionCart = (req) => {
  req.session.cart = req.session.cart || {};
  const tenantId = req.session.tenant.tenantId;
  req.session.cart[tenantId] = req.session.cart[tenantId] || { items: [], totalQty: 0, totalPrice: 0 };
  return req.session.cart[tenantId];
};

const recalcCart = (cart) => {
  cart.totalQty = cart.items.reduce((s, it) => s + it.qty, 0);
  cart.totalPrice = cart.items.reduce((s, it) => s + it.qty * it.price, 0);
};

// add item to cart (or increase if exists)
// expects body: { menuId, qty } (qty optional, defaults to 1)
router.post("/cart/add", loadTenant, async (req, res) => {
  try {
    const { menuId, qty = 1 } = req.body;
    if (!menuId) return res.status(400).json({ error: "menuId required" });

    // get menu details from API (fetch all and find to be compatible with simple APIs)
    const menuRes = await axios.get(`${API_BASE}/menus`);
    const allMenus = menuRes.data.menus || [];
    const menu = allMenus.find(m => String(m.id || m._id) === String(menuId));
    if (!menu) return res.status(404).json({ error: "Menu item not found" });

    const cart = ensureSessionCart(req);
    const existing = cart.items.find(it => String(it.id) === String(menuId));
    if (existing) {
      existing.qty += Number(qty);
    } else {
      cart.items.push({
        id: String(menuId),
        name: menu.name || menu.title || "Unknown",
        price: Number(menu.price || 0),
        qty: Number(qty),
      });
    }
    recalcCart(cart);
    req.session.save?.(() => {}); // best-effort save

    return res.json({ cart });
  } catch (err) {
    console.error("Add to cart error:", err.message);
    return res.status(500).json({ error: "Failed to add to cart" });
  }
});

// increase quantity by 1
router.post("/cart/increase/:id", loadTenant, (req, res) => {
  try {
    const menuId = req.params.id;
    const cart = ensureSessionCart(req);
    const item = cart.items.find(it => it.id === String(menuId));
    if (!item) return res.status(404).json({ error: "Item not in cart" });

    item.qty += 1;
    recalcCart(cart);
    req.session.save?.(() => {});

    return res.json({ cart });
  } catch (err) {
    console.error("Increase cart error:", err.message);
    return res.status(500).json({ error: "Failed to increase item" });
  }
});

// decrease quantity by 1 (remove if qty <= 0)
router.post("/cart/decrease/:id", loadTenant, (req, res) => {
  try {
    const menuId = req.params.id;
    const cart = ensureSessionCart(req);
    const idx = cart.items.findIndex(it => it.id === String(menuId));
    if (idx === -1) return res.status(404).json({ error: "Item not in cart" });

    cart.items[idx].qty -= 1;
    if (cart.items[idx].qty <= 0) cart.items.splice(idx, 1);

    recalcCart(cart);
    req.session.save?.(() => {});

    return res.json({ cart });
  } catch (err) {
    console.error("Decrease cart error:", err.message);
    return res.status(500).json({ error: "Failed to decrease item" });
  }
});

// remove single item from cart
router.post("/cart/remove/:id", loadTenant, (req, res) => {
  try {
    const menuId = req.params.id;
    const cart = ensureSessionCart(req);
    cart.items = cart.items.filter(it => it.id !== String(menuId));
    recalcCart(cart);
    req.session.save?.(() => {});

    return res.json({ cart });
  } catch (err) {
    console.error("Remove cart item error:", err.message);
    return res.status(500).json({ error: "Failed to remove item" });
  }
});

// clear entire cart for current tenant
router.post("/cart/clear", loadTenant, (req, res) => {
  try {
    const tenantId = req.session.tenant.tenantId;
    req.session.cart = req.session.cart || {};
    req.session.cart[tenantId] = { items: [], totalQty: 0, totalPrice: 0 };
    req.session.save?.(() => {});

    return res.json({ cart: req.session.cart[tenantId] });
  } catch (err) {
    console.error("Clear cart error:", err.message);
    return res.status(500).json({ error: "Failed to clear cart" });
  }
});

// view cart
router.get("/cart", loadTenant, (req, res) => {
  try {
    const cart = ensureSessionCart(req);
    return res.render("restaurant/cart", { tenant: req.session.tenant, cart });
  } catch (err) {
    console.error("View cart error:", err.message);
    return res.render("restaurant/cart", { tenant: req.session.tenant, cart: { items: [], totalQty: 0, totalPrice: 0 } });
  }
});

// whatsapp order
router.post("/cart/whatsapp-order", loadTenant, (req, res) => {
  try {
    const cart = ensureSessionCart(req);
    if (cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const tenant = req.session.tenant;
    let message = `Hello ${tenant.name || 'there'}, I would like to place an order:\n\n`;
    cart.items.forEach(item => {
      message += `- ${item.name} x${item.qty} = $${(item.price * item.qty).toFixed(2)}\n`;
    });
    message += `\nTotal: $${cart.totalPrice.toFixed(2)}\n\nThank you!`;

    const whatsappNumber = tenant.whatsappNumber || tenant.contactNumber || '';
    const whatsappLink = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

    // Clear cart after order
    req.session.cart[tenant.tenantId] = { items: [], totalQty: 0, totalPrice: 0 };
    req.session.save?.(() => {});

    return res.json({ whatsappLink });
  } catch (err) {
    console.error("WhatsApp order error:", err.message);
    return res.status(500).json({ error: "Failed to create WhatsApp order" });
  }
});


module.exports = router;