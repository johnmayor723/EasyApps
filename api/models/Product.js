const mongoose = require('mongoose');
const { Schema } = mongoose;

// Buying Options sub-schema
const buyingOptionSchema = new Schema({
  name: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  sizes: {
    type: [String],
    default: []
  },
  price: {
    type: Number,
  },
  colors: {
    type: [String],
    default: []
  },
  image: {
    type: [String],
    default: []
  }
}, { _id: false });

// Product schema with tenant reference
const productSchema = new Schema({
  tenantId: {
    type: String,
    required: true,
    index: true, // helps queries like Product.find({ tenantId })
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  size: {
    type: [String],
    default: []
  },
  price: {
    type: Number,
    required: true
  },
  colors: {
    type: [String],
    default: []
  },
  images: {
    type: [String],
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  subcategory: {
    type: String,
    required: false,
    trim: true
  },
  buyingOptions: {
    type: [buyingOptionSchema],
    default: []
  }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
