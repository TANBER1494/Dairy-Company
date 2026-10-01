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

  async getSupplierStatement(searchKey, page = 1, limit = 50) {
    let query = {};
    if (!isNaN(searchKey)) {
      query.code = Number(searchKey);
    } else {
      query.name = { $regex: searchKey, $options: 'i' };
    }
    const supplier = await Supplier.findOne(query).lean();
    if (!supplier) throw new AppError('المورد غير موجود بهذا الكود أو الاسم', 404);

    const skip = (page - 1) * limit;
    
    const [transactions, totalItems] = await Promise.all([
      SupplierTransaction.find({ supplier_id: supplier._id })
        .populate('worker_id', 'name')
        .populate('product_id', 'name')
        .populate('created_by', 'name')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SupplierTransaction.countDocuments({ supplier_id: supplier._id })
    ]);

    return { 
      supplier_info: supplier, 
      transactions_history: transactions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
        limit
      }
    };
  }

 async settleAccount(id, payload, userId) {
    const supplier = await Supplier.findById(id);
    if (!supplier) throw new AppError('المورد غير موجود', 404);

    // 1. حساب صافي الفترة المفتوحة من الداتا بيز مباشرة (أمان تام ومنعاً للازدواج)
    const openTransactions = await SupplierTransaction.find({ supplier_id: id, is_settled: false });
    
    let periodTotal = 0;
    let periodPaid = 0;
    
    openTransactions.forEach(tx => {
        periodTotal += (tx.total_price || 0);
        periodPaid += (tx.paid_amount || 0);
    });
    
    const periodNet = periodTotal - periodPaid; // الصافي المستحق للمورد

    // 2. تحديث الرصيد التراكمي
    supplier.current_balance += periodNet;
    await supplier.save();

    // 3. إغلاق الفواتير السابقة
    await SupplierTransaction.updateMany(
      { supplier_id: id, is_settled: false },
      { $set: { is_settled: true } }
    );

    // 4. إنشاء حركة التصفية كـ (علامة قفل) بأصفار حتى لا تتضاعف الأرقام في الداشبورد
    await SupplierTransaction.create({
      supplier_id: id,
      quantity: 0, 
      unit_price: 0,
      total_price: 0,
      paid_amount: 0,
      balance_after: supplier.current_balance,
      is_settled: true,   
      notes: "تسوية وقفل دفتر",
      created_by: userId
    });

    return supplier;
  }
}

module.exports = new SupplierService();