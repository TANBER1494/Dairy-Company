const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Invoice = require('../models/Invoice');
const AppError = require('../utils/AppError');

class TransactionService {
  
  async recordTransaction(data, userId) {
    const {
      local_id, farm_id, type, category, amount, transaction_date,
      worker_id, merchant_id, invoice_id, notes, reference_doc
    } = data;

    const numericAmount = Number(amount);

    const existingTransaction = await Transaction.findOne({ local_id, farm_id }).lean();
    if (existingTransaction) {
      return { isDuplicate: true, transaction: existingTransaction };
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (invoice_id) {
        const updatedInvoice = await Invoice.findOneAndUpdate(
          { 
            _id: invoice_id, 
            farm_id, 
            remaining_amount: { $gte: numericAmount } 
          },
          { 
            $inc: { 
              paid_amount: numericAmount, 
              remaining_amount: -numericAmount 
            } 
          },
          { new: true, session }
        );

        if (!updatedInvoice) {
          throw new AppError('الفاتورة غير موجودة، أو المبلغ المدفوع يتجاوز القيمة المتبقية للفاتورة', 400);
        }

        const paymentStatus = updatedInvoice.remaining_amount === 0 ? 'PAID' : 'PARTIAL';
        await Invoice.updateOne(
          { _id: invoice_id }, 
          { payment_status: paymentStatus }, 
          { session }
        );
      } 

      const [newTransaction] = await Transaction.create([{
        local_id,
        farm_id,
        worker_id: worker_id || null,
        merchant_id: merchant_id || null,
        invoice_id: invoice_id || null,
        performed_by: userId,
        type,
        category, // (مثال: SAFE_DEPOSIT, WORKER_ADVANCE, MERCHANT_PAYMENT)
        amount: numericAmount,
        transaction_date: new Date(transaction_date),
        notes: notes ? notes.trim() : '',
        reference_doc: reference_doc ? reference_doc.trim() : ''
      }], { session });

      await session.commitTransaction();
      return { isDuplicate: false, transaction: newTransaction };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getLedgerTransactions(farmId, filters) {
    const query = { farm_id: farmId };
    
    if (filters.type) query.type = filters.type;
    if (filters.category) query.category = filters.category;
    
    if (filters.start_date || filters.end_date) {
      query.transaction_date = {};
      if (filters.start_date) query.transaction_date.$gte = new Date(filters.start_date);
      if (filters.end_date) query.transaction_date.$lte = new Date(filters.end_date);
    }

    return await Transaction.find(query)
      .populate('performed_by', 'name role')
      .populate('worker_id', 'name')
      .populate('merchant_id', 'company_name merchant_type')
      .sort({ transaction_date: -1 })
      .lean();
  }

  async getTreasuryBalance(farmId) {
    const pipeline = [
      { 
        $match: { 
          farm_id: new mongoose.Types.ObjectId(farmId)
        } 
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ];

    const results = await Transaction.aggregate(pipeline);

    let totalIn = 0;
    let totalOut = 0;

    results.forEach(result => {
      if (result._id === 'IN') totalIn = result.total;
      if (result._id === 'OUT') totalOut = result.total;
    });

    return {
      total_in: totalIn,
      total_out: totalOut,
      net_balance: totalIn - totalOut 
    };
  }
}

module.exports = new TransactionService();