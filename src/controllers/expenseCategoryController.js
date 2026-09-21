const expenseCategoryService = require('../services/expenseCategoryService');
const asyncHandler = require('../utils/asyncHandler');
const { clearCache } = require('../middlewares/cacheMiddleware');

const createCategory = asyncHandler(async (req, res) => {
  const category = await expenseCategoryService.createCategory(req.body);
  clearCache('categories'); 
  res.status(201).json({ message: 'تم إضافة فئة المصروفات بنجاح', data: category });
});

const getAllCategories = asyncHandler(async (req, res) => {
  const filter = req.query.active ? { is_active: req.query.active === 'true' } : {};
  const categories = await expenseCategoryService.getAllCategories(filter);
  res.status(200).json({ count: categories.length, data: categories });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await expenseCategoryService.updateCategory(req.params.id, req.body);
  clearCache('categories'); 
  res.status(200).json({ message: 'تم تحديث الفئة بنجاح', data: category });
});

const toggleCategoryStatus = asyncHandler(async (req, res) => {
  const category = await expenseCategoryService.toggleCategoryStatus(req.params.id);
  clearCache('categories'); 
  res.status(200).json({ message: `تم ${category.is_active ? 'تنشيط' : 'إيقاف'} الفئة بنجاح`, data: category });
});

module.exports = { createCategory, getAllCategories, updateCategory, toggleCategoryStatus };