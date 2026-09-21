const productService = require('../services/productService');
const asyncHandler = require('../utils/asyncHandler');

const createProduct = asyncHandler(async (req, res, next) => {
  const product = await productService.createProduct(req.body);
  res.status(201).json({
    message: 'تم إضافة المنتج بنجاح',
    data: product
  });
});

const getAllProducts = asyncHandler(async (req, res, next) => {
  const filter = req.query.active ? { is_active: req.query.active === 'true' } : {};
  const products = await productService.getAllProducts(filter);
  
  res.status(200).json({
    count: products.length,
    data: products
  });
});

const getProductById = asyncHandler(async (req, res, next) => {
  const product = await productService.getProductById(req.params.id);
  res.status(200).json({
    data: product
  });
});

const updateProduct = asyncHandler(async (req, res, next) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  res.status(200).json({
    message: 'تم تحديث بيانات المنتج بنجاح',
    data: product
  });
});

const toggleProductStatus = asyncHandler(async (req, res, next) => {
  const product = await productService.toggleProductStatus(req.params.id);
  const statusMsg = product.is_active ? 'تنشيط' : 'إيقاف';
  res.status(200).json({
    message: `تم ${statusMsg} المنتج بنجاح`,
    data: product
  });
});

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  toggleProductStatus
};