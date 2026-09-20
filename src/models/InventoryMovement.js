const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema(
  {
    local_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    farm_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farm',
      required: true,
    },
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: true,
    },
    cycle_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cycle',
      default: null, 
    },
    performed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    movement_type: {
      type: String,
      enum: [
        'PRODUCTION',   // إنتاج (مثل البيض أو تصنيع العلف)
        'PURCHASE',     // شراء أدوية وعلف جاهز
        'CONSUMPTION',  // استهلاك داخل العنابر
        'ADJUSTMENT',   // تسوية الجرد
        'SALE',         // بيع من المخزن
        'UNLOADING',    // تنزيل خامات (دخان)
      ],
      required: true,
    },
    quantity: {
      type: Number,
      required: [true, 'يجب تحديد الكمية'],
      min: [0.01, 'الكمية يجب أن تكون أكبر من الصفر'],
    },
    unit_cost_at_time: {
      type: Number,
      required: [true, 'سعر الوحدة وقت الحركة مطلوب'],
      min: 0,
    },
    total_value: {
      type: Number,
      required: true,
      min: 0,
    },
    movement_date: {
      type: Date,
      required: true,
    },
    reference_doc: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

inventoryMovementSchema.index({ farm_id: 1, item_id: 1, movement_date: -1 });
inventoryMovementSchema.index({ farm_id: 1, movement_type: 1, movement_date: -1 });
inventoryMovementSchema.index({ cycle_id: 1 });

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);