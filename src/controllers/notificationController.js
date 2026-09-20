const Notification = require('../models/Notification');
const User = require('../models/User'); 
const admin = require('firebase-admin');
const socket = require('../models/socket'); 
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Farm = require('../models/Farm');

try {
  let serviceAccount;

  if (process.env.FIREBASE_BASE64_KEY) {
    const decodedKey = Buffer.from(process.env.FIREBASE_BASE64_KEY, 'base64').toString('utf8');
    serviceAccount = JSON.parse(decodedKey);
    console.log('✅ Loaded Firebase Config via Base64');
  } 
  else if (process.env.FIREBASE_PRIVATE_KEY) {
    serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  } 
  else {
    serviceAccount = require('../config/firebase-key.json');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin Initialized Successfully');
} catch (error) {
  console.error('❌ فشل تهيئة Firebase Admin:', error.message);
}

const sendAppNotification = async ({ title, message, type, target_role, target_user_id, farm_id, link }) => {
  try {
    const newNotification = await Notification.create({
      title, message, type, target_role, target_user_id, farm_id, link
    });

    let room;
    if (target_role === 'SUPER_ADMIN') room = 'SUPER_ADMIN_ROOM';
    else if (target_user_id) room = target_user_id.toString();
    else if (farm_id) room = farm_id.toString(); 

    if (room && socket.getIO()) {
      socket.getIO().to(room).emit('new_notification', newNotification);
    }

    // 3. تجهيز الفلاتر لجلب توكنات FCM
    let query = { status: 'ACTIVE', fcm_token: { $ne: null } };
    
    if (target_role === 'SUPER_ADMIN') {
      query.role = 'SUPER_ADMIN';
    } else if (target_role === 'SUPERVISOR') {
      query.role = 'SUPERVISOR';
      query.farm_id = farm_id;
      if (target_user_id) query._id = target_user_id; 
    } else if (target_user_id) {
      query._id = target_user_id;
    }

    const targetUsers = await User.find(query).select('fcm_token').lean();
    const tokens = targetUsers.map(user => user.fcm_token).filter(Boolean);

    if (tokens.length > 0) {
      const payload = {
        notification: {
          title: title,
          body: message,
        },
        android: {
          notification: {
            sound: 'default',
            channelId: 'poultry_erp_high_importance_channel' 
          }
        },
        apns: { 
          payload: {
            aps: {
              sound: 'default'
            }
          }
        },
        data: {
          url: String(link || '/'),
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        },
        tokens: tokens, 
      };

      const response = await admin.messaging().sendEachForMulticast(payload);
      console.log(`🚀 FCM Sent: ${response.successCount} Success, ${response.failureCount} Failed`);
    }

    return newNotification;
  } catch (error) {
    console.error('❌ خطأ في نظام الإرسال المزدوج للإشعارات:', error);
  }
};

const broadcastAppNotification = async ({ title, message, link }) => {
  try {
    const activeFarms = await Farm.find({ 
      subscription_status: { $in: ['ACTIVE', 'TRIAL'] } 
    }).select('_id').lean();

    if (activeFarms.length > 0) {
      const notificationsToInsert = activeFarms.map(farm => ({
        farm_id: farm._id,
        target_role: 'SUPERVISOR',
        title,
        message,
        type: 'SYSTEM',
        link: link || null,
      }));
      await Notification.insertMany(notificationsToInsert);
    }

    const io = socket.getIO();
    if (io) {
      const notifData = { title, message, type: 'SYSTEM', link, target_role: 'SUPERVISOR', createdAt: new Date() };
      
      activeFarms.forEach(farm => {
        io.to(farm._id.toString()).emit('new_notification', notifData);
      });
      io.to('SUPER_ADMIN_ROOM').emit('new_notification', notifData);
    }

    const activeUsers = await User.find({
      role: 'SUPERVISOR',
      status: 'ACTIVE',
      fcm_token: { $ne: null }
    }).select('fcm_token').lean();

    const tokens = [...new Set(activeUsers.map(user => user.fcm_token).filter(Boolean))];

    if (tokens.length > 0) {
      const payload = {
        notification: { title, body: message },
        android: {
          notification: {
            icon: '@mipmap/ic_launcher',
            sound: 'default',
            channelId: 'poultry_erp_high_importance_channel'
          }
        },
        apns: { payload: { aps: { sound: 'default' } } },
        data: { url: String(link || '/'), click_action: 'FLUTTER_NOTIFICATION_CLICK' },
        tokens: tokens, 
      };

      const response = await admin.messaging().sendEachForMulticast(payload);
      console.log(`Global Broadcast FCM Sent: ${response.successCount} Success, ${response.failureCount} Failed`);
    }

    return { success: true, farmsCount: activeFarms.length, tokensCount: tokens.length };
  } catch (error) {
    console.error('❌ خطأ في نظام البث الإشعاري العام:', error);
    throw new AppError('فشل إرسال البث الإشعاري، يرجى المحاولة لاحقاً', 500);
  }
};


const getNotifications = asyncHandler(async (req, res, next) => {
  const { role, _id, farm_id } = req.user;
  let query = {};

  if (role === 'SUPER_ADMIN') {
    query.target_role = 'SUPER_ADMIN';
  } else if (role === 'SUPERVISOR') { 
    query.farm_id = farm_id; 
    query.target_role = 'SUPERVISOR'; 
    query.$or = [{ target_user_id: _id }, { target_user_id: null }];
  } else {
    return res.status(200).json([]);
  }

  const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50).lean();
  res.status(200).json(notifications);
});

const markAsRead = asyncHandler(async (req, res, next) => {
  const { role, _id, farm_id } = req.user;
  let query = { _id: req.params.id };

  if (role === 'SUPER_ADMIN') query.target_role = 'SUPER_ADMIN';
  else { 
    query.farm_id = farm_id; 
    if (role === 'SUPERVISOR') query.$or = [{ target_user_id: _id }, { target_user_id: null }];
  }

  const notification = await Notification.findOneAndUpdate(query, { is_read: true });
  if (!notification) return next(new AppError('الإشعار غير موجود', 404));
  res.status(200).json({ message: 'تم التحديد كمقروء' });
});

const markAllAsRead = asyncHandler(async (req, res, next) => {
  const { role, _id, farm_id } = req.user;
  let query = { is_read: false };

  if (role === 'SUPER_ADMIN') query.target_role = 'SUPER_ADMIN';
  else { 
    query.farm_id = farm_id; 
    query.target_role = role; 
    if (role === 'SUPERVISOR') query.$or = [{ target_user_id: _id }, { target_user_id: null }];
  }

  await Notification.updateMany(query, { is_read: true });
  res.status(200).json({ message: 'تم تحديد الكل كمقروء' });
});

const deleteAllReadNotifications = asyncHandler(async (req, res, next) => {
  const { role, _id, farm_id } = req.user;
  let query = { is_read: true };

  if (role === 'SUPER_ADMIN') query.target_role = 'SUPER_ADMIN';
  else { 
    query.farm_id = farm_id; 
    query.target_role = role; 
    if (role === 'SUPERVISOR') query.$or = [{ target_user_id: _id }, { target_user_id: null }];
  }

  await Notification.deleteMany(query);
  res.status(200).json({ message: 'تم تنظيف الإشعارات المقروءة' });
});

const deleteNotification = asyncHandler(async (req, res, next) => {
  const { role, _id, farm_id } = req.user;
  let query = { _id: req.params.id };

  if (role === 'SUPER_ADMIN') query.target_role = 'SUPER_ADMIN';
  else { 
    query.farm_id = farm_id; 
    if (role === 'SUPERVISOR') query.$or = [{ target_user_id: _id }, { target_user_id: null }];
  }

  const deleted = await Notification.findOneAndDelete(query);
  if (!deleted) return next(new AppError('الإشعار غير موجود', 404));
  res.status(200).json({ message: 'تم حذف الإشعار' });
});

const registerFcmToken = asyncHandler(async (req, res, next) => {
  const { fcm_token } = req.body;
  if (!fcm_token) return next(new AppError('FCM token is required', 400));
  
  await User.findByIdAndUpdate(req.user._id, { fcm_token }, { new: true });
  res.status(200).json({ message: 'تم تسجيل FCM Token بنجاح' });
});

const testSendNotification = asyncHandler(async (req, res, next) => {
  const notification = await sendAppNotification(req.body);
  res.status(200).json({ message: 'تم إرسال الإشعار التجريبي بنجاح', notification });
});

const sendBroadcast = asyncHandler(async (req, res, next) => {
  const { title, message, link } = req.body;
  
  const result = await broadcastAppNotification({ title, message, link });
  
  res.status(200).json({ 
    message: 'تم إرسال الإشعار العام لجميع المزارع بنجاح', 
    details: result 
  });
});

module.exports = { 
  sendAppNotification,
  broadcastAppNotification,
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification, 
  deleteAllReadNotifications,
  registerFcmToken,
  testSendNotification,
  sendBroadcast
};