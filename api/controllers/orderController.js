const Order = require('../models/Order');
const Tenant = require('../models/Tenant');
const axios = require('axios');
const nodemailer = require('nodemailer');

// Function to create a new Paystack session
exports.createPaystackSession = async (req, res) => {
  const key = process.env.PAYSTACK_SECRET_KEY;
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
// Public/customer-facing: tenant comes from tenantResolver (Host header), not a login.
exports.createOrder = async (req, res) => {
  const { name, email, phone, shippingAddress, totalAmount, items } = req.body;

  if (!req.tenant) {
    return res.status(400).json({ error: 'Unable to resolve store for this order.' });
  }

  const newOrder = new Order({
    tenantId: req.tenant._id,
    customer: { name, email, phone },
    shippingAddress,
    items: items || [],
    totalAmount,
    status: 'processing',
  });

  try {
    const savedOrder = await newOrder.save();

    // Send confirmation email with order details
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.zeptomail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Order Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
          <h2 style="text-align: center; color: #0d9488;">Thank you for your order, ${name}!</h2>
          <p style="text-align: center;">Your order has been successfully created and is currently being processed. Here are your order details:</p>

          <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
            <tr>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Order ID</th>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${savedOrder.orderId}</td>
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
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order.' });
  }
};

// Everything below is dashboard-facing (dashboardAuth), scoped to the
// authenticated user's tenant. dashboardAuth gives us the tenant's string
// tenantId; Order.tenantId is an ObjectId ref, so resolve it once per request.
async function resolveTenantObjectId(req) {
  const tenant = await Tenant.findOne({ tenantId: req.tenantId }).select('_id');
  return tenant?._id || null;
}

exports.getAllOrders = async (req, res) => {
  try {
    const tenantObjectId = await resolveTenantObjectId(req);
    if (!tenantObjectId) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    const orders = await Order.find({ tenantId: tenantObjectId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve orders.' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const tenantObjectId = await resolveTenantObjectId(req);
    const order = await Order.findOne({ _id: req.params.orderId, tenantId: tenantObjectId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve the order.' });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const tenantObjectId = await resolveTenantObjectId(req);
    const order = await Order.findOneAndDelete({ _id: req.params.orderId, tenantId: tenantObjectId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    res.json({ message: 'Order deleted successfully.' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete the order.' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Allowed values are processing, shipped, delivered, or cancelled.' });
  }

  try {
    const tenantObjectId = await resolveTenantObjectId(req);
    const order = await Order.findOne({ _id: orderId, tenantId: tenantObjectId });
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
