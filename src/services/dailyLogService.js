const mongoose = require('mongoose');
const DailyLog = require('../models/DailyLog');
const Cycle = require('../models/Cycle');
const InventoryItem = require('../models/InventoryItem');
const InventoryMovement = require('../models/InventoryMovement');
const AppError = require('../utils/AppError');

class DailyLogService {
  
  async createBulkDailyLogs(logsArray, userId, farmId) {
    if (!logsArray || !Array.isArray(logsArray) || logsArray.length === 0) {
      throw new AppError('لا توجد بيانات لتسجيلها', 400);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const createdLogs = [];
      const highMortalityAlerts = []; 

      for (const data of logsArray) {
        const {
          local_id, barn_id, barn_name, cycle_id, log_date, age_in_days, mortality_count,
          feed_item_id, feed_consumed_bags, egg_trays_produced, consumed_medications, notes
        } = data;

        const normalizedLogDate = new Date(log_date);
        normalizedLogDate.setUTCHours(0, 0, 0, 0);

        const existingLog = await DailyLog.findOne({ local_id, farm_id: farmId }).session(session);
        if (existingLog) continue; 

        const duplicateDateLog = await DailyLog.findOne({ cycle_id, farm_id: farmId, log_date: normalizedLogDate }).session(session);
        if (duplicateDateLog) {
           throw new AppError(`يوجد يومية مسجلة بالفعل لعنبر (${barn_name}) في هذا التاريخ.`, 400);
        }

        const cycle = await Cycle.findOne({ _id: cycle_id, farm_id: farmId, status: 'ACTIVE' }).session(session);
        if (!cycle) throw new AppError(`الدورة غير نشطة لعنبر (${barn_name})`, 400);

        const totalDeadBirds = Number(mortality_count) || 0;
        
        if (totalDeadBirds > 10) highMortalityAlerts.push({ barn_name, dead_count: totalDeadBirds });

        if (cycle.current_bird_count < totalDeadBirds) {
          throw new AppError(`النافق يتجاوز العدد الحي في عنبر (${barn_name})`, 400);
        }

        if (totalDeadBirds > 0) {
          cycle.current_bird_count -= totalDeadBirds;
          cycle.total_dead_birds = (cycle.total_dead_birds || 0) + totalDeadBirds;
        }

        const bagsCount = Number(feed_consumed_bags) || 0;
        if (feed_item_id && bagsCount > 0) {
          const invItem = await InventoryItem.findOneAndUpdate(
            { _id: feed_item_id, farm_id: farmId, stock_quantity: { $gte: bagsCount } },
            { $inc: { stock_quantity: -bagsCount } },
            { new: true, session }
          );

          if (!invItem) throw new AppError(`عفواً، رصيد العلف لا يكفي لعنبر (${barn_name}).`, 400);
          cycle.total_feed_consumed += bagsCount;

          await InventoryMovement.create([{
            local_id: `${local_id}_FEED_OUT`, farm_id: farmId, item_id: feed_item_id,
            cycle_id: cycle_id, performed_by: userId, movement_type: 'CONSUMPTION', quantity: bagsCount,
            unit_cost_at_time: 0, total_value: 0, movement_date: normalizedLogDate,
            reference_doc: `استهلاك علف (يومية مجمعة)`
          }], { session });
        }

        const processedMedications = [];
        if (consumed_medications && Array.isArray(consumed_medications)) {
          for (const med of consumed_medications) {
            const medQty = Number(med.quantity) || 0;
            if (!med.item_id || medQty <= 0) continue;

            const invItem = await InventoryItem.findOneAndUpdate(
              { _id: med.item_id, farm_id: farmId, stock_quantity: { $gte: medQty } },
              { $inc: { stock_quantity: -medQty } },
              { new: true, session }
            );

            if (!invItem) throw new AppError(`الرصيد لا يكفي في المخزن الرئيسي للدواء المختار لعنبر (${barn_name})`, 400);

            await InventoryMovement.create([{
              local_id: `${local_id}_MED_${med.item_id}`, farm_id: farmId,
              item_id: med.item_id, cycle_id: cycle_id, performed_by: userId, movement_type: 'CONSUMPTION', quantity: medQty,
              unit_cost_at_time: 0, total_value: 0, movement_date: normalizedLogDate,
              reference_doc: `صرف أدوية من المخزن لعنبر (${barn_name})`
            }], { session });

            processedMedications.push({ item_id: invItem._id, name: invItem.name, quantity: medQty });
          }
        }

        const physicalEggTrays = Number(egg_trays_produced) || 0;
        let currentEggStock = 0;

        if (physicalEggTrays > 0) {
          let eggItem = await InventoryItem.findOne({ farm_id: farmId, category: 'PRODUCT', unit: 'TRAY' }).session(session);
          if (!eggItem) {
            const [newEggItem] = await InventoryItem.create([{
              local_id: `auto_egg_product_${farmId}`, farm_id: farmId, name: 'بيض مائدة',
              category: 'PRODUCT', unit: 'TRAY', stock_quantity: 0, average_unit_cost: 0,
            }], { session });
            eggItem = newEggItem;
          }

          eggItem.stock_quantity += physicalEggTrays;
          await eggItem.save({ session });
          currentEggStock = eggItem.stock_quantity;
          
          cycle.total_eggs_produced += physicalEggTrays;

          await InventoryMovement.create([{
            local_id: `${local_id}_EGG_IN`, farm_id: farmId, item_id: eggItem._id,
            cycle_id: cycle_id, performed_by: userId, movement_type: 'PRODUCTION', quantity: physicalEggTrays,
            unit_cost_at_time: 0, total_value: 0, movement_date: normalizedLogDate,
            reference_doc: `إنتاج بيض (يومية مجمعة)`
          }], { session });
        } else {
           const eggItem = await InventoryItem.findOne({ farm_id: farmId, category: 'PRODUCT', unit: 'TRAY' }).session(session);
           if (eggItem) currentEggStock = eggItem.stock_quantity;
        }

        await cycle.save({ session });
        let finalNotes = notes ? notes.trim() : '';

        const [newLog] = await DailyLog.create([{
          local_id, farm_id: farmId, barn_id, cycle_id, recorded_by: userId,
          log_date: normalizedLogDate, age_in_days, mortality_count: totalDeadBirds,
          feed_item_id: feed_item_id, feed_consumed_bags: bagsCount, 
          egg_trays_produced: physicalEggTrays, egg_stock_snapshot: currentEggStock, 
          consumed_medications: processedMedications, notes: finalNotes
        }], { session });

        const logResponse = newLog.toObject ? newLog.toObject() : newLog;
        logResponse.barn_name = barn_name; 
        createdLogs.push(logResponse);
      }

      await session.commitTransaction();
      return { logs: createdLogs, highMortalityAlerts };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

async updateBulkDailyLogs(oldDateStr, newDateStr, logsArray, userId, farmId) {
    if (!logsArray || logsArray.length === 0) throw new AppError('لا توجد بيانات لتعديلها', 400);

    const today = new Date();
    const oldDateObj = new Date(oldDateStr);
    const newDateObj = new Date(newDateStr);

    if (today.toDateString() !== oldDateObj.toDateString() || today.toDateString() !== newDateObj.toDateString()) {
      throw new AppError('إجراء مرفوض: غير مسموح بتعديل يوميات سابقة. التعديل متاح لليوم الحالي فقط.', 400);
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const oldDate = new Date(oldDateStr);
      oldDate.setUTCHours(0, 0, 0, 0);

      const newDate = new Date(newDateStr);
      newDate.setUTCHours(0, 0, 0, 0);

      const cycleIds = logsArray.map(l => l.cycle_id);

      if (oldDate.getTime() !== newDate.getTime()) {
        const existingNewDateLogs = await DailyLog.find({ 
          cycle_id: { $in: cycleIds }, 
          farm_id: farmId, 
          log_date: newDate 
        }).session(session);
        
        if (existingNewDateLogs.length > 0) {
          throw new AppError('التاريخ الجديد يحتوي بالفعل على يوميات مسجلة. يرجى اختيار تاريخ آخر.', 400);
        }
      }

      const oldLogs = await DailyLog.find({ cycle_id: { $in: cycleIds }, farm_id: farmId, log_date: oldDate }).session(session);
      
      for (const oldLog of oldLogs) {
        const cycle = await Cycle.findById(oldLog.cycle_id).session(session);
        if (cycle) {
          cycle.current_bird_count += oldLog.mortality_count;
          cycle.total_dead_birds -= oldLog.mortality_count;
          
          if (oldLog.feed_item_id && oldLog.feed_consumed_bags > 0) {
            await InventoryItem.updateOne({ _id: oldLog.feed_item_id }, { $inc: { stock_quantity: oldLog.feed_consumed_bags } }, { session });
            cycle.total_feed_consumed -= oldLog.feed_consumed_bags;
          }
          
          for (const med of oldLog.consumed_medications) {
            await InventoryItem.updateOne({ _id: med.item_id }, { $inc: { stock_quantity: med.quantity } }, { session });
          }
          
          if (oldLog.egg_trays_produced > 0) {
            const eggItem = await InventoryItem.findOne({ farm_id: farmId, category: 'PRODUCT', unit: 'TRAY' }).session(session);
            if (eggItem) {
              eggItem.stock_quantity -= oldLog.egg_trays_produced;
              await eggItem.save({ session });
            }
            cycle.total_eggs_produced -= oldLog.egg_trays_produced;
          }
          await cycle.save({ session });
        }

        await InventoryMovement.deleteMany({ local_id: { $regex: `^${oldLog.local_id}` } }).session(session);
        await DailyLog.deleteOne({ _id: oldLog._id }).session(session);
      }

      const newLogsToCreate = logsArray.map(log => ({
        ...log,
        log_date: newDateStr
      }));

      const createdLogs = [];
      
      for (const data of newLogsToCreate) {
        const { local_id, barn_id, barn_name, cycle_id, age_in_days, mortality_count, feed_item_id, feed_consumed_bags, egg_trays_produced, consumed_medications, notes } = data;
        
        const cycle = await Cycle.findOne({ _id: cycle_id, farm_id: farmId }).session(session);
        if (!cycle) continue;

        const totalDeadBirds = Number(mortality_count) || 0;
        if (cycle.current_bird_count < totalDeadBirds) throw new AppError(`النافق يتجاوز العدد الحي في عنبر (${barn_name})`, 400);

        if (totalDeadBirds > 0) {
          cycle.current_bird_count -= totalDeadBirds;
          cycle.total_dead_birds += totalDeadBirds;
        }

        const bagsCount = Number(feed_consumed_bags) || 0;
        if (feed_item_id && bagsCount > 0) {
          const invItem = await InventoryItem.findOneAndUpdate(
            { _id: feed_item_id, farm_id: farmId, stock_quantity: { $gte: bagsCount } },
            { $inc: { stock_quantity: -bagsCount } },
            { new: true, session }
          );
          if (!invItem) throw new AppError(`عفواً، رصيد العلف لا يكفي لعنبر (${barn_name}).`, 400);
          cycle.total_feed_consumed += bagsCount;

          await InventoryMovement.create([{
            local_id: `${local_id}_FEED_OUT`, farm_id: farmId, item_id: feed_item_id, cycle_id: cycle_id, performed_by: userId, movement_type: 'CONSUMPTION', quantity: bagsCount, unit_cost_at_time: 0, total_value: 0, movement_date: newDate, reference_doc: `تعديل استهلاك علف`
          }], { session });
        }

        const processedMedications = [];
        if (consumed_medications && Array.isArray(consumed_medications)) {
          for (const med of consumed_medications) {
            const medQty = Number(med.quantity) || 0;
            if (!med.item_id || medQty <= 0) continue;
            const invItem = await InventoryItem.findOneAndUpdate({ _id: med.item_id, farm_id: farmId, stock_quantity: { $gte: medQty } }, { $inc: { stock_quantity: -medQty } }, { new: true, session });
            if (!invItem) throw new AppError(`الرصيد لا يكفي في المخزن للدواء المختار`, 400);
            await InventoryMovement.create([{ local_id: `${local_id}_MED_${med.item_id}`, farm_id: farmId, item_id: med.item_id, cycle_id: cycle_id, performed_by: userId, movement_type: 'CONSUMPTION', quantity: medQty, unit_cost_at_time: 0, total_value: 0, movement_date: newDate, reference_doc: `تعديل أدوية` }], { session });
            processedMedications.push({ item_id: invItem._id, name: invItem.name, quantity: medQty });
          }
        }

        const physicalEggTrays = Number(egg_trays_produced) || 0;
        let currentEggStock = 0;
        if (physicalEggTrays > 0) {
          let eggItem = await InventoryItem.findOne({ farm_id: farmId, category: 'PRODUCT', unit: 'TRAY' }).session(session);
          if (!eggItem) {
            const [newEggItem] = await InventoryItem.create([{ local_id: `auto_egg_product_${farmId}`, farm_id: farmId, name: 'بيض مائدة', category: 'PRODUCT', unit: 'TRAY', stock_quantity: 0, average_unit_cost: 0 }], { session });
            eggItem = newEggItem;
          }
          eggItem.stock_quantity += physicalEggTrays;
          await eggItem.save({ session });
          currentEggStock = eggItem.stock_quantity;
          cycle.total_eggs_produced += physicalEggTrays;
          await InventoryMovement.create([{ local_id: `${local_id}_EGG_IN`, farm_id: farmId, item_id: eggItem._id, cycle_id: cycle_id, performed_by: userId, movement_type: 'PRODUCTION', quantity: physicalEggTrays, unit_cost_at_time: 0, total_value: 0, movement_date: newDate, reference_doc: `تعديل إنتاج بيض` }], { session });
        } else {
           const eggItem = await InventoryItem.findOne({ farm_id: farmId, category: 'PRODUCT', unit: 'TRAY' }).session(session);
           if (eggItem) currentEggStock = eggItem.stock_quantity;
        }

        await cycle.save({ session });
        const [newLog] = await DailyLog.create([{
          local_id, farm_id: farmId, barn_id, cycle_id, recorded_by: userId, log_date: newDate, age_in_days, mortality_count: totalDeadBirds,
          feed_item_id: feed_item_id, feed_consumed_bags: bagsCount, egg_trays_produced: physicalEggTrays, egg_stock_snapshot: currentEggStock, consumed_medications: processedMedications, notes: notes ? notes.trim() : ''
        }], { session });

        const logResponse = newLog.toObject ? newLog.toObject() : newLog;
        logResponse.barn_name = barn_name; 
        createdLogs.push(logResponse);
      }

      await session.commitTransaction();
      return createdLogs;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getLogsByCycle(cycleId, farmId) {
    const cycle = await Cycle.findOne({ _id: cycleId, farm_id: farmId }).populate('barn_id', 'name').lean();
    if (!cycle) throw new AppError('الدورة غير موجودة', 403);

    const logs = await DailyLog.find({ cycle_id: cycleId, farm_id: farmId }).sort({ log_date: -1 }).lean();
    const barnName = (cycle.barn_id && cycle.barn_id.name) ? cycle.barn_id.name : 'عنبر غير معروف';

    return logs.map(log => ({ ...log, barn_name: barnName }));
  }
}
module.exports = new DailyLogService();