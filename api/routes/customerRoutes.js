const express = require('express');
const router = express.Router();
const dashboardAuth = require('../middleware/dashboardAuth');
const customerController = require('../controllers/customerController');

router.get('/', dashboardAuth, customerController.getCustomers);
router.get('/:id', dashboardAuth, customerController.getCustomerById);

module.exports = router;
