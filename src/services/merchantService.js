const Merchant = require('../models/Merchant');
const Invoice = require('../models/Invoice');
const Transaction = require('../models/Transaction');
const AppError = require('../utils/AppError');
const transactionService = require('./transactionService');

class MerchantService {
  async createMerchant(data) {
    const {
      local_id,
      farm_id,
      company_name,
      merchant_type,
      company_phone,
      address,
      representatives,
    } = data;

    // Idempotency Check
    const existingMerchant = await Merchant.findOne({
      local_id,
      farm_id,
    }).lean();
    if (existingMerchant)
      return { isDuplicate: true, merchant: existingMerchant };

    try {
      const newMerchant = await Merchant.create({
        local_id,
        farm_id,
        company_name: company_name.trim(),
        merchant_type,
        company_phone: company_phone ? company_phone.trim() : '',
        address: address ? address.trim() : '',
        representatives: Array.isArray(representatives) ? representatives : [],
      });
      return { isDuplicate: false, merchant: newMerchant };
    } catch (error) {
      if (error.code === 11000) {
        throw new AppError('هذا التاجر مسجل بالفعل في المزرعة', 400);
      }
      throw error;
    }
  }

  async getMerchants(farmId, filters) {
    const query = { farm_id: farmId };
    if (filters.merchant_type) query.merchant_type = filters.merchant_type;
    if (filters.status) query.status = filters.status;

    return await Merchant.find(query).sort({ company_name: 1 }).lean();
  }

  async updateMerchant(merchantId, farmId, updates) {
    const merchant = await Merchant.findOne({
      _id: merchantId,
      farm_id: farmId,
    });
    if (!merchant) throw new AppError('التاجر غير موجود', 404);

    if (updates.company_name)
      merchant.company_name = updates.company_name.trim();
    if (updates.company_phone)
      merchant.company_phone = updates.company_phone.trim();
    if (updates.address) merchant.address = updates.address.trim();
    if (updates.status) merchant.status = updates.status;

    try {
      await merchant.save();
      return merchant;
    } catch (error) {
      if (error.code === 11000)
        throw new AppError('يوجد تاجر آخر بنفس الاسم', 400);
      throw error;
    }
  }

  async addRepresentative(merchantId, farmId, repData) {
    const merchant = await Merchant.findOne({
      _id: merchantId,
      farm_id: farmId,
    });
    if (!merchant) throw new AppError('التاجر غير موجود', 404);

    if (merchant.representatives.length === 0) repData.is_primary = true;

    merchant.representatives.push(repData);
    await merchant.save();
    return merchant;
  }

  async removeRepresentative(merchantId, repId, farmId) {
    const merchant = await Merchant.findOne({
      _id: merchantId,
      farm_id: farmId,
    });
    if (!merchant) throw new AppError('التاجر غير موجود', 404);

    merchant.representatives.id(repId).deleteOne();
    await merchant.save();
    return merchant;
  }

  async recordPayment(merchantId, farmId, paymentData, userId) {
    const merchant = await Merchant.findOne({
      _id: merchantId,
      farm_id: farmId,
    });
    if (!merchant) throw new AppError('التاجر غير موجود', 404);

    const { local_id, amount, type, transaction_date, notes, rep_name } =
      paymentData;

    let defaultNotes =
      type === 'IN'
        ? `تسديد دفعة نقدية من تاجر البيض (${merchant.company_name})`
        : `صرف دفعة نقدية لتاجر البيض (${merchant.company_name})`;

    if (rep_name) defaultNotes += ` - المندوب: ${rep_name}`;

    return await transactionService.recordTransaction(
      {
        local_id: local_id,
        farm_id: farmId,
        type: type,
        category: 'MERCHANT_PAYMENT',
        amount: amount,
        transaction_date: transaction_date || new Date(),
        merchant_id: merchantId,
        notes: notes || defaultNotes,
      },
      userId
    );
  }

  async getMerchantStatement(merchantId, farmId) {
    const merchant = await Merchant.findOne({
      _id: merchantId,
      farm_id: farmId,
    }).lean();
    if (!merchant) throw new AppError('التاجر غير موجود', 404);

    const [invoices, transactions] = await Promise.all([
      Invoice.find({ merchant_id: merchantId, farm_id: farmId })
        .sort({ invoice_date: -1 })
        .lean(),

      Transaction.find({ merchant_id: merchantId, farm_id: farmId })
        .sort({ transaction_date: -1 })
        .lean(),
    ]);

    return {
      merchant_info: {
        company_name: merchant.company_name,
        representatives: merchant.representatives,
        type: merchant.merchant_type,
        status: merchant.status,
      },
      invoices_history: invoices,
      transactions_history: transactions,
    };
  }

  async deleteMerchant(merchantId, farmId) {
    const merchant = await Merchant.findOne({
      _id: merchantId,
      farm_id: farmId,
    });
    if (!merchant) throw new AppError('التاجر غير موجود', 404);

    const [hasInvoices, hasTransactions] = await Promise.all([
      Invoice.exists({ merchant_id: merchantId, farm_id: farmId }),
      Transaction.exists({ merchant_id: merchantId, farm_id: farmId }),
    ]);

    if (hasInvoices)
      throw new AppError('إجراء مرفوض: يوجد فواتير مرتبطة بهذا التاجر.', 400);
    if (hasTransactions)
      throw new AppError(
        'إجراء مرفوض: يوجد حركات مالية مرتبطة بهذا التاجر.',
        400
      );

    await Merchant.findByIdAndDelete(merchantId);
    return true;
  }
}

module.exports = new MerchantService();
