const Joi = require('joi');

const createUserSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': 'الاسم مطلوب',
    'any.required': 'الاسم مطلوب'
  }),
  username: Joi.string().alphanum().min(3).max(30).required().messages({
    'string.empty': 'اسم المستخدم مطلوب',
    'string.alphanum': 'اسم المستخدم يجب أن يحتوي على أحرف وأرقام فقط',
    'string.min': 'اسم المستخدم يجب أن يتكون من 3 أحرف على الأقل',
    'string.max': 'اسم المستخدم يجب ألا يتجاوز 30 حرفاً',
    'any.required': 'اسم المستخدم مطلوب'
  }),
  role: Joi.string().valid('Admin', 'InventoryAccountant', 'GeneralAccountant').required().messages({
    'any.only': 'صلاحية غير صالحة',
    'any.required': 'الصلاحية مطلوبة'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'يجب أن تتكون كلمة المرور من 6 أحرف كحد أدنى',
    'string.empty': 'كلمة المرور مطلوبة',
    'any.required': 'كلمة المرور مطلوبة'
  }),
  phone: Joi.string().pattern(/^(01[0125][0-9]{8})$/).allow(null, '').messages({
    'string.pattern.base': 'رقم هاتف غير صالح'
  })
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'SUSPENDED').required().messages({
    'any.only': 'حالة الحساب غير صالحة',
    'any.required': 'حالة الحساب مطلوبة'
  })
});

const resetPasswordSchema = Joi.object({
  new_password: Joi.string().min(6).required().messages({
    'string.min': 'يجب أن تتكون كلمة المرور من 6 أحرف كحد أدنى',
    'string.empty': 'كلمة المرور الجديدة مطلوبة',
    'any.required': 'كلمة المرور الجديدة مطلوبة'
  })
});

module.exports = {
  createUserSchema,
  updateStatusSchema,
  resetPasswordSchema
};