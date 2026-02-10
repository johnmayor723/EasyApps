const Order = require('../models/Order');
const axios = require('axios');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

// Function to create a new Paystack session
exports.createPaystackSession = async (req, res) => {
  const key = "sk_test_d754fb2a648e8d822b09aa425d13fc62059ca08e";
  const { email, amount } = req.body;

  try {
    const response = await axios.post('https://api.paystack.co/transaction/initialize', {
      email,
      amount,
    }, {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });

    res.json({ authUrl: response.data.data.authorization_url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create Paystack session.' });
  }
};

// Function to create a new order after payment is completed
exports.createOrder = async (req, res) => {
  const { name, email, shippingAddress, totalAmount } = req.body;

  const newOrder = new Order({
    name,
    email,
    shippingAddress,
    totalAmount,
   
    status: 'processing',
    uniqueId: uuidv4(),
  });

  try {
    const savedOrder = await newOrder.save();

    // Send confirmation email with order details
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'fooddeck3@gmail.com',
        pass: 'xyca sbvx hifi amzs',
      },
    });

    const mailOptions = {
      from: 'support@marketspick.com',
      to: email,
      subject: 'Order Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
          <div style="text-align: center; padding: 10px 0;">
            <img src="https://firebasestorage.googleapis.com/v0/b/fooddeck-fc840.appspot.com/o/mfico.jpg?alt=media&token=eefddae4-e98f-46cf-a375-515d8688eb55" alt="Company Logo" style="width: 150px;">
          </div>
          <h2 style="text-align: center; color: #4CAF50;">Thank you for your order, ${name}!</h2>
          <p style="text-align: center;">Your order has been successfully created and is currently being processed. Here are your order details:</p>
          
          <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
            <tr>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Order ID</th>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${savedOrder.uniqueId}</td>
            </tr>
            <tr>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Shipping Address</th>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${shippingAddress}</td>
            </tr>
            <tr>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Total Amount</th>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">₦${totalAmount}</td>
            </tr>
            <tr>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Status</th>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${savedOrder.status}</td>
            </tr>
          </table>
          
          <p style="text-align: center; font-weight: bold; margin-top: 20px;">We appreciate your business!</p>

          <div style="margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px; text-align: center; font-size: 12px; color: #666;">
            <p>Contact us: <a href="mailto:support@company.com">support@company.com</a></p>
            <p>Visit our website: <a href="https://companywebsite.com">www.companywebsite.com</a></p>
            <p>&copy; ${new Date().getFullYear()} Company Name. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
      } else {
        console.log('Order confirmation email sent:', info.response);
      }
    });

    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order.' });
  }
};

// Function to get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve orders.' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
      console.log("reached this route")
      console.log(req.params.orderId)
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    res.json(order);
  } catch (error) {
      console.log("error:", error)
    res.status(500).json({ error: 'Failed to retrieve the order.' });
  }
};

// delete ordeer

exports.deleteOrder = async (req, res) => {
  try {
    console.log("Deleting order with ID:", req.params.orderId);

    const order = await Order.findByIdAndDelete(req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    res.json({ message: 'Order deleted successfully.' });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ error: 'Failed to delete the order.' });
  }
};

// Function to get and update order status by ID
exports.updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const validStatuses = ['shipped', 'delivered', 'processing'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Allowed values are shipped, delivered, or processing.' });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    order.status = status;
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status.' });
  }
};

// Function to track an order by unique ID
exports.trackOrder = async (req, res) => {
  const { uniqueId } = req.params;

  try {
    const order = await Order.findOne({ uniqueId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    res.json({ status: order.status, order });
  } catch (error) {
    res.status(500).json({ error: 'Failed to track order.' });
  }
};
