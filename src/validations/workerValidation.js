const Joi = require('joi');

const createWorkerSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': 'اسم العامل مطلوب',
    'any.required': 'اسم العامل مطلوب'
  }),
  phone: Joi.string().pattern(/^(01[0125][0-9]{8})$/).allow(null, '').messages({
    'string.pattern.base': 'رقم هاتف غير صالح (يجب أن يكون رقم مصري صحيح)'
  })
});

const updateWorkerSchema = Joi.object({
  name: Joi.string().messages({
    'string.empty': 'اسم العامل لا يمكن أن يكون فارغاً'
  }),
  phone: Joi.string().pattern(/^(01[0125][0-9]{8})$/).allow(null, '').messages({
    'string.pattern.base': 'رقم هاتف غير صالح'
  })
}).min(1).messages({
  'object.min': 'يجب إرسال حقل واحد على الأقل للتحديث'
});

module.exports = {
  createWorkerSchema,
  updateWorkerSchema
};