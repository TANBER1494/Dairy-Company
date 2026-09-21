const Expense = require('../models/Expense');
const ExpenseCategory = require('../models/ExpenseCategory');
const AppError = require('../utils/AppError');

class ExpenseService {
  async createExpense(data, userId) {
    const { category_id, amount, date, shift, notes } = data;

    const category = await ExpenseCategory.findById(category_id);
    if (!category) {
      throw new AppError('Expense category not found', 404);
    }

    if (!category.is_active) {
      throw new AppError('Cannot add expense to an inactive category', 400);
    }

    const expense = await Expense.create({
      category_id,
      amount,
      date: date || Date.now(),
      shift,
      notes,
      created_by: userId
    });

    return expense;
  }

  async getAllExpenses(query = {}) {
    return await Expense.find(query)
      .populate('category_id', 'name')
      .populate('created_by', 'name username')
      .sort({ date: -1, createdAt: -1 })
      .lean();
  }

  async getExpenseById(id) {
    const expense = await Expense.findById(id)
      .populate('category_id', 'name')
      .populate('created_by', 'name username');
      
    if (!expense) {
      throw new AppError('Expense not found', 404);
    }
    return expense;
  }

  async updateExpense(id, data) {
    if (data.category_id) {
      const category = await ExpenseCategory.findById(data.category_id);
      if (!category) throw new AppError('Expense category not found', 404);
    }

    const expense = await Expense.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true
    });

    if (!expense) {
      throw new AppError('Expense not found', 404);
    }
    return expense;
  }

  async deleteExpense(id) {
    const expense = await Expense.findByIdAndDelete(id);
    if (!expense) {
      throw new AppError('Expense not found', 404);
    }
    return true;
  }
}

module.exports = new ExpenseService();