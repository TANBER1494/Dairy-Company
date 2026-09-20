const mongoose = require('mongoose');

const platformPaymentSchema = new mongoose.Schema(
  {
    farm_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farm',
      required: [true, 'يجب تحديد المزرعة المرتبطة بالدفع'],
      index: true,
    },
    amount_paid: {
      type: Number,
      required: [true, 'يجب تحديد المبلغ المدفوع'],
      min: [1, 'المبلغ يجب أن يكون أكبر من صفر'],
    },
    transfer_number: {
      type: String,
      required: [true, 'يجب إدخال رقم الهاتف الذي تم التحويل منه'],
      trim: true
    },
   requested_months: {
      type: Number,
      required: [true, 'يجب تحديد مدة الاشتراك المطلوبة'],
      min: [1, 'يجب أن تكون المدة شهراً على الأقل'],
    },
    payment_method: {
      type: String,
      enum: ['VODAFONE_CASH', 'BANK_TRANSFER'],
      default: 'VODAFONE_CASH',
    },
    receipt_image_url: {
      type: String,
      required: [true, 'صورة إيصال التحويل مطلوبة لتأكيد الدفع'], 
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING', 
    },
    payment_date: {
      type: Date,
      default: Date.now,
    },
    admin_notes: {
      type: String,
      default: null,
      trim: true
    },
    is_deleted_by_supervisor: {
      type: Boolean,
      default: false,
    },
    is_archived_by_admin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

platformPaymentSchema.index({ status: 1, createdAt: 1 });
platformPaymentSchema.index({ farm_id: 1, is_deleted_by_supervisor: 1 });
platformPaymentSchema.index({ status: 1, is_archived_by_admin: 1 });

module.exports = mongoose.model('PlatformPayment', platformPaymentSchema);