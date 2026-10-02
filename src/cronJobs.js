const cron = require('node-cron');
const dashboardService = require('./services/dashboardService');
const Notification = require('./models/Notification');
const socket = require('./models/socket');
const DailyReport = require('./models/DailyReport'); 
const logger = require('./utils/logger');

const startCronJobs = () => {
  cron.schedule('59 15 * * *', async () => {
    console.log('[CRON] إرسال إشعار انتهاء الوردية الصباحية...');
    await sendShiftNotification('الوردية الصباحية', 'الوردية المسائية');
  });

  cron.schedule('55 3 * * *', async () => {
    try {
      console.log('[CRON] بدء عملية أرشفة التوريد اليومي (Daily Snapshot)...');
      
      const workingDate = new Date();
      workingDate.setHours(workingDate.getHours() - 4); 

      const reportData = await dashboardService.calculateLiveDailyReport(workingDate);
      
      await DailyReport.findOneAndUpdate(
        { date_string: reportData.date_string },
        reportData,
        { upsert: true, new: true }
      );
      
      console.log(`[CRON] تم حفظ أرشيف التوريد بنجاح ليوم العمل: ${reportData.date_string}`);
    } catch (error) {
      console.error('[CRON] خطأ أثناء حفظ أرشيف التوريد اليومي:', error.message);
    }
  });

  cron.schedule('59 3 * * *', async () => {
    console.log('[CRON] إرسال إشعار انتهاء الوردية المسائية...');
    await sendShiftNotification('الوردية المسائية', 'الوردية الصباحية');
  });
};

async function sendShiftNotification(endedShift, startedShift) {
  try {
    const title = `تبديل الورديات`;
    const message = `انتهت ${endedShift} وبدأت الآن ${startedShift}.`;

    const targetRoles = ['Admin', 'GeneralAccountant', 'InventoryAccountant'];
    
    const notificationsToInsert = targetRoles.map(role => ({
      target_role: role,
      title,
      message,
      type: 'SHIFT_CHANGE',
      link: '/dashboard' 
    }));

    const createdNotifications = await Notification.insertMany(notificationsToInsert);

    const io = socket.getIO();
    if (io) {
      createdNotifications.forEach(notif => {
        io.to(notif.target_role).emit('new_notification', notif);
      });
    }

    console.log(`[CRON] تم إرسال إشعارات تبديل الوردية بنجاح.`);
  } catch (error) {
    console.error(`[CRON] خطأ أثناء إنشاء إشعار تبديل الوردية:`, error.message);
  }
}

module.exports = startCronJobs;