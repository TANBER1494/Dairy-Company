const expenseService = require('../services/expenseService');
const asyncHandler = require('../utils/asyncHandler');
const { clearCache } = require('../middlewares/cacheMiddleware');

const createExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.createExpense(req.body, req.user._id);
  clearCache('dashboard');
  res.status(201).json({
    message: 'تم تسجيل المصروف بنجاح',
    data: expense
  });
});

const getAllExpenses = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.category_id) {
    filter.category_id = req.query.category_id;
  }
  
  const expenses = await expenseService.getAllExpenses(filter);
  res.status(200).json({
    count: expenses.length,
    data: expenses
  });
});

const getExpenseById = asyncHandler(async (req, res) => {
  const expense = await expenseService.getExpenseById(req.params.id);
  res.status(200).json({ data: expense });
});

const updateExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.updateExpense(req.params.id, req.body);
  clearCache('dashboard'); 
  res.status(200).json({
    message: 'تم تحديث بيانات المصروف بنجاح',
    data: expense
  });
});

const deleteExpense = asyncHandler(async (req, res) => {
  await expenseService.deleteExpense(req.params.id);
  clearCache('dashboard'); 
  res.status(200).json({ message: 'تم حذف المصروف بنجاح' });
});

module.exports = {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense
};