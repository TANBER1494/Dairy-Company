const Joi = require('joi');

const createClientSchema = Joi.object({
  code: Joi.number().required().messages({
    'number.base': 'كود العميل يجب أن يكون رقماً',
    'any.required': 'كود العميل مطلوب'
  }),
  name: Joi.string().required().messages({
    'string.empty': 'اسم العميل مطلوب',
    'any.required': 'اسم العميل مطلوب'
  }),
  phone: Joi.string().pattern(/^(01[0125][0-9]{8})$/).allow(null, '').messages({
    'string.pattern.base': 'رقم هاتف غير صالح (يجب أن يكون رقم مصري صحيح)'
  }),
  address: Joi.string().allow(null, '').messages({
    'string.base': 'العنوان يجب أن يكون نصاً'
  })
});

const updateClientSchema = Joi.object({
  code: Joi.number().messages({
    'number.base': 'كود العميل يجب أن يكون رقماً'
  }),
  name: Joi.string().messages({
    'string.empty': 'اسم العميل لا يمكن أن يكون فارغاً'
  }),
  phone: Joi.string().pattern(/^(01[0125][0-9]{8})$/).allow(null, '').messages({
    'string.pattern.base': 'رقم هاتف غير صالح'
  }),
  address: Joi.string().allow(null, '')
}).min(1).messages({
  'object.min': 'يجب إرسال حقل واحد على الأقل للتحديث'
});

module.exports = {
  createClientSchema,
  updateClientSchema
};