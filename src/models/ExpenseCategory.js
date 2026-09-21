const mongoose = require('mongoose');

/**
 * Expense Category Schema
 * Defines the types of expenses (e.g., Transportation, Electricity, Maintenance).
 * Used for categorizing and generating filtered financial reports.
 */
const expenseCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
    description: {
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

module.exports = mongoose.model('ExpenseCategory', expenseCategorySchema);