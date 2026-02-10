// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Route to create a Paystack session
router.post('/initialize', orderController.createPaystackSession);

// Route to create an order after successful payment
router.post('/', orderController.createOrder);

// Route to get all orders
router.get('/', orderController.getAllOrders)
//Route to get one order
router.get('/:orderId', orderController.getOrderById);


// Route to update order status
router.put('/:orderId', orderController.updateOrderStatus);
// Route to delete order status
router.delete('/:orderId', orderController.deleteOrder);



// Route to track an order by unique ID
router.get('/:uniqueId', orderController.trackOrder);

module.exports = router;
