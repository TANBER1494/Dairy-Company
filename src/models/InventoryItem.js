const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema(
  {
    local_id: { type: String, required: true, unique: true, index: true },
    farm_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farm',
      required: [true, 'يجب ربط الصنف بمزرعة معينة'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'اسم الصنف مطلوب'],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'FEED',
        'MEDICATION',
        'VACCINE',
        'DISINFECTANT',
        'PRODUCT',
        'RAW_MATERIAL',
        'OTHER',
      ],
      required: true,
    },
    unit: {
      type: String,
      enum: ['BAG', 'TON', 'LITER', 'BOTTLE', 'KG', 'PIECE', 'TRAY'],
      required: true,
    },
    stock_quantity: {
      type: Number,
      default: 0,
    },
    average_unit_cost: {
      type: Number,
      default: 0,
      min: 0,
    },
    unloading_cost: {
      type: Number,
      default: 0,
      min: 0,
    },
    deleted_at: {
      type: Date,
      default: null,
    },
    min_alert_level: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

inventoryItemSchema.index(
  { farm_id: 1, name: 1 },
  { unique: true, partialFilterExpression: { deleted_at: null } }
);

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);