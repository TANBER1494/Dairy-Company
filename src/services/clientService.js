const Client = require('../models/Client');
const AppError = require('../utils/AppError');
const ClientTransaction = require('../models/ClientTransaction');

class ClientService {
  async createClient(data) {
    const existingClient = await Client.findOne({ code: data.code });
    if (existingClient) throw new AppError('كود العميل مسجل بالفعل', 400);
    data.current_balance = 0; 
    return await Client.create(data);
  }

  async getAllClients(query = {}) {
    const filter = {};
    if (query.active !== undefined) {
      filter.is_active = query.active === 'true';
    }
    if (query.address) {
      filter.address = { $regex: query.address, $options: 'i' };
    }
    return await Client.find(filter).sort({ code: 1 }).lean();
  }

  async getClientById(id) {
    const client = await Client.findById(id).lean();
    if (!client) throw new AppError('العميل غير موجود', 404);
    return client;
  }

  async updateClient(id, data) {
    if (data.code) {
      const existingClient = await Client.findOne({ code: data.code, _id: { $ne: id } });
      if (existingClient) throw new AppError('كود العميل مستخدم لعميل آخر', 400);
    }
    delete data.current_balance;
    const client = await Client.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!client) throw new AppError('العميل غير موجود', 404);
    return client;
  }

  async toggleClientStatus(id) {
    const client = await Client.findById(id);
    if (!client) throw new AppError('العميل غير موجود', 404);
    client.is_active = !client.is_active;
    await client.save();
    return client;
  }

  async getClientStatement(searchKey, page = 1, limit = 50) {
    let query = {};
    if (!isNaN(searchKey)) {
      query.code = Number(searchKey);
    } else {
      query.name = { $regex: searchKey, $options: 'i' };
    }
    const client = await Client.findOne(query).lean();
    if (!client) throw new AppError('العميل غير موجود بهذا الكود أو الاسم', 404);

    const skip = (page - 1) * limit;

    const [transactions, totalItems] = await Promise.all([
      ClientTransaction.find({ client_id: client._id })
        .populate('worker_id', 'name')
        .populate('product_id', 'name')
        .populate('created_by', 'name')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ClientTransaction.countDocuments({ client_id: client._id })
    ]);

    return { 
      client_info: client, 
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
    const client = await Client.findById(id);
    if (!client) throw new AppError('العميل غير موجود', 404);

    const openTransactions = await ClientTransaction.find({ client_id: id, is_settled: false });
    
    let dbTotalPrices = 0;
    let previousAdvances = 0;
    
    openTransactions.forEach(tx => {
        dbTotalPrices += (tx.total_price || 0);
        previousAdvances += (tx.paid_amount || 0);
    });
    
    const grossMilkValue = Number(payload.total_amount) || 0; 
    const newPayment = Number(payload.paid_amount) || 0;      

    const periodNet = grossMilkValue - previousAdvances - newPayment;
    client.current_balance += periodNet;
    await client.save();

    await ClientTransaction.updateMany(
      { client_id: id, is_settled: false },
      { $set: { is_settled: true } }
    );

    const currentHour = parseInt(new Date().toLocaleString("en-US", {timeZone: "Africa/Cairo", hour: '2-digit', hour12: false}));
    const currentShift = (currentHour >= 12) ? 'EVENING' : 'MORNING';

    const missingMilkValue = grossMilkValue - dbTotalPrices;

    await ClientTransaction.create({
      client_id: id,
      quantity: 0,
      unit_price: 0,
      total_price: missingMilkValue > 0 ? missingMilkValue : 0,
      paid_amount: newPayment,
      shift: currentShift,
      balance_after: client.current_balance,
      is_settled: true,
      notes: "تسوية وقفل دفتر",
      created_by: userId
    });

    return client;
  }
}

module.exports = new ClientService();