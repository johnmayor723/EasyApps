const mongoose = require('mongoose');

// ---- Buying Option Subschema ----
const buyingOptionSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  sizes: {
    type: [String],
    default: [],
  },
  price: {
    type: Number,
  },
  colors: {
    type: [String],
    default: [],
  },
  image: {
    type: [String],
  },
  category: {
    type: String,
    trim: true,
  },
  subcategory: {
    type: String,
    trim: true,
  }
}, { _id: false }); // Prevents automatic _id creation for subdocuments

// ---- Preview Product Schema ----
const previewProductSchema = new mongoose.Schema({
  tenantId: {   // 👈 Multitenancy field
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant", // Refers to Tenant/Store schema
    required: true,
    index: true
  },
  name: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  size: {
    type: [String],
    default: [],
  },
  price: {
    type: Number,
  },
  colors: {
    type: [String],
    default: [],
  },
  images: {
    type: [String],
  },
  category: {
    type: String,
    trim: true,
  },
  subcategory: {
    type: String,
    trim: true,
  },
  buyingOptions: {
    type: [buyingOptionSchema],
    default: [],
  }
}, { timestamps: true });

// Ensure tenant-level queries are indexed
previewProductSchema.index({ tenantId: 1, category: 1, subcategory: 1 });

const PreviewProduct = mongoose.model('PreviewProduct', previewProductSchema);

module.exports = PreviewProduct;
