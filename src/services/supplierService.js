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
    const filter = {};
    if (query.active !== undefined) {
      filter.is_active = query.active === 'true';
    }
    if (query.address) {
      filter.address = { $regex: query.address, $options: 'i' };
    }
    return await Supplier.find(filter).sort({ code: 1 }).lean();
  }

  async getSupplierById(id) {
    const supplier = await Supplier.findById(id).lean();
    if (!supplier) throw new AppError('المورد غير موجود', 404);
    return supplier;
  }

  async updateSupplier(id, data) {
    if (data.code) {
      const existingSupplier = await Supplier.findOne({ code: data.code, _id: { $ne: id } });
      if (existingSupplier) throw new AppError('كود المورد مستخدم لمورد آخر', 400);
    }
    delete data.current_balance;
    const supplier = await Supplier.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!supplier) throw new AppError('المورد غير موجود', 404);
    return supplier;
  }

  async toggleSupplierStatus(id) {
    const supplier = await Supplier.findById(id);
    if (!supplier) throw new AppError('المورد غير موجود', 404);
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
    if (!supplier) throw new AppError('المورد غير موجود بهذا الكود أو الاسم', 404);

    const transactions = await SupplierTransaction.find({ supplier_id: supplier._id })
      .populate('worker_id', 'name')
      .populate('product_id', 'name')
      .populate('created_by', 'name')
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return { supplier_info: supplier, transactions_history: transactions };
  }

async settleAccount(id, payload, userId) {
    const supplier = await Supplier.findById(id);
    if (!supplier) throw new AppError('المورد غير موجود', 404);

    const total = Number(payload.total_amount) || 0;
    const paid = Number(payload.paid_amount) || 0;

    supplier.current_balance = supplier.current_balance + total - paid;
    await supplier.save();

    await SupplierTransaction.updateMany(
      { supplier_id: id, is_settled: false },
      { $set: { is_settled: true } }
    );

    await SupplierTransaction.create({
      supplier_id: id,
      quantity: 0, 
      unit_price: 0,
      total_price: total, 
      paid_amount: paid,  
      balance_after: supplier.current_balance,
      is_settled: true,   
      notes: "تصفية حساب وتقفيل الكيلوهات السابقة",
      created_by: userId
    });

    return supplier;
  }
}

module.exports = new SupplierService();