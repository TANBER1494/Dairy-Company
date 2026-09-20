const Farm = require('../models/Farm');

const checkSubscription = async (req, res, next) => {
  try {
    if (req.user?.role === 'SUPER_ADMIN') return next();

    const farmId = req.user?.farm_id;

    if (!farmId) {
      return res.status(403).json({ message: 'إجراء أمني: حسابك غير مربوط بمزرعة نشطة.' });
    }

    const farm = await Farm.findById(farmId);

    if (!farm) {
      return res.status(403).json({ message: 'إجراء أمني: المزرعة غير موجودة.' });
    }

    if (farm.subscription_status === 'LOCKED') {
      return res.status(403).json({ 
        status: 'LOCKED', 
        message: 'تم إغلاق هذه المزرعة من قبل الإدارة، لا يمكن مزامنة أو إجراء أي عمليات.' 
      });
    }

    if (farm.subscription_status === 'OVERDUE') {
      return res.status(402).json({ 
        status: 'EXPIRED', 
        message: 'الاشتراك منتهي، يرجى التجديد لتتمكن من مزامنة البيانات مع الخادم.' 
      });
    }

    const now = new Date();
    let isExpired = false;
    let expireMessage = '';

    if (farm.subscription_status === 'TRIAL') {
      if (farm.trial_ends_at && now > farm.trial_ends_at) {
        isExpired = true;
        expireMessage = 'انتهت الفترة التجريبية (14 يوم) الخاصة بك، يرجى الاشتراك لضمان استمرار المزامنة.';
      }
    } else if (farm.subscription_status === 'ACTIVE') {
      if (farm.subscription_ends_at && now > farm.subscription_ends_at) {
        isExpired = true;
        expireMessage = 'انتهى اشتراك المزرعة، يرجى التجديد لتجنب توقف الخدمة.';
      }
    }

    if (isExpired) {
      farm.subscription_status = 'OVERDUE';
      await farm.save();
      return res.status(402).json({ 
        status: 'EXPIRED', 
        message: expireMessage 
      });
    }

    req.farm = farm;

    next();
  } catch (error) {
    console.error('Subscription Middleware Error:', error);
    res.status(500).json({ message: 'حدث خطأ داخلي أثناء الفحص الأمني للاشتراك.' });
  }
};

module.exports = { checkSubscription };