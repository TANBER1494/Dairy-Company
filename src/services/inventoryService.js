const mongoose = require('mongoose');
const InventoryItem = require('../models/InventoryItem');
const InventoryMovement = require('../models/InventoryMovement');
const AppError = require('../utils/AppError');

class InventoryService {
  async addInventoryItem(data) {
    const {
      local_id,
      farm_id,
      name,
      category,
      unit,
      min_alert_level,
      unloading_cost,
    } = data;

    const existingItem = await InventoryItem.findOne({
      local_id,
      farm_id,
    }).lean();
    if (existingItem) return { isDuplicate: true, item: existingItem };

    try {
      const newItem = await InventoryItem.create({
        local_id,
        farm_id,
        name: name.trim(),
        category,
        unit,
        min_alert_level: Number(min_alert_level) || 0,
        unloading_cost: Number(unloading_cost) || 0,
      });
      return { isDuplicate: false, item: newItem };
    } catch (error) {
      if (error.code === 11000) {
        throw new AppError('هذا الصنف مسجل بالفعل في مخزن المزرعة', 400);
      }
      throw error;
    }
  }

  async getInventoryItems(farmId) {
    return await InventoryItem.find({ farm_id: farmId, deleted_at: null })
      .sort({ category: 1, name: 1 })
      .lean();
  }

  async recordMovement(data, userId) {
    const {
      local_id,
      farm_id,
      item_id,
      movement_type,
      quantity,
      unit_cost_at_time,
      movement_date,
      reference_doc,
    } = data;

    const existingMovement = await InventoryMovement.findOne({
      local_id,
      farm_id,
    }).lean();
    if (existingMovement)
      return { isDuplicate: true, movement: existingMovement };

    const numericQuantity = Number(quantity);
    const numericCost = Number(unit_cost_at_time);
    const totalValue = numericQuantity * numericCost;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const item = await InventoryItem.findOne({
        _id: item_id,
        farm_id,
      }).session(session);
      if (!item) throw new AppError('الصنف غير موجود', 404);

      let currentStock = item.stock_quantity || 0;

      if (
        [
          'PURCHASE',
          'PRODUCTION',
          'RETURN',
          'ADJUSTMENT',
          'UNLOADING',
        ].includes(movement_type)
      ) {
        currentStock += numericQuantity;
      } else if (['CONSUMPTION', 'SALE'].includes(movement_type)) {
        if (currentStock < numericQuantity) {
          if (!(movement_type === 'SALE' && item.category === 'PRODUCT')) {
            throw new AppError(
              `رصيد الصنف لا يكفي. المتاح: ${currentStock}`,
              400
            );
          }
        }
        currentStock -= numericQuantity;
      }

      item.stock_quantity = currentStock;
      await item.save({ session });

      const movement = await InventoryMovement.create(
        [
          {
            local_id,
            farm_id,
            item_id,
            performed_by: userId,
            movement_type,
            quantity: numericQuantity,
            unit_cost_at_time: numericCost,
            total_value: totalValue,
            movement_date,
            reference_doc,
            status: 'COMPLETED',
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();
      return { isDuplicate: false, movement: movement[0] };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async getItemMovements(itemId, farmId) {
    const item = await InventoryItem.findOne({
      _id: itemId,
      farm_id: farmId,
    }).lean();
    if (!item)
      throw new AppError('الصنف غير موجود أو لا تملك صلاحية الوصول إليه', 404);

    const movements = await InventoryMovement.find({
      item_id: itemId,
      farm_id: farmId,
    })
      .populate('performed_by', 'name role')
      .sort({ movement_date: -1 })
      .lean();

    return movements.map((m) => ({
      ...m,
      performed_by: m.performed_by ? m.performed_by.name : null,
    }));
  }

  async produceFeed(data, farmId, userId) {
    const { local_id, item_id, quantity, unit_cost } = data;
    return await this.recordMovement(
      {
        local_id,
        farm_id: farmId,
        item_id,
        movement_type: 'PRODUCTION',
        quantity,
        unit_cost_at_time: unit_cost,
        movement_date: new Date(),
        reference_doc: 'إنتاج محلي (مدشة داخلية)',
      },
      userId
    );
  }

  async recordDokhan(data, farmId, userId) {
    const { local_id, item_id, quantity, movement_date, notes } = data;

    const item = await InventoryItem.findOne({
      _id: item_id,
      farm_id: farmId,
      deleted_at: null,
    }).lean();

    if (!item) throw new AppError('الصنف غير موجود', 404);
    if (item.category !== 'RAW_MATERIAL')
      throw new AppError('يمكن تسجيل الدخان لخامات المدشة فقط', 400);

    const unitCost = item.unloading_cost || 0;
    const docReference = notes
      ? `تنزيل دخان - ${notes.trim()}`
      : 'تسجيل تنزيل دخان (خامات)';

    return await this.recordMovement(
      {
        local_id,
        farm_id: farmId,
        item_id,
        movement_type: 'UNLOADING',
        quantity,
        unit_cost_at_time: unitCost,
        movement_date: movement_date,
        reference_doc: docReference,
      },
      userId
    );
  }

  async updateInventoryItem(itemId, farmId, updates) {
    const item = await InventoryItem.findOne({
      _id: itemId,
      farm_id: farmId,
      deleted_at: null,
    });
    if (!item) throw new AppError('الصنف غير موجود أو تم حذفه مسبقاً', 404);

    if (updates.name) item.name = updates.name.trim();
    if (updates.category) item.category = updates.category;
    if (updates.unit) item.unit = updates.unit;
    if (updates.min_alert_level !== undefined)
      item.min_alert_level = Number(updates.min_alert_level);
    if (updates.unloading_cost !== undefined)
      item.unloading_cost = Number(updates.unloading_cost);

    try {
      await item.save();
      return item;
    } catch (error) {
      if (error.code === 11000)
        throw new AppError('صنف آخر مسجل بنفس الاسم', 400);
      throw error;
    }
  }

  async updateDokhan(movementId, farmId, data) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const movement = await InventoryMovement.findOne({
        _id: movementId,
        farm_id: farmId,
        movement_type: 'UNLOADING',
      }).session(session);

      if (!movement) throw new AppError('سجل الدخان غير موجود', 404);

      const today = new Date();
      const createdDate = new Date(movement.createdAt);
      if (today.toDateString() !== createdDate.toDateString()) {
        throw new AppError(
          'غير مسموح بتعديل سجل الدخان. التعديل متاح لليوم الحالي فقط.',
          400
        );
      }

      const item = await InventoryItem.findOne({
        _id: movement.item_id,
        farm_id: farmId,
      }).session(session);
      if (!item) throw new AppError('الصنف المرتبط بهذه الحركة غير موجود', 404);

      item.stock_quantity -= movement.quantity;

      const newQuantity = Number(data.quantity);
      item.stock_quantity += newQuantity;
      await item.save({ session });

      movement.quantity = newQuantity;
      movement.total_value = newQuantity * movement.unit_cost_at_time;

      if (data.movement_date)
        movement.movement_date = new Date(data.movement_date);
      if (data.notes !== undefined) {
        movement.reference_doc = data.notes
          ? `تنزيل دخان - ${data.notes.trim()}`
          : 'تسجيل تنزيل دخان (خامات)';
      }

      await movement.save({ session });
      await session.commitTransaction();
      return movement;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async deleteInventoryItem(itemId, farmId) {
    const item = await InventoryItem.findOne({
      _id: itemId,
      farm_id: farmId,
      deleted_at: null,
    });
    if (!item) throw new AppError('الصنف غير موجود', 404);

    item.deleted_at = new Date();
    await item.save();
    return true;
  }
}

module.exports = new InventoryService();
