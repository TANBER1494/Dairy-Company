const mongoose = require('mongoose');

const clientTransactionSchema = new mongoose.Schema(
  {
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client ID is required'],
      index: true,
    },
    worker_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      default: null, 
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    quantity: {
      type: Number,
      default: 0, 
    },
    unit_price: {
      type: Number,
      default: 0, 
    },
    total_price: {
      type: Number,
      default: 0, 
    },
    paid_amount: {
      type: Number,
      default: 0, 
    },
    balance_after: {
      type: Number,
      default: 0, 
    },
    is_settled: {
      type: Boolean,
      default: false,
    },
    shift: {
      type: String,
      enum: ['MORNING', 'EVENING'],
      default: 'MORNING',
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, 
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ClientTransaction', clientTransactionSchema);