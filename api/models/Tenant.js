// models/Tenant.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const TenantSchema = new Schema({
  tenantId: {
    type: String,
    unique: true,
    required: true,
  },

  name: {
    type: String,
    required: true,
    trim: true,
  },

  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  url: {
    type: String,
    required: true,
    trim: true,
  },

  ourStory: {
    type: String,
    trim: true,
  },

  type: {
    type: String,
    enum: [
      'restaurant', 'ecommerce', 'blog',
      'portfolio', 'saas', 'education',
      'nonprofit', 'agency', 'freelancer',
      'school', 'saloon-spa', 'fitness',
      'real-estate', 'event', 'travel',
      'technology', 'finance', 'legal',
      'marketing', 'media', 'entertainment',
      'fashion', 'food-beverage', 'automotive',
      'hospital', 'others', 'individual'
    ],
    required: true,
  },

  // 🌍 Custom domain
  domain: {
    name: { type: String, trim: true },
    status: { type: String, enum: ['available', 'pending', 'confirmed'], default: '' },
  },

  // 👤 Registrant / domain contact (optional)
  domainContact: {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    address1: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postcode: { type: String, trim: true },
    country: { type: String, trim: true, default: 'NG' },
  },
contact: {
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "" },
    zip: { type: String, default: "" }
  },
  address: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    trim: true,
  },
  state: {
    type: String,
    trim: true,
  },
  country: {
    type: String,
    trim: true,
  },
  zip: {
    type: String,
    trim: true,
  },
  owner: {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
  },

  plan: {
    type: String,
    enum: ['growth', 'free', 'pro', 'bumpa'],
    default: 'free',
  },
  planStatus: {
  type: String,
  enum: ["inactive", "active"],
  default: "inactive",
},
paystackRef: String,
paidAt: Date,

  branding: {
    logoUrl: { type: String, default: '' },
    primaryColor: { type: String, default: '#000000' },
    secondaryColor: { type: String, default: '#FFFFFF' },
    theme: { type: String, default: 'default' },
  },

  settings: {
    type: Schema.Types.Mixed,
    default: {},
  },

  customers: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model('Tenant', TenantSchema);
