const mongoose = require('mongoose');
const Worker = require('../models/Worker');
const WorkerLog = require('../models/WorkerLog');
const Transaction = require('../models/Transaction');
const AppError = require('../utils/AppError');

class WorkerService {
  
async _calculateWorkerBalance(workerId, farmId) {
    const workerObjectId = new mongoose.Types.ObjectId(workerId);
    const farmObjectId = new mongoose.Types.ObjectId(farmId);

    const worker = await Worker.findOne({ _id: workerObjectId, farm_id: farmObjectId }).lean();
    if (!worker) return { totalEarned: 0, totalDrawn: 0, netBalance: 0, baseDays: 0 };

    // 1. حساب الأيام الأساسية تلقائياً
    const startDate = new Date(worker.hiring_date);
    const endDate = worker.status === 'TERMINATED' ? new Date(worker.termination_date) : new Date();
    
    // تصفير الساعات لضمان دقة حساب الأيام
    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(0, 0, 0, 0);

    const diffTime = Math.abs(endDate - startDate);
    const baseDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const baseEarned = baseDays * worker.base_daily_wage;

    // 2. حساب العلاوات والخصومات (WorkerLogs)
    const logsResult = await WorkerLog.aggregate([
      { $match: { worker_id: workerObjectId, farm_id: farmObjectId } },
      { $group: { 
          _id: null, 
          totalBonusAmount: { $sum: '$earned_amount' }, 
          totalBonusDays: { $sum: '$wage_multiplier' } 
      }}
    ]);

    const bonusAmount = logsResult.length > 0 ? logsResult[0].totalBonusAmount : 0;
    const bonusDays = logsResult.length > 0 ? logsResult[0].totalBonusDays : 0;

    // 3. حساب المسحوبات (السلف)
    const drawnResult = await Transaction.aggregate([
      { 
        $match: { 
          worker_id: workerObjectId, 
          farm_id: farmObjectId,
          type: 'OUT', 
          category: { $in: ['WORKER_ADVANCE', 'WORKER_SALARY'] }
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalDrawn = drawnResult.length > 0 ? drawnResult[0].total : 0;
    
    const totalEarned = baseEarned + bonusAmount;
    const netBalance = totalEarned - totalDrawn;

    return { 
      totalEarned, 
      totalDrawn, 
      netBalance, 
      baseDays, 
      bonusDays, 
      bonusAmount,
      baseEarned
    };
  }

  async createWorker(data) {
    const { local_id, farm_id, name, phone, national_id, base_daily_wage } = data;

    const existingWorker = await Worker.findOne({ local_id, farm_id }).lean();
    if (existingWorker) return { isDuplicate: true, worker: existingWorker };

    try {
      const newWorker = await Worker.create({
        local_id,
        farm_id,
        name: name.trim(),
        phone: phone ? phone.trim() : '',
        national_id: national_id ? national_id.trim() : '',
        base_daily_wage: Number(base_daily_wage)
      });
      return { isDuplicate: false, worker: newWorker };
    } catch (error) {
      if (error.code === 11000) {
        throw new AppError('يوجد عامل مسجل بالفعل بنفس الرقم القومي في هذه المزرعة', 400);
      }
      throw error;
    }
  }

  async getWorkers(farmId, filters) {
    const query = { farm_id: farmId };
    if (filters.status) query.status = filters.status;

    return await Worker.find(query).sort({ status: 1, name: 1 }).lean();
  }

async recordLog(data, userId, farmId) {
    const { local_id, worker_id, log_date, wage_multiplier, notes } = data;

    const worker = await Worker.findOne({ _id: worker_id, farm_id: farmId }).lean();
    if (!worker || worker.status === 'TERMINATED') {
      throw new AppError('العامل غير موجود أو تم إنهاء عمله', 404);
    }

    const earnedAmount = worker.base_daily_wage * Number(wage_multiplier);

    const newLog = await WorkerLog.create({
      local_id,
      farm_id: farmId,
      worker_id,
      log_date: new Date(log_date),
      wage_multiplier: Number(wage_multiplier),
      earned_amount: earnedAmount,
      recorded_by: userId,
      notes: notes ? notes.trim() : 'علاوة / خصم إضافي'
    });

    return { isDuplicate: false, log: newLog };
  }

  async getWorkerStatement(workerId, farmId) {
    const worker = await Worker.findOne({ _id: workerId, farm_id: farmId }).lean();
    if (!worker) throw new AppError('العامل غير موجود أو لا تملك صلاحية الوصول له', 404);

    const periodStart = worker.hiring_date; 

    const { totalEarned, totalDrawn, netBalance } = await this._calculateWorkerBalance(workerId, farmId);

    const logs = await WorkerLog.find({ 
      worker_id: workerId, 
      farm_id: farmId,
      log_date: { $gte: periodStart } 
    })
      .select('log_date wage_multiplier earned_amount notes')
      .sort({ log_date: -1 })
      .lean();

    const transactions = await Transaction.find({ 
      worker_id: workerId, 
      farm_id: farmId,
      type: 'OUT', 
      category: { $in: ['WORKER_ADVANCE', 'WORKER_SALARY'] },
      transaction_date: { $gte: periodStart } 
    })
      .select('amount transaction_date category notes reference_doc')
      .sort({ transaction_date: -1 })
      .lean();

    return {
      worker_info: {
        name: worker.name,
        base_daily_wage: worker.base_daily_wage,
        status: worker.status
      },
      financial_summary: {
        total_earned: totalEarned,
        total_drawn: totalDrawn,
        net_balance: netBalance
      },
      logs_history: logs,
      transactions_history: transactions
    };
  }

  async settleAccount(data, userId, farmId) {
    const { local_id, worker_id, amount_to_pay, transaction_date, notes } = data;

    const existingTransaction = await Transaction.findOne({ local_id, farm_id: farmId }).lean();
    if (existingTransaction) return { isDuplicate: true, transaction: existingTransaction };

    const worker = await Worker.findOne({ _id: worker_id, farm_id: farmId }).lean();
    if (!worker) throw new AppError('العامل غير موجود', 404);

    const newTransaction = await Transaction.create({
      local_id,
      farm_id: farmId,
      worker_id,
      performed_by: userId,
      type: 'OUT',
      category: 'WORKER_SALARY',
      amount: Number(amount_to_pay),
      transaction_date: new Date(transaction_date),
      notes: notes ? notes.trim() : 'تصفية مستحقات',
      reference_doc: `سداد مستحقات العامل: ${worker.name}`
    });

    return { isDuplicate: false, transaction: newTransaction };
  }

  async changeStatus(workerId, status, farmId) {
    const worker = await Worker.findOne({ _id: workerId, farm_id: farmId });
    if (!worker) throw new AppError('العامل غير موجود', 404);

    if (status === 'TERMINATED') {
      const { netBalance } = await this._calculateWorkerBalance(workerId, farmId);
      
      if (netBalance < 0) {
        throw new AppError(`لا يمكن إنهاء عمل العامل وعليه مديونية (سلف) بقيمة ${Math.abs(netBalance)} ج.م.`, 400);
      }
      if (netBalance > 0) {
        throw new AppError(`لا يمكن تصفية العامل، له مستحقات متأخرة بقيمة ${netBalance} ج.م. قم بصرفها أولاً.`, 400);
      }
      worker.termination_date = new Date();
    } else {
      if (worker.status === 'TERMINATED' && status === 'ACTIVE') {
        worker.hiring_date = new Date(); 
      }
      worker.termination_date = null; 
    }

    worker.status = status;
    await worker.save();
    return worker;
  }

  async getAllLogs(farmId) {
    return await WorkerLog.find({ farm_id: farmId }).sort({ log_date: -1 }).lean();
  }
  
}

module.exports = new WorkerService();