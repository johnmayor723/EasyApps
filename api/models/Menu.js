const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  available: {
    type: String,
    enum: ["true", "false"],
    required: true,
    default: "true",
  },
  tenantId: {
    type: String,
    required: true,
    index: true, // helps queries like Product.find({ tenantId })
  },
  image: { type: String } // could store file path or URL
}, { timestamps: true });

module.exports = mongoose.model('Menu', menuSchema);
