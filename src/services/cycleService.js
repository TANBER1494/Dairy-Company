const mongoose = require('mongoose');
const Cycle = require('../models/Cycle');
const Barn = require('../models/Barn');
const AppError = require('../utils/AppError');

class CycleService {
  
  async startCycle(data, farmId, supervisorId) {
    const {
      local_id,
      barn_id,
      name,
      type,
      start_date,
      initial_bird_count,
    } = data;
    
    const parsedBirdCount = Number(initial_bird_count);

    const existingCycle = await Cycle.findOne({ local_id, farm_id: farmId });
    if (existingCycle) {
      return existingCycle; 
    }

    const barn = await Barn.findOne({ _id: barn_id, farm_id: farmId });
    if (!barn || barn.deleted_at !== null) {
      throw new AppError('العنبر غير موجود', 404);
    }
      
    if (barn.barn_type !== type) {
      throw new AppError(`لا يمكن تشغيل دورة (${type}) في عنبر (${barn.barn_type})`, 400);
    }

    const maxAllowedCount = barn.capacity + (barn.capacity * 0.05);
    if (parsedBirdCount > maxAllowedCount) {
      throw new AppError(`تجاوز السعة القصوى للعنبر`, 400);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const [newCycle] = await Cycle.create([{
        local_id,
        farm_id: farmId,
        barn_id,
        supervisor_id: supervisorId,
        name: name.trim(),
        type,
        status: 'ACTIVE',
        start_date: new Date(start_date),
        initial_bird_count: parsedBirdCount,
        current_bird_count: parsedBirdCount,
        total_dead_birds: 0,
        total_feed_consumed: 0,
        total_eggs_produced: 0,
      }], { session });

      barn.status = 'ACTIVE';
      await barn.save({ session });

      await session.commitTransaction();
      return newCycle;
    } catch (error) {
      await session.abortTransaction();
      if (error.code === 11000) {
         throw new AppError('يوجد دورة نشطة بالفعل في هذا العنبر', 400);
      }
      throw new AppError('فشل تسجيل الدورة', 500);
    } finally {
      session.endSession();
    }
  }

  async closeCycle(cycleId, endDate, farmId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const cycle = await Cycle.findOne({ _id: cycleId, farm_id: farmId }).session(session);
      
      if (!cycle) throw new AppError('الدورة غير موجودة', 404);
      if (cycle.status === 'CLOSED') throw new AppError('تم إغلاق الدورة وأرشفتها مسبقاً', 400);

      cycle.status = 'CLOSED';
      cycle.end_date = new Date(endDate);
      await cycle.save({ session });

      await Barn.findByIdAndUpdate(
        cycle.barn_id,
        { status: 'MAINTENANCE' },
        { session }
      );

      await session.commitTransaction();
      return cycle;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

module.exports = new CycleService();