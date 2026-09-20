const Joi = require('joi');

const adminValidation = {
  createPlanSchema: Joi.object({
    name: Joi.string().trim().required().messages({
      'string.empty': 'اسم الباقة مطلوب',
      'any.required': 'حقل اسم الباقة إلزامي'
    }),
    months: Joi.number().integer().min(1).required().messages({
      'number.min': 'مدة الباقة يجب أن تكون شهراً واحداً على الأقل',
      'any.required': 'عدد الأشهر مطلوب'
    }),
    price: Joi.number().min(0).required().messages({
      'number.min': 'السعر لا يمكن أن يكون بالسالب',
      'any.required': 'السعر مطلوب'
    }),
  }),

  broadcastSchema: Joi.object({
    title: Joi.string().trim().required().messages({
      'string.empty': 'عنوان الإشعار مطلوب',
      'any.required': 'حقل العنوان إلزامي'
    }),
    message: Joi.string().trim().required().messages({
      'string.empty': 'رسالة الإشعار مطلوبة',
      'any.required': 'حقل الرسالة إلزامي'
    }),
    link: Joi.string().allow('', null).optional()
  }),

  updateFarmStatusSchema: Joi.object({
    status: Joi.string().valid('TRIAL', 'ACTIVE', 'OVERDUE', 'LOCKED').required().messages({
      'any.only': 'حالة المزرعة غير صالحة',
      'any.required': 'حقل الحالة مطلوب'
    })
  }),

  updateUserStatusSchema: Joi.object({
    status: Joi.string().valid('ACTIVE', 'SUSPENDED', 'PENDING').required().messages({
      'any.only': 'حالة المستخدم غير صالحة',
      'any.required': 'حقل الحالة مطلوب'
    })
  })
};

module.exports = adminValidation;