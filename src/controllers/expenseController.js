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
  
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;

  const result = await expenseService.getAllExpenses(filter, page, limit);
  
  res.status(200).json({
    message: 'تم جلب المصروفات بنجاح',
    data: result.expenses,
    pagination: result.pagination
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