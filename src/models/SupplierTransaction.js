const mongoose = require('mongoose');

const supplierTransactionSchema = new mongoose.Schema(
  {
    supplier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier ID is required'],
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
      required: true, 
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

module.exports = mongoose.model('SupplierTransaction', supplierTransactionSchema);