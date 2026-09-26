const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const getNotifications = asyncHandler(async (req, res, next) => {
  const { role, _id } = req.user; 
  
  const query = {
    $or: [
      { target_role: role },
      { target_user_id: _id }
    ]
  };

  const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50).lean();
  res.status(200).json(notifications);
});

const markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findByIdAndUpdate(req.params.id, { is_read: true }, { new: true });
  if (!notification) return next(new AppError('الإشعار غير موجود', 404));
  res.status(200).json({ message: 'تم التحديد كمقروء' });
});

const markAllAsRead = asyncHandler(async (req, res, next) => {
  const { role, _id } = req.user;
  const query = {
    is_read: false,
    $or: [{ target_role: role }, { target_user_id: _id }]
  };

  await Notification.updateMany(query, { is_read: true });
  res.status(200).json({ message: 'تم تحديد الكل كمقروء' });
});

const deleteNotification = asyncHandler(async (req, res, next) => {
  const deleted = await Notification.findByIdAndDelete(req.params.id);
  if (!deleted) return next(new AppError('الإشعار غير موجود', 404));
  res.status(200).json({ message: 'تم حذف الإشعار' });
});

module.exports = { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification 
};