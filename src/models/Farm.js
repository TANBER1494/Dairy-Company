const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema(
  {
    supervisor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'يجب ربط المزرعة بمشرف'],
      unique: true, 
    },
    name: {
      type: String,
      required: [true, 'اسم المزرعة مطلوب'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'موقع المزرعة مطلوب'],
      trim: true,
    },
    subscription_status: {
      type: String,
      enum: ['TRIAL', 'ACTIVE', 'OVERDUE', 'LOCKED'],
      default: 'TRIAL',
      required: true,
    },
    monthly_fee: {
      type: Number,
      default: 0,
    },
    trial_ends_at: {
      type: Date,
      required: [true, 'تاريخ انتهاء الفترة التجريبية مطلوب'],
    },
    subscription_ends_at: {
      type: Date,
      default: null,
    },
    has_feed_mill: { 
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Farm', farmSchema);