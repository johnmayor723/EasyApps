const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const API_BASE = 'http://easyhostnet.localhost:3000/api';

// ------------------- MULTER SETUP -------------------

const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// ------------------- CREATE MENU -------------------

router.get('/create-menu', (req, res) => {
  res.render('create-menu');
});

router.post('/create-menu', upload.single('image'), async (req, res) => {
  try {
    const { name, description, category, price, available, tenantId } = req.body;

    const payload = {
      name,
      description,
      category,
      price: parseFloat(price),
      available,
      tenantId,
      image: req.file ? `/uploads/${req.file.filename}` : ''
    };

    await axios.post(`${API_BASE}/menus/create-menu`, payload);

    const menusRes = await axios.post(
      `${API_BASE}/menus/menus-by-tenant`,
      { tenantId }
    );

    res.render('multitenant/dashboard-menu', {
      menus: menusRes.data.menus,
      successMessage: 'Menu created successfully',
      errorMessage: null
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/dashboard-menu', async (req, res) => {
  try {
    const tenantId = req.session.user.tenantId;

    const response = await axios.post(
      `${API_BASE}/menus/menus-by-tenant`,
      { tenantId }
    );

    res.render('multitenant/dashboard-menu', {
      menus: response.data.menus
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ------------------- GET MENUS BY TENANT -------------------

router.get('/menus/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;

    const response = await axios.post(
      `${API_BASE}/menus/menus-by-tenant`,
      { tenantId }
    );

    res.render('multitenant/dashboard-menu', {
      menus: response.data.menus
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ------------------- EDIT MENU (RENDER) -------------------

router.get('/menu/:id/edit', async (req, res) => {
  try {
    const { id } = req.params;

    const response = await axios.get(`${API_BASE}/menus/${id}`);

    res.render('multitenant/dashboard -edit-menu', {
      menu: response.data.menu
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ------------------- EDIT MENU (SUBMIT) -------------------

router.post('/menu/:id/edit', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, price, available, tenantId } = req.body;

    const payload = {
      name,
      description,
      category,
      price: parseFloat(price),
      available,
      tenantId
    };

    if (req.file) {
      payload.image = `/uploads/${req.file.filename}`;
    }

    const response = await axios.put(`${API_BASE}/menus/edit-menu/${id}`, payload);
    const updatedMenu = response.data.menu;
    console.log('Updated Menu:', updatedMenu);
    req.session.menu = response.data.menu;
    req.flash('success_msg', 'Menu updated successfully');
    res.redirect('/restaurant-management/dashboard-menu');
  } catch (err) {
    console.error(err.message);
    req.flash('error_msg', 'Failed to update menu');
    res.redirect('/restaurant-management/dashboard-menu');
  }
});

// ------------------- DELETE MENU -------------------

router.get('/menu/:id/delete/', async (req, res) => {
  try {
    const { id} = req.params;
    const tenantId = req.session.user.tenantId;
    console.log('Deleting menu with ID:', id);
    console.log('Tenant ID:', tenantId);
    await axios.delete(`${API_BASE}/menus/delete-menu/${id}`);

    const menusRes = await axios.post(
      `${API_BASE}/menus/menus-by-tenant`,
      { tenantId }
    );
    console.log('Menus after deletion:', menusRes.data);
    req.session.menu = null;
    req.session.menus = menusRes.data.menu
    req.flash('success_msg', 'Menu deleted successfully');
    res.redirect('/restaurant-management/dashboard-menu');
  } catch (err) {
   req.flash('error_msg', 'Failed to delete menu');
    res.redirect('/restaurant-management/dashboard-menu');
  }
});

// ------------------- RESERVATIONS -------------------

router.get('/create-reservation', (req, res) => {
  res.render('create-reservation');
});

router.post('/create-reservation', async (req, res) => {
  try {
    const {
      tenantId,
      customerName,
      phone,
      date,
      time,
      guests,
      table,
      notes,
      confirmed
    } = req.body;

    const payload = {
      tenantId,
      customerName,
      phone,
      date,
      time,
      guests: parseInt(guests),
      table: table || null,
      notes: notes || '',
      confirmed: confirmed === 'on'
    };

    await axios.post(`${API_BASE}/reservations/create`, payload);

    res.redirect(`/restaurant-management/reservations/${tenantId}`);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/reservations/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;

    const response = await axios.get(
      `${API_BASE}/reservations/tenant/${tenantId}`
    );

    res.render('reservation-dashboard', {
      data: response.data
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/reservation/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const response = await axios.get(`${API_BASE}/reservations/${id}`);

    res.render('edit-reservation', {
      reservation: response.data.reservation
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/edit-reservation/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tenantId,
      customerName,
      phone,
      date,
      time,
      guests,
      table,
      notes,
      confirmed
    } = req.body;

    const payload = {
      tenantId,
      customerName,
      phone,
      date,
      time,
      guests: parseInt(guests),
      table: table || null,
      notes: notes || '',
      confirmed: confirmed === 'on'
    };

    await axios.put(`${API_BASE}/reservations/${id}`, payload);

    res.redirect(`/restaurant-management/reservations/${tenantId}`);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/delete-reservation/:id/:tenantId', async (req, res) => {
  try {
    const { id, tenantId } = req.params;

    await axios.delete(`${API_BASE}/reservations/${id}`);

    res.redirect(`/restaurant-management/reservations/${tenantId}`);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
