const SupplierTransaction = require('../models/SupplierTransaction');
const ClientTransaction = require('../models/ClientTransaction');
const Expense = require('../models/Expense');
const Supplier = require('../models/Supplier');
const Client = require('../models/Client');
const Product = require('../models/Product');
const DailyReport = require('../models/DailyReport');

class DashboardService {
  _getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async getSummary(query) {
    let matchStage = {};
    let expenseMatchStage = {};

    if (query.startDate || query.endDate) {
      matchStage.date = {};
      expenseMatchStage.date = {};
      
      if (query.startDate) {
        const start = new Date(query.startDate);
        matchStage.date.$gte = start;
        expenseMatchStage.date.$gte = start;
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        matchStage.date.$lte = end;
        expenseMatchStage.date.$lte = end;
      }
    }

    const clientsData = await ClientTransaction.aggregate([
      { $match: matchStage },
      { $group: { _id: null, totalPaid: { $sum: '$paid_amount' }, totalSales: { $sum: '$total_price' } } }
    ]);

    const suppliersData = await SupplierTransaction.aggregate([
      { $match: matchStage },
      { $group: { _id: null, totalPaid: { $sum: '$paid_amount' }, totalPurchases: { $sum: '$total_price' } } }
    ]);

    const expensesData = await Expense.aggregate([
      { $match: expenseMatchStage },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalClientPayments = clientsData[0]?.totalPaid || 0;
    const totalSales = clientsData[0]?.totalSales || 0;
    
    const totalSupplierPayments = suppliersData[0]?.totalPaid || 0;
    const totalPurchases = suppliersData[0]?.totalPurchases || 0;
    
    const totalExpenses = expensesData[0]?.total || 0;

    const netCashFlow = totalClientPayments - totalSupplierPayments - totalExpenses;

    const totalSupplierDebts = await Supplier.aggregate([
      { $group: { _id: null, total: { $sum: '$current_balance' } } }
    ]);

    const totalClientDebts = await Client.aggregate([
      { $group: { _id: null, total: { $sum: '$current_balance' } } }
    ]);

    const currentStock = await Product.find().select('name current_stock current_price').lean();

    return {
      financialFlow: {
        totalSales,
        totalPurchases,
        totalExpenses,
        totalClientPayments,
        totalSupplierPayments,
        netCashFlow
      },
      balances: {
        totalDebtsToSuppliers: totalSupplierDebts[0]?.total || 0,
        totalDebtsFromClients: totalClientDebts[0]?.total || 0,
      },
      inventory: currentStock
    };
  }

  async calculateLiveDailyReport(targetDate, shift = null) {
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const txQuery = { date: { $gte: startOfDay,$lte: endOfDay } };
    if (shift) txQuery.shift = shift;

    const todayTransactions = await SupplierTransaction.find(txQuery)
      .populate('worker_id', 'name')
      .populate('product_id', 'name')
      .lean();

    const suppliedSupplierIds = [...new Set(todayTransactions.map(tx => tx.supplier_id.toString()))];

    const targetSuppliers = await Supplier.find({
      $or: [
        { is_active: true },
        { _id: { $in: suppliedSupplierIds } }
      ]
    }).select('name code phone address is_active').lean();

    const supplied = [];
    const pending = [];

    targetSuppliers.forEach(supplier => {
      if (suppliedSupplierIds.includes(supplier._id.toString())) {
        const supplierTx = todayTransactions.filter(
          tx => tx.supplier_id.toString() === supplier._id.toString()
        );
        supplied.push({ supplier, transactions: supplierTx });
      } else {
        pending.push(supplier);
      }
    });

    return {
      date_string: this._getLocalDateString(startOfDay),
      shift: shift || 'ALL',
      totalActiveSuppliers: targetSuppliers.length,
      suppliedCount: supplied.length,
      pendingCount: pending.length,
      supplied,
      pending
    };
  }

  async getDailyCollectionReport(query) {
    const requestDate = query.date ? new Date(query.date) : new Date();
    
    const dateString = this._getLocalDateString(requestDate);
    const todayString = this._getLocalDateString(new Date());

    if (dateString === todayString) {
      return await this.calculateLiveDailyReport(requestDate, query.shift);
    } 
    
    const archivedReport = await DailyReport.findOne({ date_string: dateString }).lean();
    
    if (archivedReport) {
      return archivedReport;
    } else {
      return await this.calculateLiveDailyReport(requestDate, query.shift);
    }
  }
}

module.exports = new DashboardService();