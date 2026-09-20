const User = require('../models/User');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Farm = require('../models/Farm');
const AppError = require('../utils/AppError');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');


class AdminService {
  async getDashboardStats() {
    const totalFarms = await Farm.countDocuments();
    const activeFarms = await Farm.countDocuments({ subscription_status: 'ACTIVE' });
    const trialFarms = await Farm.countDocuments({ subscription_status: 'TRIAL' });
    
    const totalUsers = await User.countDocuments({ role: 'SUPERVISOR' });
    const activeUsers = await User.countDocuments({ role: 'SUPERVISOR', status: 'ACTIVE' });

    return {
      farms: { total: totalFarms, active: activeFarms, trial: trialFarms },
      users: { total: totalUsers, active: activeUsers }
    };
  }

async getAllFarms() {
    const farms = await Farm.find()
      .populate('supervisor_id', 'name phone email status')
      .sort({ createdAt: -1 })
      .lean();

    const now = new Date();

    return farms.map(farm => {
      let daysLeft = 0;
      
      if (farm.subscription_status === 'TRIAL' && farm.trial_ends_at) {
        daysLeft = Math.ceil((new Date(farm.trial_ends_at) - now) / (1000 * 60 * 60 * 24));
      } else if (farm.subscription_status === 'ACTIVE' && farm.subscription_ends_at) {
        daysLeft = Math.ceil((new Date(farm.subscription_ends_at) - now) / (1000 * 60 * 60 * 24));
      }
      
      farm.days_left = daysLeft > 0 ? daysLeft : 0; 
      return farm;
    });
  }

  async updateFarmStatus(farmId, status) {
    const validStatuses = ['TRIAL', 'ACTIVE', 'OVERDUE', 'LOCKED'];
    if (!validStatuses.includes(status)) {
      throw new AppError('حالة المزرعة غير صالحة', 400);
    }

    const farm = await Farm.findById(farmId);
    if (!farm) throw new AppError('المزرعة غير موجودة', 404);

    farm.subscription_status = status;
    await farm.save();
    return farm;
  }

  async getAllUsers() {
    return await User.find({ role: 'SUPERVISOR' })
      .populate('farm_id', 'name subscription_status')
      .sort({ createdAt: -1 })
      .lean();
  }

  async updateUserStatus(userId, status) {
    const validStatuses = ['ACTIVE', 'SUSPENDED', 'PENDING'];
    if (!validStatuses.includes(status)) {
      throw new AppError('حالة المستخدم غير صالحة', 400);
    }

    const user = await User.findById(userId);
    if (!user) throw new AppError('المستخدم غير موجود', 404);

    user.status = status;
    
    if (status === 'SUSPENDED') {
      user.current_session_id = null;
    }
    
    await user.save();
    return user;
  }

  async updateUserPassword(userId, newPassword) {
    if (!newPassword || newPassword.length < 6) {
      throw new AppError('يجب أن تتكون كلمة المرور من 6 أحرف كحد أدنى', 400);
    }

    const user = await User.findById(userId);
    if (!user) throw new AppError('المستخدم غير موجود', 404);

    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(newPassword, salt);
    
    user.current_session_id = crypto.randomBytes(16).toString('hex');
    
    await user.save();
    return true;
  }

  async createPlan(data) {
    const { name, months, price } = data;
    return await SubscriptionPlan.create({ name, months, price });
  }

async getAllPlans(isAdmin = false) {
    const query = isAdmin 
      ? { is_deleted: { $ne: true } } 
      : { is_active: true, is_deleted: { $ne: true } };
      
    return await SubscriptionPlan.find(query).sort({ months: 1 }).lean();
  }

  async updatePlan(planId, data) {
    const plan = await SubscriptionPlan.findOne({ _id: planId, is_deleted: false });
    if (!plan) throw new AppError('الباقة غير موجودة أو تم حذفها', 404);

    if (data.name) plan.name = data.name;
    if (data.months) plan.months = data.months;
    if (data.price !== undefined) plan.price = data.price;

    await plan.save();
    return plan;
  }

  async deletePlan(planId) {
    const plan = await SubscriptionPlan.findOne({ _id: planId, is_deleted: false });
    if (!plan) throw new AppError('الباقة غير موجودة أو تم حذفها مسبقاً', 404);

    plan.is_deleted = true;
    plan.is_active = false;
    await plan.save();
    return true;
  }

  async togglePlanStatus(planId) {
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) throw new AppError('الباقة غير موجودة', 404);
    
    plan.is_active = !plan.is_active;
    await plan.save();
    return plan;
  }

}

module.exports = new AdminService();