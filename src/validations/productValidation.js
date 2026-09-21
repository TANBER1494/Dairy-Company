const Joi = require('joi');

const createProductSchema = Joi.object({
  code: Joi.number().required().messages({
    'number.base': 'كود المنتج يجب أن يكون رقماً',
    'any.required': 'كود المنتج مطلوب'
  }),
  name: Joi.string().required().messages({
    'string.empty': 'اسم المنتج مطلوب',
    'any.required': 'اسم المنتج مطلوب'
  }),
  description: Joi.string().allow(null, '').messages({
    'string.base': 'الوصف يجب أن يكون نصاً'
  }),
  current_price: Joi.number().min(0).messages({
    'number.base': 'السعر يجب أن يكون رقماً',
    'number.min': 'السعر لا يمكن أن يكون بالسالب'
  }),
  current_stock: Joi.number().min(0).messages({
    'number.base': 'الرصيد يجب أن يكون رقماً',
    'number.min': 'الرصيد لا يمكن أن يكون بالسالب'
  })
});

const updateProductSchema = Joi.object({
  code: Joi.number().messages({
    'number.base': 'كود المنتج يجب أن يكون رقماً'
  }),
  name: Joi.string().messages({
    'string.empty': 'اسم المنتج لا يمكن أن يكون فارغاً'
  }),
  description: Joi.string().allow(null, ''),
  current_price: Joi.number().min(0).messages({
    'number.base': 'السعر يجب أن يكون رقماً',
    'number.min': 'السعر لا يمكن أن يكون بالسالب'
  }),
  current_stock: Joi.number().min(0).messages({
    'number.base': 'الرصيد يجب أن يكون رقماً',
    'number.min': 'الرصيد لا يمكن أن يكون بالسالب'
  })
}).min(1).messages({
  'object.min': 'يجب إرسال حقل واحد على الأقل للتحديث'
});

module.exports = {
  createProductSchema,
  updateProductSchema
};