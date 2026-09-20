const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'اسم الباقة مطلوب (مثال: الباقة الربع سنوية)'],
      trim: true,
    },
    months: {
      type: Number,
      required: [true, 'عدد أشهر الباقة مطلوب'],
      min: [1, 'يجب أن تكون المدة شهراً واحداً على الأقل'],
    },
    price: {
      type: Number,
      required: [true, 'سعر الباقة مطلوب'],
      min: [0, 'السعر لا يمكن أن يكون بالسالب'],
    },
    is_active: {
      type: Boolean,
      default: true, 
    },
    is_deleted: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);