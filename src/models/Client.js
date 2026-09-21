const mongoose = require('mongoose');

/**
 * Client Schema
 * Represents shops or individuals who purchase milk from the dairy facility.
 */
const clientSchema = new mongoose.Schema(
  {
    code: {
      type: Number,
      required: [true, 'Client code is required'],
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Client name is required'],
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
      // Positive value: The client owes money to the facility (Debit).
      // Negative value: The client has an advance payment/credit balance (Credit).
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Client', clientSchema);