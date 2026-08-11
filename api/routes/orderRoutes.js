// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const dashboardAuth = require('../middleware/dashboardAuth');

// Route to create a Paystack session
router.post('/initialize', orderController.createPaystackSession);

// Route to create an order after successful payment (customer-facing, tenantResolver-scoped)
router.post('/', orderController.createOrder);

// Dashboard-facing routes (JWT-scoped to the authenticated tenant)
router.get('/', dashboardAuth, orderController.getAllOrders);
router.get('/:orderId', dashboardAuth, orderController.getOrderById);
router.put('/:orderId', dashboardAuth, orderController.updateOrderStatus);
router.delete('/:orderId', dashboardAuth, orderController.deleteOrder);

module.exports = router;
