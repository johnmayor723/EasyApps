const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true
    },

    full_name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    party_size: {
      type: String, // "1–2", "3–4", "5–6"
      required: true
    },

    date: {
      type: Date,
      required: true
    },

    time: {
      type: String, // "HH:mm"
      required: true
    },

    special_requests: {
      type: String,
      default: ''
    },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'confirmed'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reservation', reservationSchema);
