const ExpenseCategory = require('../models/ExpenseCategory');
const AppError = require('../utils/AppError');

class ExpenseCategoryService {
  async createCategory(data) {
    const existingCategory = await ExpenseCategory.findOne({ name: data.name });
    if (existingCategory) throw new AppError('فئة المصروفات مسجلة بالفعل', 400);
    return await ExpenseCategory.create(data);
  }

  async getAllCategories(query = {}) {
    return await ExpenseCategory.find(query).sort({ createdAt: -1 }).lean();
  }

  async updateCategory(id, data) {
    const category = await ExpenseCategory.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!category) throw new AppError('الفئة غير موجودة', 404);
    return category;
  }

  async toggleCategoryStatus(id) {
    const category = await ExpenseCategory.findById(id);
    if (!category) throw new AppError('الفئة غير موجودة', 404);
    category.is_active = !category.is_active;
    await category.save();
    return category;
  }
}

module.exports = new ExpenseCategoryService();