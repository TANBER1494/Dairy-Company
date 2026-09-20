const mongoose = require('mongoose');
const PlatformPayment = require('../models/PlatformPayment');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Farm = require('../models/Farm');
const Notification = require('../models/Notification');
const socket = require('../models/socket');
const AppError = require('../utils/AppError');
const { sendAppNotification } = require('../controllers/notificationController');


class PlatformPaymentService {

async submitPaymentRequest(data, farmId, fileUrl) {
    const { amount_paid, transfer_number, requested_months } = data;

    const farm = await Farm.exists({ _id: farmId });
    if (!farm) throw new AppError('المزرعة غير موجودة', 404);

    const validPlan = await SubscriptionPlan.findOne({
      months: Number(requested_months),
      price: Number(amount_paid),
      is_active: true
    });

    if (!validPlan) {
      throw new AppError('بيانات الباقة غير صحيحة، أو أن الباقة تم تغيير سعرها/إيقافها من قبل الإدارة', 400);
    }

    const newPayment = await PlatformPayment.create({
      farm_id: farmId,
      amount_paid: Number(amount_paid),
      transfer_number: transfer_number.trim(),
      requested_months: Number(requested_months),
      payment_method: 'VODAFONE_CASH',
      receipt_image_url: fileUrl,
    });

    this._notifySuperAdmin(farmId, amount_paid).catch(err => {
      console.error('Failed to notify SUPER_ADMIN:', err.message);
    });

    return newPayment;
  }

async _notifySuperAdmin(farmId, amount) {
    await sendAppNotification({
      title: 'طلب تجديد اشتراك جديد 💳',
      message: `قام المشرف برفع إيصال دفع بمبلغ ${amount} ج.م بانتظار مراجعتك.`,
      type: 'SYSTEM',
      target_role: 'SUPER_ADMIN',
      farm_id: farmId,
      link: '/admin/payments'
    });
  }


  async getSupervisorPaymentHistory(farmId) {
    return await PlatformPayment.find({
      farm_id: farmId,
      is_deleted_by_supervisor: false,
    })
      .sort({ createdAt: -1 })
      .lean();
  }

 
  async clearHistory(farmId) {
    await PlatformPayment.updateMany(
      { farm_id: farmId },
      { $set: { is_deleted_by_supervisor: true } }
    );
  }


  async getPendingPayments() {
    return await PlatformPayment.find({ status: 'PENDING' })
      .populate('farm_id', 'name subscription_status subscription_ends_at')
      .sort({ createdAt: 1 })
      .lean();
  }

  async getAdminPaymentHistory() {
    return await PlatformPayment.find({ 
      status: { $in: ['APPROVED', 'REJECTED'] },
      is_archived_by_admin: false 
    })
      .populate('farm_id', 'name subscription_status')
      .sort({ updatedAt: -1 }) 
      .lean();
  }

  async clearAdminHistory() {
    await PlatformPayment.updateMany(
      { 
        status: { $in: ['APPROVED', 'REJECTED'] }, 
        is_archived_by_admin: false 
      },
      { $set: { is_archived_by_admin: true } }
    );
  }

 
  async reviewPaymentRequest(paymentId, action, adminNotes) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const payment = await PlatformPayment.findOne({ _id: paymentId, status: 'PENDING' }).session(session);
      
      if (!payment) {
        throw new AppError('طلب الدفع غير موجود، أو تمت مراجعته مسبقاً من قبل مسؤول آخر (تضارب إجراءات).', 400);
      }

    if (action === 'REJECT') {
        payment.status = 'REJECTED';
        payment.admin_notes = adminNotes ? adminNotes.trim() : 'تم رفض الإيصال لعدم وضوحه أو عدم تطابق البيانات.';
        await payment.save({ session });
        await session.commitTransaction();

        try {
          await sendAppNotification({
            title: 'تم رفض طلب التجديد ❌',
            message: `عذراً، تم رفض إيصال الدفع الخاص بك. السبب: ${payment.admin_notes}`,
            type: 'SYSTEM',
            target_role: 'SUPERVISOR',
            farm_id: payment.farm_id,
            link: '/subscriptions' 
          });
        } catch (notifError) {
          console.error('⚠️ تم الرفض في قاعدة البيانات ولكن فشل إرسال الإشعار:', notifError);
        }

        return { status: 'REJECTED' };
      }

      if (action === 'APPROVE') {
        const farm = await Farm.findById(payment.farm_id).session(session);
        if (!farm) throw new AppError('المزرعة المرتبطة بهذا الطلب لم تعد موجودة', 404);

        const now = new Date();
        let newStartDate = now;

        if (farm.subscription_status === 'ACTIVE' && farm.subscription_ends_at && farm.subscription_ends_at > now) {
          newStartDate = new Date(farm.subscription_ends_at);
        }

        const newEndDate = new Date(newStartDate);
        newEndDate.setMonth(newEndDate.getMonth() + payment.requested_months);

        farm.subscription_status = 'ACTIVE';
        farm.subscription_ends_at = newEndDate;
        await farm.save({ session });

        payment.status = 'APPROVED';
        payment.admin_notes = adminNotes ? adminNotes.trim() : 'تم استلام المبلغ وتمديد الاشتراك بنجاح.';
        await payment.save({ session });

        await session.commitTransaction();

        await sendAppNotification({
          title: 'تم تفعيل اشتراك المزرعة! 💳',
          message: `تمت مراجعة إيصال الدفع بنجاح، وتفعيل اشتراك المزرعة لمدة ${payment.requested_months} شهر/شهور.`,
          type: 'SYSTEM',
          target_role: 'SUPERVISOR',
          farm_id: farm._id,
          link: '/settings/subscription'
        });

        return { status: 'APPROVED', newEndDate, months: payment.requested_months };
      }

      throw new AppError('إجراء غير معروف (يجب أن يكون APPROVE أو REJECT)', 400);
      
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

module.exports = new PlatformPaymentService();