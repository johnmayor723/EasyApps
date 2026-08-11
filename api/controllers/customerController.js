const User = require('../models/User');
const Order = require('../models/Order');

// Customers for the authenticated tenant (req.tenantId set by dashboardAuth).
exports.getCustomers = async (req, res) => {
  try {
    const customers = await User.find({
      tenantId: req.tenantId,
      roles: { $nin: ['tenant_admin'] },
    })
      .select('name email phoneNumber roles isVerified createdAt')
      .sort({ createdAt: -1 });

    res.json({ count: customers.length, customers });
  } catch (err) {
    console.error('Get customers error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const customer = await User.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    }).select('name email phoneNumber roles isVerified createdAt addresses');

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const orders = await Order.find({ 'customer.email': customer.email })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ customer, orders });
  } catch (err) {
    console.error('Get customer error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
