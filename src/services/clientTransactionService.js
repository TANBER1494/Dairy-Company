const ClientTransaction = require('../models/ClientTransaction');
const Client = require('../models/Client');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');

class ClientTransactionService {
  async createTransaction(data, userId) {
    const { client_id, worker_id, product_id, quantity, unit_price, paid_amount, shift, notes, date } = data;

    const client = await Client.findById(client_id);
    if (!client) throw new AppError('العميل غير موجود', 404);

    const qty = Number(quantity) || 0;
    const price = Number(unit_price) || 0;
    const paid = Number(paid_amount) || 0;
    const total_price = qty * price;

    if (qty > 0 && product_id) {
      await Product.findByIdAndUpdate(product_id, {
        $inc: { current_stock: -qty }
      });
    }

    const transaction = await ClientTransaction.create({
      client_id,
      worker_id: worker_id || null,
      product_id: product_id || null,
      quantity: qty,
      unit_price: price,
      total_price,
      paid_amount: paid,
      balance_after: client.current_balance,
      shift,
      notes,
      date: date || Date.now(),
      created_by: userId
    });

    return transaction;
  }

  async getAllTransactions(query = {}, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [transactions, totalItems] = await Promise.all([
      ClientTransaction.find(query)
        .populate('client_id', 'name code')
        .populate('worker_id', 'name')
        .populate('product_id', 'name')
        .populate('created_by', 'name')
        .populate('updated_by', 'name') 
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ClientTransaction.countDocuments(query)
    ]);

    return {
      transactions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
        limit
      }
    };
  }

  async updateTransaction(id, data, userId) {
    const oldTx = await ClientTransaction.findById(id);
    if (!oldTx) throw new AppError('الفاتورة غير موجودة', 404);
    if (oldTx.is_settled) throw new AppError('لا يمكن تعديل فاتورة تم تصفية حسابها', 400);

    const newProductId = data.product_id !== undefined ? data.product_id : oldTx.product_id;
    const qty = data.quantity !== undefined ? Number(data.quantity) : oldTx.quantity;
    const price = data.unit_price !== undefined ? Number(data.unit_price) : oldTx.unit_price;
    const paid = data.paid_amount !== undefined ? Number(data.paid_amount) : oldTx.paid_amount;
    const total_price = qty * price;

    if (oldTx.product_id && oldTx.quantity > 0) {
      await Product.findByIdAndUpdate(oldTx.product_id, {
        $inc: { current_stock: oldTx.quantity }
      });
    }

    if (qty > 0 && newProductId) {
      await Product.findByIdAndUpdate(newProductId, {
        $inc: { current_stock: -qty }
      });
    }

    const updatedTx = await ClientTransaction.findByIdAndUpdate(id, {
      ...data,
      total_price,
      updated_by: userId
    }, { new: true, runValidators: true });

    return updatedTx;
  }

  async deleteTransaction(id) {
    const tx = await ClientTransaction.findById(id);
    if (!tx) throw new AppError('الفاتورة غير موجودة', 404);
    if (tx.is_settled) throw new AppError('لا يمكن حذف فاتورة تم تصفية حسابها', 400);

    if (tx.product_id && tx.quantity > 0) {
      await Product.findByIdAndUpdate(tx.product_id, {
        $inc: { current_stock: tx.quantity }
      });
    }

    await tx.deleteOne();
    return true;
  }

  async bulkCreateTransactions(transactionsData, userId) {
    const results = [];
    for (const data of transactionsData) {
      const tx = await this.createTransaction(data, userId);
      results.push(tx);
    }
    return results;
  }
}

module.exports = new ClientTransactionService();