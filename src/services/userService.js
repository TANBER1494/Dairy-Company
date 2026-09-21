const User = require('../models/User');
const AppError = require('../utils/AppError');
const bcrypt = require('bcryptjs');

class UserService {
  async createUser(data) {
    const { name, username, role, password, phone } = data;
    
    if (!password || password.length < 6) {
      throw new AppError('يجب أن تتكون كلمة المرور من 6 أحرف كحد أدنى', 400);
    }

    const existingUser = await User.findOne({ username: username.toLowerCase(), deleted_at: null });
    if (existingUser) {
      throw new AppError('اسم المستخدم مسجل بالفعل، يرجى اختيار اسم آخر', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      username,
      role,
      password_hash,
      phone
    });

    user.password_hash = undefined;
    return user;
  }

  async getAllUsers(query = {}) {
    query.deleted_at = null; 
    return await User.find(query).select('-password_hash').sort({ createdAt: -1 }).lean();
  }

  async updateUserStatus(id, status) {
    const validStatuses = ['ACTIVE', 'SUSPENDED'];
    if (!validStatuses.includes(status)) throw new AppError('حالة الحساب غير صالحة', 400);

    const user = await User.findOneAndUpdate(
      { _id: id, deleted_at: null },
      { status },
      { new: true, runValidators: true }
    ).select('-password_hash');
    
    if (!user) throw new AppError('المستخدم غير موجود', 404);
    return user;
  }

  async resetUserPassword(id, newPassword) {
    if (!newPassword || newPassword.length < 6) {
      throw new AppError('يجب أن تتكون كلمة المرور من 6 أحرف كحد أدنى', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    const user = await User.findOneAndUpdate(
      { _id: id, deleted_at: null },
      { password_hash },
      { new: true }
    );

    if (!user) throw new AppError('المستخدم غير موجود', 404);
    return true;
  }

  async softDeleteUser(id) {
    const user = await User.findOneAndUpdate(
      { _id: id, deleted_at: null },
      { deleted_at: new Date(), status: 'SUSPENDED' },
      { new: true }
    );
    if (!user) throw new AppError('المستخدم غير موجود', 404);
    return true;
  }
}

module.exports = new UserService();