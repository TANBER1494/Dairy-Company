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

  async getClientStatement(searchKey) {
    let query = {};
    if (!isNaN(searchKey)) {
      query.code = Number(searchKey);
    } else {
      query.name = { $regex: searchKey, $options: 'i' };
    }
    const client = await Client.findOne(query).lean();
    if (!client) throw new AppError('العميل غير موجود بهذا الكود أو الاسم', 404);

    const transactions = await ClientTransaction.find({ client_id: client._id })
      .populate('worker_id', 'name')
      .populate('product_id', 'name')
      .populate('created_by', 'name')
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return { client_info: client, transactions_history: transactions };
  }
}

module.exports = new ClientService();