const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { Schema } = mongoose;

// 🧾 Order Item sub-schema (optional, allows multiple items per order)
const orderItemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
  },
  name: String,
  quantity: {
    type: Number,
    default: 1,
  },
  price: Number,
}, { _id: false });

// 🏦 Main Order Schema
const orderSchema = new Schema({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true, // helps with filtering by tenant
  },
  orderId: {
    type: String,
    unique: true,
    default: uuidv4,
  },
  customer: {
    name: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
  },
  shippingAddress: {
    type: String,
    trim: true,
  },
  items: {
    type: [orderItemSchema],
    default: [],
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['processing', 'shipped', 'delivered', 'cancelled'],
    default: 'processing',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
