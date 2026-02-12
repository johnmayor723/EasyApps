const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const router = express.Router();
const Product = require('../api/models/Product');
const FormData = require('form-data');
const nodemailer = require('nodemailer');

// 🔧 Mail transport (Zoho or replace with another SMTP)

/*
var transporter = nodemailer.createTransport({
    host: "smtp.zeptomail.com",
    port: 587,
    auth: {
    user: "emailapikey",
    pass: "wSsVR610qxD5WKkpn2f/Lro7mFhTDlqiHE5/3FD3un6uTPHCpcdqwhbOVlKuHvAaGTVrEzUToLl/kUgIhzJdhtguzAxTXSiF9mqRe1U4J3x17qnvhDzKW2tdlRKAJYgBwgxsmWBkE8wm+g=="
    }
});

// Verify SMTP connection
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP VERIFY FAILED:", error);
  } else {
    console.log("✅ SMTP READY");
  }
});*/

const API_BASE_URL = 'http://easyhostnet.localhost:3000/api/'


const transport = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'modigitman@gmail.com',
    pass: 'muwroruzgboqdfcd',
  }
});

transport.verify((err, success) => {
  if (err) console.log("❌ SMTP VERIFY FAILED:", err);
  else console.log("✅ SMTP Verified: Ready to send emails");
});

// ✉️ Utility: Send email
const sendEmail = async (to, subject, text) => {
  await transport.sendMail({
    from: `"EasyApps" <modigitman@gmail.com>`,
    to,
    subject,
    text,
  });
};




const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../public/uploads'); // ✅ go up one level
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});


const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only JPEG and PNG images are allowed.'));
    }
    cb(null, true);
  }
});



router.get("/", (req, res) => {
    res.render("multitenant/index", { layout: false });
});

router.post("/verify-otp", async (req, res) => {
  console.log("Received OTP verification request:", req.body);
  try {
    const { email, otp } = req.body;

    const response = await axios.post(
      "http://easyhostnet.localhost:3000/api/tenant-auth/verify-otp",
      { email, otp }
    );

    // ✅ Persist verified email in session
    req.session.email = email;

    // ✅ USE CORRECT FLASH KEYS
    req.flash(
      "success_msg",
      "OTP verified successfully. Please create your store."
    );
     console.log("Verified email saved in session:", req.session.email);
     console.log("Redirecting to create-store...");
    res.redirect("/multitenant/create-store");

  } catch (err) {
    console.error(err);

    req.flash(
      "error_msg",
      err.response?.data?.error || "Error verifying OTP"
    );

    res.redirect("/multitenant/sign-up");
  }
});

router.get("/multitenant/:tenantId/:slug", async (req, res) => {
  const { tenantId, slug } = req.params;

  try {
    /* -------------------------
       1. Resolve tenant
    -------------------------- */
    req.session.tenantId = tenantId; // ✅ Persist tenantId in session
    const tenantResponse = await axios.post(
      "http://localhost:3000/api/tenant-auth/get-one-tenant",
      { tenantId }
    );

    const tenant = tenantResponse.data?.tenant;
    console.log("Resolved tenant:", tenant);
    if (!tenant) {
      return res.status(404).render("errors/404");
    }

    // ✅ Normalize slugs (NO CRASH, NO FALSE 404)
    const dbSlug = (tenant.slug || "").toLowerCase().trim();
    const urlSlug = (slug || "").toLowerCase().trim();

    if (!dbSlug) {
      return res.status(404).send("Store slug not configured");
    }

    // 🔁 Redirect to canonical URL instead of 404
    if (dbSlug !== urlSlug) {
      return res.status(404).send("Store not found");
    }

    /* -------------------------
       2. Restaurant
    -------------------------- */
   if (tenant.type === "restaurant") {
  let menu = null;

  try {
    const response = await axios.post(
      "http://easyhostnet.localhost:3000/api/menus/menus-by-tenant",
      { tenantId }
    );

    const allMenus = response.data?.menus || [];
    const tenantMenus = allMenus.filter(m => m.tenantId === tenantId);

    menu = tenantMenus.length ? tenantMenus : null;

  } catch (err) {
    menu = null;
  }

  return res.render("multitenant/restaurant/home", {
    tenant,
    menu: menu ?? null, // 👈 GUARANTEED
  });
}


    /* -------------------------
       3. Ecommerce
    -------------------------- */
    if (tenant.type === "ecommerce") {
      let products = null;

      try {
        const productRes = await axios.get(
          "http://easyhostnet.localhost:3000/api/multitenant/products"
        );

        const allProducts = productRes.data?.products || [];

        const tenantProducts = allProducts.filter(
          p => p.tenantId === tenantId
        );

        products = tenantProducts.length ? tenantProducts : null;

      } catch (err) {
        products = null;
      }

      return res.render("multitenant/shop/home", {
        tenant,
        products,
      });
    }

    return res.status(400).render("errors/unsupported-business");

  } catch (err) {
    console.error("Tenant resolver error:", err.message);
    return res.status(500).render("errors/500");
  }
});
router.get("/shop/:tenantId/menu", async (req, res) => {
  console
  console.log("Accessing menu for tenant:", req.params.tenantId);
  const { tenantId } = req.params;

  try {
    const response = await axios.post(
      "http://easyhostnet.localhost:3000/api/menus/menus-by-tenant",
      { tenantId }
    );

    const menus = response.data?.menus || [];
    return res.render("multitenant/restaurant/menu", {
      tenant: req.session.tenant,
      menus,
    });
  } catch (err) {
    console.error("Error fetching menu:", err.message);
    return res.status(500).render("errors/500");
  }
});
router.get("/shop/:tenantId/reservations", async (req, res) => {
  console.log("Accessing reservations for tenant:", req.params.tenantId);

  const { tenantId } = req.params;

  try {
    const response = await axios.get(
      `http://easyhostnet.localhost:3000/api/reservations/tenant/${tenantId}`
    );

    const reservations = response.data?.reservations || [];

    return res.render("multitenant/restaurant/reservation", {
      tenant: req.session.tenant,
      reservations
    });
  } catch (err) {
    console.error("Error fetching reservations:", err.message);
    return res.status(500).render("errors/500");
  }
});

router.get("/shopp/:tenantId/reservations", (req, res) => {
  const { tenantId } = req.params;

  // Fetch reservations for the tenant
  axios.post("http://easyhostnet.localhost:3000/api/reservations/by-tenant", { tenantId })
    .then(response => {
      const reservations = response.data?.reservations || [];
      res.render("multitenant/restaurant/reservations", {
        tenant: req.session.tenant,
        reservations,
      });
    })
    .catch(err => {
      console.error("Error fetching reservations:", err.message);
      res.status(500).render("errors/500");
    });
}); 

const MY_API_BASE = "http://easyhostnet.localhost:3000/api";

// sendEmail is ALREADY configured in this router
// const sendEmail = async (to, subject, text) => { ... }

// --------------------
// CREATE RESERVATION (CLIENT)
// --------------------
router.post("/shop/:tenantId/reservations/create", async (req, res) => {
  const { tenantId } = req.params;
  console.log("Creating reservation for tenant:", tenantId);
  const {
    full_name,
    email,
    phone,
    party_size,
      date,
      time,
      special_requests
    } = req.body;
   console.log("Reservation data received:", req.body);
  try {
    /* -----------------------------
       1️⃣ GET TENANT (OWNER EMAIL)
    ------------------------------ */
    const tenantResponse = await axios.post(
      `${MY_API_BASE}/tenant-auth/get-one-tenant`,
      { tenantId }
    );
   console.log("Tenant data fetched:", tenantResponse.data);
    const ownerEmail = tenantResponse.data.tenant.owner.email

    if (!ownerEmail) {
      throw new Error("Tenant owner email not found");
    }

    /* -----------------------------
       2️⃣ CREATE RESERVATION
    ------------------------------ */
    const payload = {
      tenantId,
      full_name,
      email,
      phone,
      date,
      time,
      party_size: parseInt(party_size, 10),
      special_requests: special_requests || "",
      confirmed: true,
    };

    await axios.post(`${API_BASE}/reservations/create`, payload);

    /* -----------------------------
       3️⃣ SEND EMAIL NOTIFICATION
    ------------------------------ */
    const emailText = `
New Reservation Alert 🍽️

Customer Name: ${full_name}
Phone: ${phone}
Date: ${date}
Time: ${time}
Guests: ${party_size}

Notes: ${special_requests || "None"}

Login to your dashboard to manage this reservation.
`;

    await sendEmail(
      ownerEmail,
      "📅 New Reservation Received",
      emailText
    );

    /* -----------------------------
       4️⃣ REDIRECT CLIENT
    ------------------------------ */
    req.flash("success_msg", "Reservation created successfully");
    return res.redirect(`/multitenant/shop/${tenantId}/reservations`);

  } catch (err) {
    console.error("Reservation error:", err.message);
    req.flash("error_msg", "Error creating reservation");
    return res.redirect(`/multitenant/shop/${tenantId}/reservations`);
  }
});

//subcription success page
// routes/subscription.js

router.get("/subscription-success", (req, res) => {
  return res.render("subscription-success");
});



router.get("/adbeaconhope", (req, res) => {
  res.render("multitenant/adbeaconhope-signin", { layout: false });
});

router.post("/adbeaconhope", (req, res) => {
  console.log(req.body);
  const { email, password } = req.body;

  // Simple hardcoded authentication (replace with real logic)
  if (email === "adedoyinbeaconofhopefoundation@gmail.com" && password === "Hope2025") {
    // Redirect to admin page
    return res.redirect("https://www.adedoyinbeaconofhopefoundation.com.ng/management");
  } else {
    // If login fails
    res.send("Invalid credentials. Please try again with valid credentials.");
  }
});
router.get("/dashboard", (req, res) => {
    res.render("multitenant/tenant-dashboard", { layout: false });
});

router.get("/signup", (req, res) => {
    res.render("multitenant/signup", { layout: false });
});
router.get("/login", (req, res) => {
    res.render("multitenant/signin", { layout: false });
});







// POST request to send OTP
// POST request to send OTP
router.post("/request-otp", async (req, res) => {
  console.log("Received OTP request for email:", req.body.email);
  try {
    const { email } = req.body;

    if (!email) {
      req.flash("error_msg", "Email is required");
      return res.redirect("/multitenant/signup");
    }

    const response = await axios.post(
      "http://easyhostnet.localhost:3000/api/tenant-auth/request-otp",
      { email }
    );

    console.log(response.data);

    // ✅ Save email to session
    req.session.otpEmail = email;

    req.flash("success_msg", response.data.message);

    // ✅ No query string anymore
    res.redirect("/multitenant/post-otp");
  } catch (err) {
    console.error(err);

    req.flash(
      "error_msg",
      err.response?.data?.error || "Error sending OTP"
    );

    res.redirect("/multitenant/signup");
  }
});


// GET post-OTP page
// GET post-OTP page
router.get("/post-otp", (req, res) => {
  // ✅ Get email from session
  const email = req.session.otpEmail || "";

  // Optional: protect route
  if (!email) {
    req.flash("error_msg", "Session expired. Please request OTP again.");
    return res.redirect("/multitenant/signup");
  }

  const successMsg = Array.isArray(res.locals.success_msg)
    ? res.locals.success_msg[0]
    : res.locals.success_msg || null;

  const errorMsg = Array.isArray(res.locals.error_msg)
    ? res.locals.error_msg[0]
    : res.locals.error_msg || null;

  res.render("multitenant/post-otp", {
    layout: false,
    email,
    message: successMsg,
    error: errorMsg,
  });
});


// Render verify OTP page
router.get("/multitent/verify-otp", (req, res) => {
  res.render("multitenant/verify-otp", { message: null });
});

// Handle verify OTP form
router.post("/verify-otp", async (req, res) => {
  try {
    const {  otp } = req.body;
    const email = req.session.otpEmail;
    const response = await axios.post("http://easyhostnet.localhost:3000/api/tenant-auth/verify-otp", { email, otp });
    console.log(response.data);
   req.flash("success_msg", response.data.message);
    res.redirect("/multitenant/create-store");

  } catch (err) {
    req.flash(
      "error_msg",
      err.response?.data?.error || "Invalid OTP"
    );
    res.redirect(`/multitenant/verify-otp?email=${encodeURIComponent(email)}`);
  }
});

// create-store
// create-store
router.get("/create-store", (req, res) => {
  console.log("Accessing create-store route");
  console.log("Email from session:", req.session.email);
  if (!req.session.email) {

    req.flash("error_msg", "Please verify your email first.");
    return res.redirect("/multitenant/sign-up");
  }
   console.log("Email from session:", req.session.email);
  res.render("multitenant/create-store", {
    email: req.session.email
  });
});
router.get("/multitenant/select-domain", (req, res) => {
  res.render("multitenant/select-domain", { message: null, layout: false });
});
// Render complete signup page
router.get("/complete-signup", (req, res) => {
  console.log(req.session.user)
  res.render("multitenant/compareplans", { message: null });
});

// Handle complete signup form
router.post("/complete-signup", async (req, res) => {
  try {
    const { name, password, slug, domain, plan, type , address,
      city,
      state,
      country,
      zip
    } = req.body;

    // ✅ Create contact object from address fields
    const contact = {
      phone: phone || "",
      address: address || "",
      city: city || "",
      state: state || "",
      country: country || "",
      zip: zip || ""
    };

    const response = await axios.post(
      "http://easyhostnet.localhost:3000/api/tenant-auth/complete-signup",
      {
        name: name || slug,
        email: req.session.otpEmail,
        password,
        slug,
        type,
        contact,
        domain: domain || "",
        plan: plan || "free"
      }
    );

    const data = response.data;
    const { owner, tenant } = data;

    // ✅ Persist session
    req.session.user = owner;
    req.session.tenant = tenant;
    req.session.type = data.type;

    console.log("session user tenantId:", owner.tenantId);

    /* ------------------ SEND WELCOME EMAIL ------------------ */
    try {
      await sendEmail(
        owner.email,
        "Welcome to EasyApps 🎉 Your account is ready",
        `
Hi ${owner.name || "there"},

Welcome to EasyApps! 🎉  
Your account has been successfully created.

Next step: **Select a plan to activate your app.**

🔹 **Free Plan**
- Use a subdomain (yourbusiness.easyapps.app)
- Perfect for testing and getting started

🔹 **Pro Plan**
- Use your **custom domain**
- More control and a professional brand presence

You can upgrade anytime from your dashboard.

We’re excited to have you onboard 🚀  
— The EasyApps Team
        `
      );
    } catch (emailErr) {
      // ⚠️ Never fail signup because of email
      console.error("Welcome email failed:", emailErr.message);
    }

    /* ------------------ RENDER NEXT STEP ------------------ */
    res.render("multitenant/compareplans", {
      layout: false,
      message: data.message,
      data,
      email: owner.email
    });

  } catch (err) {
    console.error("Complete signup error:", err?.response?.data || err.message);

    res.render("signup/complete", {
      message: err.response?.data?.error || "Error completing signup"
    });
  }
});


router.post("/select-plan", async (req, res) => {
  try {
    const { plan, price, email } = req.body;

    // ✅ Free plan flow
    if (plan.toLowerCase() === "free") {
      const response = await axios.post("http:///easyhostnet.localhost:3000/api/tenant-auth/select-plan", {
        plan,
        price: 0, // force free price
        email
      });

      if (response.status === 200 || response.status === 201) {
        const tenantId = req.session.user.tenantId;
        console.log("Tenant ID for menu fetch:", tenantId);
        const menuresponse = await axios.post("http://easyhostnet.localhost:3000/api/menus/menus-by-tenant" , {
          tenantId
        });
        const menu = menuresponse.data.menus || [];
        req.session.menu = menu;
        console.log("Menu after free plan selection:", menu);
        return res.render("multitenant/tenant-dashboard",
          { data: response.data, menu, user: req.session.user, layout: false });
      }
     
      return res.status(response.status).send("Free plan selection failed.");
    }

    // 💳 Paid plan flow → render payment page
     const tenantId = req.session.user.tenantId;
    return res.render("multitenant/payment", { plan, email, price, tenantId, layout: false   });

  } catch (error) {
    console.error("❌ Select plan error:", error.message);

    if (error.response) {
      return res
        .status(error.response.status)
        .send(error.response.data?.error || "API error");
    }

    return res.status(500).send("Server error while selecting plan.");
  }
});

router.get("/compare-plans", (req, res) => {
    res.render("multitenant/compareplans", { layout: false });
})
router.get("/new-compare-plans", (req, res) => {
    const email = req.session.user ? req.session.user.email : null;
    console.log("Rendering new-compare-plans for email:", email);
    res.render("multitenant/compare-plans", { layout: false , email });
})

router.get("/enroll", (req, res) => {
    res.render("multitenant/enroll", { layout: false });
})


router.get("/signin", (req, res) => {
    res.render("multitenant/login", { layout: false });
});
//update branding





router.post("/update-branding", upload.single("logo"), async (req, res) => {
  try {
    const { logoUrl, themeColor, primaryColor, secondaryColor, email , ourStory } = req.body;
    console.log("Updating branding with:", { themeColor, email, file: req.file?.filename });

    let response;

    if (req.file) {
      // If a new logo is uploaded
      const form = new FormData();
      form.append("logo", fs.createReadStream(req.file.path));
      if (themeColor) form.append("themeColor", themeColor);
      if (primaryColor) form.append("primaryColor", primaryColor);
      if (secondaryColor) form.append("secondaryColor", secondaryColor);
      if (email) form.append("email", email);
      if (ourStory) form.append("ourStory", ourStory);

      response = await axios.post(
        "http://easyhostnet.localhost:3000/api/tenant-auth/update-branding",
        form,
        { headers: { ...form.getHeaders() } }
      );

      // Optional: clean up uploaded file after sending
      fs.unlink(req.file.path, (err) => {
        if (err) console.warn("Failed to delete temp file:", err);
      });
    } else {
      // No file uploaded, send JSON payload
      response = await axios.post(
        "http://easyhostnet.localhost:3000/api/tenant-auth/update-branding",
        { logoUrl, themeColor, primaryColor, secondaryColor, email, ourStory }
      );
    }

    console.log("Branding update response:", response.data);

    // Update session user with any new branding info
    if (response.data.user) {
      req.session.user = { ...req.session.user, ...response.data.user };
    }

    res.render("multitenant/tenant-dashboard", {
      message: response.data.message || "Branding updated successfully",
      layout: false,
      user: req.session.user,
    });
  } catch (err) {
    console.error("Branding update error:", err);

    res.render("multitenant/tenant-dashboard", {
      message: err.response?.data?.error || "Error updating branding",
      layout: false,
      user: req.session.user,
    });
  }
});

//module.exports = router;


// Handle email + password sign-in
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body);
    // Send to backend API
    const response = await axios.post("http:///easyhostnet.localhost:3000/api/tenant-auth/email-login", {
      email,
      password,
    });

    //console.log(response.data.user);
    const user = response.data.user;
    console.log("User data:", user);
    // ✅ Save user into session
    req.session.user = user;
    console.log("Session user:", req.session.user);

    // Render dashboard or success page after login
    res.render("multitenant/tenant-dashboard", { 
      message: response.data.message || "Login successful",
      email: email,
      layout: false,
      user
    });

  } catch (err) {
    console.error(err);

    // Render login page again with error message
    res.render("multitenant/signin", { 
      message: err.response?.data?.error || "Invalid credentials",
      layout: false 
    });
  }
});

router.get("/create-product", (req, res) => {
    const user = req.session.user;    
    res.render("multitenant/dashboard-createproducts", { user });
}); 


router.post('/add-products', upload.single('image'), async (req, res) => {
  console.log('Received product creation request:', req.body, req.file);

  try {
    // ✅ Ensure user is logged in
    if (!req.session.user) {
      return res.status(401).send('Unauthorized: Please log in.');
    }

    const tenantId = req.session.user.tenantId;
    const { name, description, price, quantity, category, sku } = req.body;

    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    console.log('✅ Uploaded image path:', imagePath);

    // ✅ Create new product
    const product = new Product({
      tenantId, // attach tenant ID from session
      name,
      description,
      price: parseFloat(price),
      quantity: parseInt(quantity) || 0,
      category,
      sku,
      images: imagePath ? [imagePath] : [] // ✅ Save as array
    });

    await product.save();

    console.log(`✅ Product created for tenant ${tenantId}:`, product);
     console.log(`✅ Product image created for tenant ${tenantId}:`, product.images[0]);

    // ✅ Fetch all products for the same tenant
    const allProducts = await Product.find({ tenantId });
    console.log(`Fetched ${allProducts.length} products for tenant ${tenantId}`);
    // ✅ Render the dashboard page with updated product list
    res.render('multitenant/dashboard-products', {
      message: 'Product created successfully!',
      user: req.session.user,
      products: allProducts
    });

  } catch (err) {
    console.error('❌ Error creating product:', err);
    res.status(500).send('Failed to create product.');
  }
});

router.get("/dashboard/products", async (req, res) => {
    try {
      const user = req.session.user;
      if (!user) {
        return res.redirect('/multitenant/signin');
      }

      // Fetch products for the tenant
      const products = await Product.find({ tenantId: user.tenantId });
      console.log(`Fetched ${products.length} products for tenant ${user.tenantId}`);

      res.render("multitenant/dashboard-products", { user, products });
    } catch (err) {
      console.error('❌ Error fetching products:', err);
      res.status(500).send('Failed to load products.');
    }
}); 

// ===== GET: Render Edit Product Page =====
router.get('/edit-product/:id', async (req, res) => {
  try {
    // Ensure user is logged in
    if (!req.session.user) {
      return res.status(401).send('Unauthorized: Please log in.');
    }

    const tenantId = req.session.user.tenantId;
    const productId = req.params.id;

    // Fetch the product for that tenant
    const product = await Product.findOne({ _id: productId, tenantId });

    if (!product) {
      return res.status(404).send('Product not found');
    }

    // Render the edit page (you’ll create this EJS file next)
    res.render('multitenant/edit-product', { user: req.session.user, product });
  } catch (err) {
    console.error('❌ Error fetching product for edit:', err);
    res.status(500).send('Failed to load edit page.');
  }
});

// ===== POST: Handle Product Edit =====
router.post('/edit-product/:id', upload.single('image'), async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).send('Unauthorized: Please log in.');
    }

    const tenantId = req.session.user.tenantId;
    const productId = req.params.id;
    const { name, description, price, quantity, category, sku } = req.body;

    // Build the update object
    const updateData = {
      name,
      description,
      price: parseFloat(price),
      quantity: parseInt(quantity) || 0,
      category,
      sku
    };

    // If a new image is uploaded, update it
    if (req.file) {
      const imagePath = `/uploads/${req.file.filename}`;
      updateData.$push = { images: imagePath }; // or replace with `images: [imagePath]` if you only keep one
    }

    const product = await Product.findOneAndUpdate(
      { _id: productId, tenantId },
      updateData,
      { new: true }
    );

    console.log(`✅ Product updated for tenant ${tenantId}:`, product);

    // Redirect back to the products dashboard
    res.redirect('/multitenant/dashboard-products');
  } catch (err) {
    console.error('❌ Error updating product:', err);
    res.status(500).send('Failed to update product.');
  }
});



// ===== POST: Delete Product =====
router.post('/delete-product/:id', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).send('Unauthorized: Please log in.');
    }

    const tenantId = req.session.user.tenantId;
    const productId = req.params.id;

    // Ensure product belongs to this tenant
    const product = await Product.findOneAndDelete({ _id: productId, tenantId });

    if (!product) {
      return res.status(404).send('Product not found or not authorized.');
    }

    console.log(`🗑️ Product deleted for tenant ${tenantId}: ${productId}`);

    res.redirect('/multitenant/dashboard-products');
  } catch (err) {
    console.error('❌ Error deleting product:', err);
    res.status(500).send('Failed to delete product.');
  }
});

router.post("/multinant/admin", (req, res) => {
    const user = req.session.user;
    console.log(user);
    if (!user) {
        return res.redirect('/multitenant/signin');
    }
    res.render("management/dashboard", { user });
});

router.get("/congratulations", (req, res) => {
    res.render("multitenant/congratulations", { layout: false });
});


// Store routes 

// ===============================
// Storefront Route
// ===============================

// single product route

router.get("/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    console.log(`🔍 Fetching product by ID: ${productId}`);

    // Find product by its _id
    const product = await Product.findById(productId);

    if (!product) {
      console.warn(`⚠️ Product not found: ${productId}`);
      return res.status(404).render("multitenant/store/not-found", {
        message: "Product not found"
      });
    }

    console.log(`✅ Product found: ${product.name}`);

    // Render product detail page
    res.render("multitenant/store/product-page", {
      title: `${product.name} Details`,
      product
    });
  } catch (err) {
    console.error("❌ Error fetching product:", err);
    res.status(500).render("multitenant/store/error", {
      message: "Error loading product details."
    });
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
    const productId = req.params.id;
    const qty = parseInt(req.body.qty) || 1;

    initializeCart(req);

    const product = await Product.findById(productId);
    if (!product) return res.status(404).send('Product not found');

    const cart = req.session.cart;

    // Check if product already in cart
    const existing = cart.items.find(i => i._id.toString() === productId);

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

    res.redirect('/cart');
  } catch (err) {
    console.error('❌ Error adding to cart:', err);
    res.status(500).send('Failed to add to cart.');
  }
});

// ===== Update item quantity =====
router.post('/cart/update/:id', (req, res) => {
  try {
    initializeCart(req);

    const productId = req.params.id;
    const action = req.body.action; // "increase" or "decrease"
    const cart = req.session.cart;

    const item = cart.items.find(i => i._id.toString() === productId);
    if (!item) return res.status(404).send('Item not found in cart');

    if (action === 'increase') item.qty++;
    else if (action === 'decrease') item.qty--;

    if (item.qty <= 0) {
      cart.items = cart.items.filter(i => i._id.toString() !== productId);
    } else {
      item.total = item.qty * item.price;
    }

    // Recalculate totals
    cart.totalQty = cart.items.reduce((acc, i) => acc + i.qty, 0);
    cart.totalPrice = cart.items.reduce((acc, i) => acc + i.total, 0);

    res.redirect('/cart');
  } catch (err) {
    console.error('❌ Error updating cart:', err);
    res.status(500).send('Failed to update cart.');
  }
});

// ===== View cart =====
router.get('/cart', (req, res) => {
  initializeCart(req);
  res.render('multitenant/store/cart', { cart: req.session.cart });
});

//restauarant routes
// Base API URL
const API_BASE = "http://easyhostnet.localhost:3000/api";

// Create menu
router.post("/create-menu", async (req, res) => {
  try {
    const payload = req.body;
    const response = await axios.post(`${API_BASE}/menu`, payload);
    res.json(response.data); // send backend response to client
  } catch (err) {
    console.error("Create menu error:", err.message);
    res.status(err.response?.status || 500).json({
      error: err.response?.data?.error || "Error creating menu",
    });
  }
});

// Fetch all menus
router.get("/menus", async (req, res) => {
  try {
    const { tenantId } = req.query;
    const response = await axios.get(`${API_BASE}/menus`, { params: { tenantId } });
    res.json(response.data);
  } catch (err) {
    console.error("Fetch all menus error:", err.message);
    res.status(err.response?.status || 500).json({
      error: err.response?.data?.error || "Error fetching menus",
    });
  }
});

// Update menu
router.put("/edit-menu/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const response = await axios.put(`${API_BASE}/menu/${id}`, payload);
    res.json(response.data);
  } catch (err) {
    console.error("Update menu error:", err.message);
    res.status(err.response?.status || 500).json({
      error: err.response?.data?.error || "Error updating menu",
    });
  }
});

// Delete menu
router.delete("/delete-menu/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.delete(`${API_BASE}/menu/${id}`);
    res.json(response.data);
  } catch (err) {
    console.error("Delete menu error:", err.message);
    res.status(err.response?.status || 500).json({
      error: err.response?.data?.error || "Error deleting menu",
    });
  }
});
//// Create reservation
router.post("/create", async (req, res) => {
  try {
    const response = await axios.post(
      `${API_BASE}/reservations`,
      req.body
    );

    res.json(response.data);
  } catch (err) {
    console.error("Create reservation error:", err.message);
    res.status(err.response?.status || 500).json({
      error: err.response?.data?.error || "Error creating reservation",
    });
  }
});

// Get all reservations for a tenant
router.get("/tenant/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;

    const response = await axios.get(
      `${API_BASE}/reservations/tenant/${tenantId}`
    );

    res.json(response.data);
  } catch (err) {
    console.error("Fetch reservations by tenant error:", err.message);
    res.status(err.response?.status || 500).json({
      error: err.response?.data?.error || "Error fetching reservations",
    });
  }
});

// Get single reservation
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const response = await axios.get(
      `${API_BASE}/reservations/${id}`
    );

    res.json(response.data);
  } catch (err) {
    console.error("Fetch reservation error:", err.message);
    res.status(err.response?.status || 500).json({
      error: err.response?.data?.error || "Error fetching reservation",
    });
  }
});

// Update reservation
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const response = await axios.put(
      `${API_BASE}/reservations/${id}`,
      req.body
    );

    res.json(response.data);
  } catch (err) {
    console.error("Update reservation error:", err.message);
    res.status(err.response?.status || 500).json({
      error: err.response?.data?.error || "Error updating reservation",
    });
  }
});

// Delete reservation
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const response = await axios.delete(
      `${API_BASE}/reservations/${id}`
    );

    res.json(response.data);
  } catch (err) {
    console.error("Delete reservation error:", err.message);
    res.status(err.response?.status || 500).json({
      error: err.response?.data?.error || "Error deleting reservation",
    });
  }
});
//restaurant app routes

module.exports = router;
