const SupplierTransaction = require('../models/SupplierTransaction');
const ClientTransaction = require('../models/ClientTransaction');
const Expense = require('../models/Expense');
const Supplier = require('../models/Supplier');
const Client = require('../models/Client');
const Product = require('../models/Product');

class DashboardService {
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
}

module.exports = new DashboardService();