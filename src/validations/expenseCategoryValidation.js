const Joi = require('joi');

const createCategorySchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': 'اسم فئة المصروفات مطلوب',
    'any.required': 'اسم فئة المصروفات مطلوب'
  }),
  description: Joi.string().allow(null, '').messages({
    'string.base': 'الوصف يجب أن يكون نصاً'
  })
});

const updateCategorySchema = Joi.object({
  name: Joi.string().messages({
    'string.empty': 'اسم فئة المصروفات لا يمكن أن يكون فارغاً'
  }),
  description: Joi.string().allow(null, '')
}).min(1).messages({
  'object.min': 'يجب إرسال حقل واحد على الأقل للتحديث'
});

module.exports = {
  createCategorySchema,
  updateCategorySchema
};