const mongoose = require('mongoose');

/**
 * Worker Schema
 * Represents delivery personnel or collectors. They do not have system login access.
 */
const workerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Worker name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Worker', workerSchema);