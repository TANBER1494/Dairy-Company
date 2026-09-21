const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'الاسم مطلوب'],
      trim: true,
    },
    username: {
      type: String,
      required: [true, 'اسم المستخدم مطلوب'],
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ['Admin', 'InventoryAccountant', 'GeneralAccountant'],
      required: [true, 'الصلاحية مطلوبة'],
    },
    phone: {
      type: String,
      match: [/^(01[0125][0-9]{8})$/, 'رقم هاتف غير صالح'],
      default: null
    },
    password_hash: {
      type: String,
      required: [true, 'كلمة المرور مطلوبة'],
      select: false,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
    },
    deleted_at: {
      type: Date,
      default: null,
    }
  },
  { timestamps: true }
);

userSchema.index(
  { username: 1 }, 
  { unique: true, partialFilterExpression: { deleted_at: null } }
);

module.exports = mongoose.model('User', userSchema);