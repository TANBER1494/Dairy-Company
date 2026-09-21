const Supplier = require('../models/Supplier');
const AppError = require('../utils/AppError');
const SupplierTransaction = require('../models/SupplierTransaction');

class SupplierService {
  async createSupplier(data) {
    const existingSupplier = await Supplier.findOne({ code: data.code });
    if (existingSupplier) {
      throw new AppError('كود المورد مسجل بالفعل', 400);
    }
    
    data.current_balance = 0; 
    
    return await Supplier.create(data);
  }

  async getAllSuppliers(query = {}) {
    return await Supplier.find(query).sort({ code: 1 }).lean();
  }

  async getSupplierById(id) {
    const supplier = await Supplier.findById(id).lean();
    if (!supplier) {
      throw new AppError('المورد غير موجود', 404);
    }
    return supplier;
  }

  async updateSupplier(id, data) {
    if (data.code) {
      const existingSupplier = await Supplier.findOne({ code: data.code, _id: { $ne: id } });
      if (existingSupplier) {
        throw new AppError('كود المورد مستخدم لمورد آخر', 400);
      }
    }

    delete data.current_balance;

    const supplier = await Supplier.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!supplier) {
      throw new AppError('المورد غير موجود', 404);
    }
    return supplier;
  }

  async toggleSupplierStatus(id) {
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      throw new AppError('المورد غير موجود', 404);
    }
    supplier.is_active = !supplier.is_active;
    await supplier.save();
    return supplier;
  }

  async getSupplierStatement(searchKey) {
    let query = {};
    
    if (!isNaN(searchKey)) {
      query.code = Number(searchKey);
    } else {
      query.name = { $regex: searchKey, $options: 'i' };
    }

    const supplier = await Supplier.findOne(query).lean();
    if (!supplier) {
      throw new AppError('المورد غير موجود بهذا الكود أو الاسم', 404);
    }

    const transactions = await SupplierTransaction.find({ supplier_id: supplier._id })
      .populate('worker_id', 'name')
      .populate('product_id', 'name')
      .populate('created_by', 'name')
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return {
      supplier_info: supplier,
      transactions_history: transactions
    };
  }
}

module.exports = new SupplierService();