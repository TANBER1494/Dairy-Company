const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Merchant = require('../models/Merchant');
const Transaction = require('../models/Transaction');
const InventoryItem = require('../models/InventoryItem');
const InventoryMovement = require('../models/InventoryMovement');
const AppError = require('../utils/AppError');

class InvoiceService {
  async createInvoice(data, userId) {
    const {
      local_id, farm_id, merchant_id, representative_name, invoice_type,
      items, total_amount, paid_amount, invoice_date, notes,
    } = data;

    const numericTotal = Number(total_amount);
    const numericPaid = Number(paid_amount) || 0;

    if (numericTotal <= 0) throw new AppError('إجمالي الفاتورة يجب أن يكون أكبر من الصفر', 400);
    if (numericPaid > numericTotal) throw new AppError('المبلغ المدفوع لا يمكن أن يتجاوز إجمالي الفاتورة', 400);

    const existingInvoice = await Invoice.findOne({ local_id, farm_id }).lean();
    if (existingInvoice) return { isDuplicate: true, invoice: existingInvoice };

    const merchant = await Merchant.findOne({ _id: merchant_id, farm_id }).lean();
    if (!merchant) throw new AppError('التاجر المختار غير موجود في هذه المزرعة', 404);

    const remaining_amount = numericTotal - numericPaid;
    const payment_status = numericPaid === 0 ? 'UNPAID' : remaining_amount === 0 ? 'PAID' : 'PARTIAL';

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const [newInvoice] = await Invoice.create([{
        local_id, farm_id, merchant_id, supervisor_id: userId,
        representative_name: representative_name || '', invoice_type, items,
        total_amount: numericTotal, paid_amount: numericPaid, remaining_amount,
        payment_status, invoice_date: new Date(invoice_date), notes: notes ? notes.trim() : '',
      }], { session });

      if (items && Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          const qty = Number(item.quantity);
          if (!item.item_id || qty <= 0) continue;

          const invItem = await InventoryItem.findOne({ _id: item.item_id, farm_id }).session(session);
          if (!invItem) {
            throw new AppError(`الصنف المختار غير موجود في المخزن`, 404);
          }

          if (invItem.stock_quantity < qty) {
            if (invItem.category !== 'PRODUCT') {
              throw new AppError(`رصيد المخزن لا يكفي من (${invItem.name}). الرصيد المتاح: ${invItem.stock_quantity}`, 400);
            }
          }

          invItem.stock_quantity -= qty;
          await invItem.save({ session });

          await InventoryMovement.create([{
            local_id: `${local_id}_SALE_${item.item_id}`, farm_id, item_id: item.item_id,
            performed_by: userId, movement_type: 'SALE', quantity: qty,
            unit_cost_at_time: Number(item.unit_price) || 0,
            total_value: Number(item.total_price) || qty * (Number(item.unit_price) || 0),
            movement_date: new Date(invoice_date),
            reference_doc: `مبيعات فاتورة رقم ${newInvoice._id.toString().slice(-6)}`,
            status: 'COMPLETED',
          }], { session });
        }
      }

      if (numericPaid > 0) {
        await Transaction.create([{
          local_id: `${local_id}_PAYMENT`, farm_id, merchant_id, invoice_id: newInvoice._id,
          performed_by: userId, type: 'IN', category: 'EGG_SALE', amount: numericPaid,
          transaction_date: new Date(invoice_date),
          reference_doc: `دفعة مقدمة لفاتورة رقم ${newInvoice._id.toString().slice(-6)}`,
        }], { session });
      }

      await session.commitTransaction();
      return { isDuplicate: false, invoice: newInvoice };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getInvoices(farmId, filters) {
    const query = { farm_id: farmId };
    if (filters.merchant_id) query.merchant_id = filters.merchant_id;
    if (filters.invoice_type) query.invoice_type = filters.invoice_type;
    if (filters.payment_status) query.payment_status = filters.payment_status;

    if (filters.start_date || filters.end_date) {
      query.invoice_date = {};
      if (filters.start_date)
        query.invoice_date.$gte = new Date(filters.start_date);
      if (filters.end_date)
        query.invoice_date.$lte = new Date(filters.end_date);
    }

    return await Invoice.find(query)
      .populate('merchant_id', 'company_name merchant_type phone')
      .populate('supervisor_id', 'name')
      .sort({ invoice_date: -1 })
      .lean();
  }

  async getInvoiceDetails(invoiceId, farmId) {
    const invoice = await Invoice.findOne({ _id: invoiceId, farm_id: farmId })
      .populate('merchant_id', 'company_name merchant_type')
      .populate('supervisor_id', 'name')
      .lean();

    if (!invoice)
      throw new AppError('الفاتورة غير موجودة أو غير مصرح لك باستعراضها', 404);

    const payments = await Transaction.find({
      invoice_id: invoiceId,
      farm_id: farmId,
    })
      .select('amount type transaction_date performed_by reference_doc')
      .populate('performed_by', 'name')
      .sort({ transaction_date: -1 })
      .lean();

    return { invoice, payment_history: payments };
  }

async updateInvoice(invoiceId, farmId, data, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const invoice = await Invoice.findOne({ _id: invoiceId, farm_id: farmId }).session(session);
      if (!invoice) throw new AppError('الفاتورة غير موجودة', 404);

      const today = new Date();
      const createdDate = new Date(invoice.createdAt);
      if (today.toDateString() !== createdDate.toDateString()) {
        throw new AppError('غير مسموح بتعديل الفاتورة. التعديل متاح فقط في نفس يوم إصدارها.', 400);
      }

      for (const item of invoice.items) {
        let invItem = null;
        if (item.item_id) {
          invItem = await InventoryItem.findOne({ _id: item.item_id, farm_id: farmId }).session(session);
        } else {
          invItem = await InventoryItem.findOne({ farm_id: farmId, category: 'PRODUCT' }).session(session);
        }
        
        if (invItem) {
          invItem.stock_quantity += Number(item.quantity) || 0;
          await invItem.save({ session });
        }
      }
      
      await InventoryMovement.deleteMany({
        reference_doc: `مبيعات فاتورة رقم ${invoice._id.toString().slice(-6)}`,
        farm_id: farmId
      }).session(session);

      if (invoice.paid_amount > 0) {
         await Transaction.deleteMany({ invoice_id: invoice._id, farm_id: farmId }).session(session);
      }

      const { items, total_amount, paid_amount, invoice_date, notes, representative_name } = data;
      const numericTotal = Number(total_amount);
      const numericPaid = Number(paid_amount) || 0;
      const remaining_amount = numericTotal - numericPaid;
      const payment_status = numericPaid === 0 ? 'UNPAID' : remaining_amount === 0 ? 'PAID' : 'PARTIAL';

      invoice.items = items;
      invoice.total_amount = numericTotal;
      invoice.paid_amount = numericPaid;
      invoice.remaining_amount = remaining_amount;
      invoice.payment_status = payment_status;
      invoice.invoice_date = new Date(invoice_date);
      if (notes !== undefined) invoice.notes = notes;
      if (representative_name !== undefined) invoice.representative_name = representative_name;

      for (const item of items) {
        const qty = Number(item.quantity);
        const invItem = await InventoryItem.findOne({ _id: item.item_id, farm_id: farmId }).session(session);
        if (!invItem) throw new AppError(`الصنف غير موجود بالمخزن`, 404);

        if (invItem.stock_quantity < qty && invItem.category !== 'PRODUCT') {
           throw new AppError(`رصيد المخزن لا يكفي. المتاح: ${invItem.stock_quantity}`, 400);
        }
        invItem.stock_quantity -= qty;
        await invItem.save({ session });

        await InventoryMovement.create([{
          local_id: `${invoice.local_id}_SALE_UP_${Date.now()}`,
          farm_id: farmId, item_id: item.item_id,
          performed_by: userId, movement_type: 'SALE', quantity: qty,
          unit_cost_at_time: Number(item.unit_price) || 0,
          total_value: Number(item.total_price) || qty * (Number(item.unit_price) || 0),
          movement_date: new Date(invoice_date),
          reference_doc: `مبيعات فاتورة رقم ${invoice._id.toString().slice(-6)}`,
          status: 'COMPLETED',
        }], { session });
      }

      if (numericPaid > 0) {
        await Transaction.create([{
          local_id: `${invoice.local_id}_PAY_UP_${Date.now()}`,
          farm_id: farmId, merchant_id: invoice.merchant_id, invoice_id: invoice._id,
          performed_by: userId, type: 'IN', category: 'EGG_SALE', amount: numericPaid,
          transaction_date: new Date(invoice_date),
          reference_doc: `دفعة مقدمة لفاتورة رقم ${invoice._id.toString().slice(-6)}`,
        }], { session });
      }

      await invoice.save({ session });
      await session.commitTransaction();
      return invoice;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

async deleteInvoice(invoiceId, farmId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const invoice = await Invoice.findOne({
        _id: invoiceId,
        farm_id: farmId,
      }).session(session);
      if (!invoice)
        throw new AppError('الفاتورة غير موجودة أو تم حذفها مسبقاً', 404);

      if (invoice.paid_amount > 0) {
        throw new AppError(
          'إجراء مرفوض: لا يمكن حذف فاتورة تحتوي على دفعات نقدية بالخزنة. يجب عمل "مرتجع" بدلاً من الحذف.',
          400
        );
      }

      if (invoice.items && invoice.items.length > 0) {
        for (const item of invoice.items) {
          const qty = Number(item.quantity);
          if (qty <= 0) continue;

          let invItem = null;
          if (item.item_id) {
            invItem = await InventoryItem.findOne({ _id: item.item_id, farm_id: farmId }).session(session);
          } else {
             invItem = await InventoryItem.findOne({ farm_id: farmId, category: 'PRODUCT' }).session(session);
          }

          if (invItem) {
            invItem.stock_quantity += qty;
            await invItem.save({ session });
          }

          await InventoryMovement.deleteMany({
            reference_doc: `مبيعات فاتورة رقم ${invoice._id.toString().slice(-6)}`,
            farm_id: farmId,
          }).session(session);
        }
      }

      await Invoice.findByIdAndDelete(invoiceId).session(session);

      await session.commitTransaction();
      return true;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

module.exports = new InvoiceService();