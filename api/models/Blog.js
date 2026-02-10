// models/Blog.js
const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  content: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const BlogSchema = new mongoose.Schema({
  tenantId: {   // 👈 Multitenancy field
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
    index: true
  },
  title: { type: String, required: true, trim: true },
  author: { type: String, trim: true },
  image: { type: String, required: true }, // Store image URL
  intro: { type: String, required: true, trim: true },
  
  // Content paragraphs (kept flexible)
  para1: { type: String, trim: true },
  para2: { type: String, trim: true },
  para3: { type: String, trim: true },
  para4: { type: String, trim: true },
  para5: { type: String, trim: true },
  para6: { type: String, trim: true },
  para7: { type: String, trim: true },
  para8: { type: String, trim: true },
  para9: { type: String, trim: true },
  para10: { type: String, trim: true },
  para11: { type: String, trim: true },
  para12: { type: String, trim: true },
  para13: { type: String, trim: true },
  para14: { type: String, trim: true },
  para15: { type: String, trim: true },
  para16: { type: String, trim: true },
  para17: { type: String, trim: true },
  para18: { type: String, trim: true },
  para19: { type: String, trim: true },
  para20: { type: String, trim: true },
  
  comments: {
    type: [CommentSchema],
    default: []
  },
  createdAt: { type: Date, default: Date.now }
});

// Index tenant + createdAt for efficient filtering
BlogSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model('Blog', BlogSchema);
