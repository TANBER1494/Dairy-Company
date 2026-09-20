const Farm = require('../models/Farm');
const AppError = require('../utils/AppError');
const InventoryItem = require('../models/InventoryItem');

class FarmService {
  /**
   * حساب الأيام المتبقية للاشتراك
   * @param {Date} targetDate
   * @private
   */
  _calculateDaysLeft(targetDate) {
    if (!targetDate) return 0;
    const diffInDays = Math.ceil((new Date(targetDate) - new Date()) / (1000 * 60 * 60 * 24));
    return diffInDays > 0 ? diffInDays : 0;
  }

  async getFarmDetails(farmId) {
    const farm = await Farm.findById(farmId).lean();
    
    if (!farm) {
      throw new AppError('المزرعة غير موجودة', 404);
    }

    const targetDate = farm.subscription_status === 'TRIAL' ? farm.trial_ends_at : farm.subscription_ends_at;
    
    const feedItems = await InventoryItem.find({ 
      farm_id: farmId, 
      category: 'FEED', 
      deleted_at: null 
    }).lean();
    
    const totalFeed = feedItems.reduce((acc, item) => acc + item.stock_quantity, 0);

    return {
      ...farm,
      status: farm.subscription_status,
      days_left: this._calculateDaysLeft(targetDate),
      total_feed_stock: totalFeed 
    };
  }


  async updateFarm(farmId, updates) {
    const farm = await Farm.findById(farmId);
    
    if (!farm) {
      throw new AppError('المزرعة غير موجودة', 404);
    }

    if (updates.name) farm.name = updates.name.trim();
    if (updates.location) farm.location = updates.location.trim();

    try {
      await farm.save();
      return farm;
    } catch (error) {
      if (error.code === 11000) {
        throw new AppError('يوجد خطأ في تحديث البيانات', 400);
      }
      throw error;
    }
  }
}

module.exports = new FarmService();