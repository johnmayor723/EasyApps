// index.js
require("dns").setDefaultResultOrder("ipv4first");
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const MongoStore = require("connect-mongo");
const session = require("express-session");
const path = require("path");
const flash = require("connect-flash");
const axios = require("axios");

const app = express();

/* =======================
   Routes
======================= */
const authRoutes = require("./api/routes/AuthRoute");
const productRoutes = require("./api/routes/productRoutes");
const orderRoutes = require("./api/routes/orderRoutes");
const cartRoutes = require("./api/routes/cartRoutes");
const categoryRoutes = require("./api/routes/categoryRoutes");
const blogRoutes = require("./api/routes/blogRoute");
const commentRoutes = require("./api/routes/commentRoute");
const tenantAuthRoutes = require("./api/routes/tenantAuthRoute");
const menuRoutes = require("./api/routes/MenuRoute");
const reservationRoutes = require("./api/routes/ReservationRoutes");
const paystackRoutes = require("./api/paystack/routes/paystack");
const domainRoutes = require("./api/routes/domain");

const clientMultitenantRouter = require("./routes/multitenant");
const clientRestaurantRouter = require("./routes/restaurant-management");

/* =======================
   Middleware / Config
======================= */
const connectDB = require("./api/config/database");
const tenantResolver = require("./api/middleware/tenantResolver");
const { platform } = require("os");

/* =======================
   App Config
======================= */
const PORT = process.env.PORT || 3000;
const DB =
  process.env.DB_URL 

/* =======================
   Database
======================= */
connectDB();

/* =======================
   View Engine
======================= */
app.set("view engine", "ejs");
// Disable EJS caching
app.set('view cache', false);

app.set("views", path.join(__dirname, "views"));
app.locals.basedir = path.join(__dirname, "views");

/* =======================
   Paystack Webhook
======================= */
app.use(
  "/paystack/webhook",
  express.raw({ type: "application/json" })
);

/* =======================
   Global Middleware
======================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

/* =======================
   Static Files
======================= */
app.use("/uploads", express.static("uploads"));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  "/multitenant",
  express.static(path.join(__dirname, "public/multitenant"))
);

/* =======================
   Sessions
======================= */
app.use(
  session({
    secret: process.env.SESSION_SECRET || "mysupersecret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: DB })
  })
);

/* =======================
   Flash & Globals
======================= */
app.use(flash());

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.session = req.session;
  
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
   res.locals.tenant = req.session.tenant || null;
  next();
});

/* =======================
   Cart Init
======================= */
app.use((req, res, next) => {
  if (!req.session.cart) {
    req.session.cart = {
      items: [],
      totalQty: 0,
      totalAmount: 0
    };
  }
  next();
});

/* =======================
   Request Logger
======================= */
app.use((req, res, next) => {
  console.log("REQ:", req.method, req.originalUrl);
  next();
});

/* =======================
   Dynamic Partials
======================= */
app.get("/partials/:name", async (req, res) => {
  const allowed = [
    "dashboard",
    "orders",
    "products",
    "customers",
    "chats",
    "design",
    "settings",
    "marketing",
    "create-product",
    "menu",
    "reservations",
    "tables",
    "overview",
    "createmenu"
  ];

  const { name } = req.params;

  if (!allowed.includes(name)) {
    return res.status(404).send("Partial not found");
  }

  try {

    const user = req.session.user || null;
    const tenant = req.session.tenant || null;

    let menu = [];

    // Only fetch menu if tenant exists AND partial needs menu
    if (tenant && tenant.tenantId && name === "menu") {

      const menuresponse = await axios.post(
        "http://easyhostnet.localhost:3000/api/menus/menus-by-tenant",
        { tenantId: tenant.tenantId }
      );

      menu = menuresponse.data.menus || [];
    }

    res.render(`partials/${name}-content`, {
      layout: false,
      user,
      tenant,
      menu,
      plan : tenant ? tenant.plan : 'null'  
    });

  } catch (err) {

    console.error("Partial load error:", err);

    res.render(`partials/${name}-content`, {
      layout: false,
      user: req.session.user || null,
      tenant: req.session.tenant || null,
      menu: []
    });

  }
});


/* =======================
   Client Routes
======================= */
app.use("/", clientMultitenantRouter);
app.use("/multitenant", clientMultitenantRouter);
app.use("/restaurant-management", clientRestaurantRouter);
app.use("/restaurants", clientRestaurantRouter);
app.use("/paystack", paystackRoutes);

/* =======================
   Health Check
======================= */
app.get("/health", (req, res) => {
  res.send("🚀 Multitenant Server running successfully!");
});

/* =======================
   API Routes
======================= */
app.use("/api/auth", authRoutes);
app.use("/api/tenant-auth", tenantAuthRoutes);
app.use("/api/products", tenantResolver, productRoutes);
app.use("/api/orders", tenantResolver, orderRoutes);
app.use("/api/carts", tenantResolver, cartRoutes);
app.use("/api/categories", tenantResolver, categoryRoutes);
app.use("/api/blogs", tenantResolver, blogRoutes);
app.use("/api/comments", tenantResolver, commentRoutes);
app.use("/api/menus", tenantResolver, menuRoutes);
app.use("/api/reservations", tenantResolver, reservationRoutes);
app.use("/api/domain", domainRoutes);


/* =======================
   Favicon Safety
======================= */
app.get("/favicon.ico", (_, res) => res.sendStatus(204));

/* =======================
   Start Server
======================= */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
