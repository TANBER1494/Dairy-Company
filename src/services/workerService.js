const Worker = require('../models/Worker');
const AppError = require('../utils/AppError');

class WorkerService {
  async createWorker(data) {
    return await Worker.create(data);
  }

  async getAllWorkers(query = {}) {
    return await Worker.find(query).sort({ createdAt: -1 }).lean();
  }

  async getWorkerById(id) {
    const worker = await Worker.findById(id).lean();
    if (!worker) throw new AppError('العامل غير موجود', 404);
    return worker;
  }

  async updateWorker(id, data) {
    const worker = await Worker.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!worker) throw new AppError('العامل غير موجود', 404);
    return worker;
  }

  async toggleWorkerStatus(id) {
    const worker = await Worker.findById(id);
    if (!worker) throw new AppError('العامل غير موجود', 404);
    worker.is_active = !worker.is_active;
    await worker.save();
    return worker;
  }
}

module.exports = new WorkerService();