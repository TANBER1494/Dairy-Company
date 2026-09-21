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

    client.current_balance = client.current_balance + total_price - paid;
    await client.save();

    if (qty > 0 && product_id) {
      const product = await Product.findById(product_id);
      if (product) {
        product.current_stock = (product.current_stock || 0) - qty;
        await product.save();
      }
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

  async getAllTransactions(query = {}) {
    return await ClientTransaction.find(query)
      .populate('client_id', 'name code')
      .populate('worker_id', 'name')
      .populate('product_id', 'name')
      .populate('created_by', 'name')
      .populate('updated_by', 'name') 
      .sort({ date: -1, createdAt: -1 })
      .lean();
  }

  async updateTransaction(id, data, userId) {
    const oldTx = await ClientTransaction.findById(id);
    if (!oldTx) throw new AppError('الفاتورة غير موجودة', 404);

    const oldClient = await Client.findById(oldTx.client_id);
    if (oldClient) {
      oldClient.current_balance = oldClient.current_balance - oldTx.total_price + oldTx.paid_amount;
      await oldClient.save();
    }
    
    if (oldTx.product_id && oldTx.quantity > 0) {
      const oldProduct = await Product.findById(oldTx.product_id);
      if (oldProduct) {
        oldProduct.current_stock = oldProduct.current_stock + oldTx.quantity;
        await oldProduct.save();
      }
    }

    const newClientId = data.client_id || oldTx.client_id;
    const newProductId = data.product_id !== undefined ? data.product_id : oldTx.product_id;
    const qty = data.quantity !== undefined ? Number(data.quantity) : oldTx.quantity;
    const price = data.unit_price !== undefined ? Number(data.unit_price) : oldTx.unit_price;
    const paid = data.paid_amount !== undefined ? Number(data.paid_amount) : oldTx.paid_amount;
    const total_price = qty * price;

    const newClient = await Client.findById(newClientId);
    if (!newClient) throw new AppError('العميل الجديد غير موجود', 404);
    newClient.current_balance = newClient.current_balance + total_price - paid;
    await newClient.save();

    if (qty > 0 && newProductId) {
      const newProduct = await Product.findById(newProductId);
      if (newProduct) {
        newProduct.current_stock = newProduct.current_stock - qty;
        await newProduct.save();
      }
    }

    const updatedTx = await ClientTransaction.findByIdAndUpdate(id, {
      ...data,
      total_price,
      balance_after: newClient.current_balance,
      updated_by: userId
    }, { new: true, runValidators: true });

    return updatedTx;
  }

  async deleteTransaction(id) {
    const tx = await ClientTransaction.findById(id);
    if (!tx) throw new AppError('الفاتورة غير موجودة', 404);

    const client = await Client.findById(tx.client_id);
    if (client) {
      client.current_balance = client.current_balance - tx.total_price + tx.paid_amount;
      await client.save();
    }
    
    if (tx.product_id && tx.quantity > 0) {
      const product = await Product.findById(tx.product_id);
      if (product) {
        product.current_stock = product.current_stock + tx.quantity;
        await product.save();
      }
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