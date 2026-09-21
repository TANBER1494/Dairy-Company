const mongoose = require('mongoose');

/**
 * Expense Schema
 * Records daily financial outflows, linked to a specific category.
 */
const expenseSchema = new mongoose.Schema(
  {
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExpenseCategory',
      required: [true, 'Expense category is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    date: {
      type: Date,
      default: Date.now,
      // Allowing backdated expenses for accurate historical accounting
    },
    shift: {
      type: String,
      enum: ['MORNING', 'EVENING'],
      default: 'MORNING',
    },
    notes: {
      type: String,
      trim: true,
      default: null, // Specific details like "Electricity bill for March"
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);