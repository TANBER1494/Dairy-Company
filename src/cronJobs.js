const cron = require('node-cron');
const dashboardService = require('./services/dashboardService');
const Notification = require('./models/Notification');
const socket = require('./models/socket');
const DailyReport = require('./models/DailyReport'); 
const logger = require('./utils/logger');

const startCronJobs = () => {
  cron.schedule('59 11 * * *', async () => {
    console.log('[CRON] إعداد تقرير الوردية الصباحية...');
    await generateShiftReport('MORNING', 'الوردية الصباحية');
  });

  cron.schedule('55 23 * * *', async () => {
    try {
      console.log('[CRON] بدء عملية أرشفة التوريد اليومي (Daily Snapshot)...');
      
      const today = new Date();
      const reportData = await dashboardService.calculateLiveDailyReport(today);
      
      await DailyReport.findOneAndUpdate(
        { date_string: reportData.date_string },
        reportData,
        { upsert: true, new: true }
      );
      
      console.log(`[CRON] تم حفظ أرشيف التوريد بنجاح ليوم: ${reportData.date_string}`);
    } catch (error) {
      console.error('[CRON] خطأ أثناء حفظ أرشيف التوريد اليومي:', error.message);
    }
  });

  cron.schedule('59 23 * * *', async () => {
    console.log('[CRON] إعداد تقرير الوردية المسائية...');
    await generateShiftReport('EVENING', 'الوردية المسائية');
  });
};

async function generateShiftReport(shiftCode, shiftName) {
  try {
    const report = await dashboardService.getDailyCollectionReport({ shift: shiftCode });

    const title = `تقرير توريد ${shiftName}`;
    const message = `انتهت ${shiftName}. تم التوريد من ${report.suppliedCount} مورد، ومتبقي ${report.pendingCount} مورد لم يوردوا.`;

    const targetRoles = ['Admin', 'GeneralAccountant', 'InventoryAccountant'];
    
    const notificationsToInsert = targetRoles.map(role => ({
      target_role: role,
      title,
      message,
      type: 'SUPPLIER_DELIVERY',
      link: '/dashboard/daily-collection' 
    }));

    const createdNotifications = await Notification.insertMany(notificationsToInsert);

    const io = socket.getIO();
    if (io) {
      createdNotifications.forEach(notif => {
        io.to(notif.target_role).emit('new_notification', notif);
      });
    }

    console.log(`[CRON] تم إرسال إشعارات ${shiftName} بنجاح.`);
  } catch (error) {
    console.error(`[CRON] خطأ أثناء إنشاء إشعار ${shiftName}:`, error.message);
  }
}

module.exports = startCronJobs;