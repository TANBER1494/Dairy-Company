const Joi = require('joi');

const phoneRegex = /^01[0125][0-9]{8}$/;

const authValidation = {
  
  registerSchema: Joi.object({
    name: Joi.string().trim().min(3).max(50).required().messages({
      'string.empty': 'الاسم مطلوب',
      'string.min': 'الاسم يجب أن يكون 3 أحرف على الأقل',
      'any.required': 'حقل الاسم إلزامي'
    }),
    phone: Joi.string().pattern(phoneRegex).required().messages({
      'string.empty': 'رقم الهاتف مطلوب',
      'string.pattern.base': 'رقم الهاتف غير صحيح (يجب أن يكون رقم محمول مصري 11 رقم)',
      'any.required': 'حقل الهاتف إلزامي'
    }),
    email: Joi.string().email().required().messages({
      'string.empty': 'البريد الإلكتروني مطلوب',
      'string.email': 'صيغة البريد الإلكتروني غير صحيحة',
      'any.required': 'حقل البريد الإلكتروني إلزامي'
    }),
    password: Joi.string().min(6).required().messages({
      'string.empty': 'كلمة المرور مطلوبة',
      'string.min': 'كلمة المرور يجب أن لا تقل عن 6 أحرف',
      'any.required': 'حقل كلمة المرور إلزامي'
    }),
    farm_name: Joi.string().trim().required().messages({
      'string.empty': 'اسم المزرعة مطلوب',
      'any.required': 'حقل اسم المزرعة إلزامي'
    }),
    address: Joi.string().trim().allow('', null).optional()
  }),

  loginSchema: Joi.object({
    phone: Joi.string().pattern(phoneRegex).required().messages({
      'string.empty': 'رقم الهاتف مطلوب',
      'string.pattern.base': 'رقم الهاتف غير صحيح',
      'any.required': 'حقل الهاتف إلزامي'
    }),
    password: Joi.string().required().messages({
      'string.empty': 'كلمة المرور مطلوبة',
      'any.required': 'حقل كلمة المرور إلزامي'
    })
  }),

  verifySchema: Joi.object({
    email: Joi.string().email().required().messages({
      'string.empty': 'البريد الإلكتروني مطلوب',
      'string.email': 'البريد غير صحيح',
      'any.required': 'حقل البريد إلزامي'
    }),
    otp: Joi.string().length(6).required().messages({
      'string.empty': 'كود التفعيل مطلوب',
      'string.length': 'كود التفعيل يجب أن يكون 6 أرقام',
      'any.required': 'حقل الكود إلزامي'
    })
  }),

  emailOnlySchema: Joi.object({
    email: Joi.string().email().required().messages({
      'string.empty': 'البريد الإلكتروني مطلوب',
      'string.email': 'البريد غير صحيح',
      'any.required': 'حقل البريد إلزامي'
    })
  }),

  resetPasswordSchema: Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required(),
    new_password: Joi.string().min(6).required().messages({
      'string.min': 'كلمة المرور الجديدة يجب أن لا تقل عن 6 أحرف',
      'any.required': 'كلمة المرور الجديدة مطلوبة'
    }),
    confirm_password: Joi.string().valid(Joi.ref('new_password')).required().messages({
      'any.only': 'كلمة المرور غير متطابقة',
      'any.required': 'تأكيد كلمة المرور مطلوب'
    })
  }),

  refreshTokenSchema: Joi.object({
    refresh_token: Joi.string().required().messages({
      'any.required': 'توكن التجديد مطلوب'
    })
  }),

  fcmTokenSchema: Joi.object({
    fcm_token: Joi.string().required().messages({
      'any.required': 'توكن الإشعارات مطلوب'
    })
  })
};

module.exports = authValidation;