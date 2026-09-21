const mongoose = require('mongoose');

/**
 * Supplier Schema
 * Represents individuals or farms that supply milk to the dairy facility.
 */
const supplierSchema = new mongoose.Schema(
  {
    code: {
      type: Number,
      required: [true, 'Supplier code is required'],
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    address: {
      type: String,
      trim: true,
      default: null,
    },
    current_balance: {
      type: Number,
      default: 0,
      // Positive value: The facility owes money to the supplier (Credit).
      // Negative value: The supplier owes money to the facility (Debit/Advance).
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Supplier', supplierSchema);