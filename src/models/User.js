const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    farm_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farm',
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'الاسم مطلوب'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true, 
      match: [/^\S+@\S+\.\S+$/, 'صيغة البريد الإلكتروني غير صالحة'],
    },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'SUPERVISOR'],
      required: true,
    },
    phone: {
      type: String,
      required: [true, 'رقم الهاتف مطلوب'],
      match: [/^(01[0125][0-9]{8})$/, 'رقم هاتف غير صالح']
    },
    password_hash: {
      type: String,
      required: true,
      select: false,
    },
    current_session_id: {
      type: String,
      default: null,
    },
    fcm_token: {
      type: String,
      default: null,
    },
    otp_code: {
      type: String,
      select: false,
    },
    otp_expires_at: {
      type: Date,
      select: false,
    },
    otp_last_sent_at: {
      type: Date,
      select: false,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'PENDING'],
      default: 'ACTIVE',
    },
    deleted_at: {
      type: Date,
      default: null,
      index: true,
    },
    notifications_enabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

userSchema.index(
  { phone: 1 }, 
  { unique: true, partialFilterExpression: { deleted_at: null } }
);

module.exports = mongoose.model('User', userSchema);