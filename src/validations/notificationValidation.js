const Joi = require('joi');

const notificationValidation = {
  fcmTokenSchema: Joi.object({
    fcm_token: Joi.string().required().messages({
      'string.empty': 'توكن الإشعارات مطلوب (FCM Token)',
      'any.required': 'حقل توكن الإشعارات إلزامي',
    }),
  }),

  broadcastSchema: Joi.object({
    title: Joi.string().required().messages({
      'string.empty': 'عنوان الإشعار مطلوب',
      'any.required': 'حقل العنوان إلزامي',
    }),
    message: Joi.string().required().messages({
      'string.empty': 'نص الإشعار مطلوب',
      'any.required': 'حقل النص إلزامي',
    }),
    link: Joi.string().allow('', null).optional(),
  }),

  testNotificationSchema: Joi.object({
    title: Joi.string().required().messages({
      'string.empty': 'عنوان الإشعار مطلوب',
      'any.required': 'حقل العنوان إلزامي',
    }),
    message: Joi.string().required().messages({
      'string.empty': 'نص الإشعار مطلوب',
      'any.required': 'حقل النص إلزامي',
    }),
    type: Joi.string().required().messages({
      'any.required': 'نوع الإشعار مطلوب',
    }),
    target_role: Joi.string()
      .valid('SUPERVISOR', 'SUPER_ADMIN')
      .required()
      .messages({
        'any.only': 'صلاحية المستهدف غير صحيحة',
        'any.required': 'صلاحية المستهدف مطلوبة',
      }),
    target_user_id: Joi.string().allow('', null).optional(),
    farm_id: Joi.string().allow('', null).optional(),
    link: Joi.string().allow('', null).optional(),
  }),
};

module.exports = notificationValidation;
