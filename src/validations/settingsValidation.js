const Joi = require('joi');

const phoneRegex = /^01[0125][0-9]{8}$/;

const settingsValidation = {
  updateProfileSchema: Joi.object({
    name: Joi.string().trim().min(3).max(50).optional().messages({
      'string.empty': 'لا يمكن ترك الاسم فارغاً',
      'string.min': 'الاسم يجب أن يكون 3 أحرف على الأقل'
    }),
    new_phone: Joi.string().pattern(phoneRegex).optional().messages({
      'string.pattern.base': 'رقم الهاتف الجديد غير صحيح أو غير مطابق للمواصفات'
    })
  }).or('name', 'new_phone').messages({
    'object.missing': 'يجب إرسال الاسم أو رقم الهاتف لتحديث البيانات'
  }), 

  updatePasswordSchema: Joi.object({
    current_password: Joi.string().required().messages({
      'string.empty': 'كلمة المرور الحالية مطلوبة',
      'any.required': 'حقل كلمة المرور الحالية إلزامي'
    }),
    new_password: Joi.string().min(6).required().messages({
      'string.empty': 'كلمة المرور الجديدة مطلوبة',
      'string.min': 'يجب أن تتكون كلمة المرور من 6 أحرف كحد أدنى',
      'any.required': 'حقل كلمة المرور الجديدة إلزامي'
    }),
    confirm_password: Joi.string().valid(Joi.ref('new_password')).required().messages({
      'any.only': 'كلمة المرور الجديدة غير متطابقة مع حقل التأكيد',
      'any.required': 'تأكيد كلمة المرور مطلوب'
    })
  }),

  updatePreferencesSchema: Joi.object({
    is_dark_mode: Joi.boolean().optional().messages({
      'boolean.base': 'قيمة الوضع الليلي يجب أن تكون (true أو false)'
    }),
    notifications_enabled: Joi.boolean().optional().messages({
      'boolean.base': 'قيمة الإشعارات يجب أن تكون (true أو false)'
    })
  })
};

module.exports = settingsValidation;