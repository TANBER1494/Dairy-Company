const mongoose = require('mongoose');

/**
 * Product Schema
 * Represents the items handled in the dairy facility (e.g., Buffalo Milk, Cow Milk).
 */
const productSchema = new mongoose.Schema(
  {
    code: {
      type: Number,
      required: [true, 'Product code is required'],
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    current_price: { type: Number, default: 0 },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    current_stock: {
      type: Number,
      default: 0, 
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
