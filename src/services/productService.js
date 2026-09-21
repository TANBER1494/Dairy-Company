const Product = require('../models/Product');
const AppError = require('../utils/AppError');

class ProductService {
  async createProduct(data) {
    const existingProduct = await Product.findOne({ code: data.code });
    if (existingProduct) {
      throw new AppError('كود المنتج مسجل بالفعل', 400);
    }
    return await Product.create(data);
  }

  async getAllProducts(query = {}) {
    // جلب المنتجات مع إمكانية التصفية (مثلاً: النشطة فقط)
    return await Product.find(query).sort({ code: 1 }).lean();
  }

  async getProductById(id) {
    const product = await Product.findById(id).lean();
    if (!product) {
      throw new AppError('المنتج غير موجود', 404);
    }
    return product;
  }

  async updateProduct(id, data) {
    if (data.code) {
      const existingProduct = await Product.findOne({ code: data.code, _id: { $ne: id } });
      if (existingProduct) {
        throw new AppError('كود المنتج مستخدم لمنتج آخر', 400);
      }
    }

    const product = await Product.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      throw new AppError('المنتج غير موجود', 404);
    }
    return product;
  }

  async toggleProductStatus(id) {
    const product = await Product.findById(id);
    if (!product) {
      throw new AppError('المنتج غير موجود', 404);
    }
    product.is_active = !product.is_active;
    await product.save();
    return product;
  }
}

module.exports = new ProductService();