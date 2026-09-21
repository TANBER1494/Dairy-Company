const Joi = require('joi');

const createSupplierSchema = Joi.object({
  code: Joi.number().required().messages({
    'number.base': 'كود المورد يجب أن يكون رقماً',
    'any.required': 'كود المورد مطلوب'
  }),
  name: Joi.string().required().messages({
    'string.empty': 'اسم المورد مطلوب',
    'any.required': 'اسم المورد مطلوب'
  }),
  phone: Joi.string().pattern(/^(01[0125][0-9]{8})$/).allow(null, '').messages({
    'string.pattern.base': 'رقم هاتف غير صالح (يجب أن يكون رقم مصري صحيح)'
  }),
  address: Joi.string().allow(null, '').messages({
    'string.base': 'العنوان يجب أن يكون نصاً'
  })
});

const updateSupplierSchema = Joi.object({
  code: Joi.number().messages({
    'number.base': 'كود المورد يجب أن يكون رقماً'
  }),
  name: Joi.string().messages({
    'string.empty': 'اسم المورد لا يمكن أن يكون فارغاً'
  }),
  phone: Joi.string().pattern(/^(01[0125][0-9]{8})$/).allow(null, '').messages({
    'string.pattern.base': 'رقم هاتف غير صالح'
  }),
  address: Joi.string().allow(null, '')
}).min(1).messages({
  'object.min': 'يجب إرسال حقل واحد على الأقل للتحديث'
});

module.exports = {
  createSupplierSchema,
  updateSupplierSchema
};