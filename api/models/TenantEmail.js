const mongoose = require('mongoose');

const tenantEmailSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    otp: {
        type: String,
        required: true
    },
    otpExpiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
    }
});

tenantEmailSchema.index({ otpExpiresAt: 1 }, { expireAfterSeconds: 0 });

tenantEmailSchema.add({
    isEmailVerified: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('TenantEmail', tenantEmailSchema);