const Joi = require('joi');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createExpenseSchema = Joi.object({
  category_id: Joi.string().pattern(objectIdRegex).required().messages({
    'string.pattern.base': 'معرف فئة المصروفات (ID) غير صالح',
    'any.required': 'فئة المصروفات مطلوبة'
  }),
  amount: Joi.number().min(0.01).required().messages({
    'number.base': 'المبلغ يجب أن يكون رقماً',
    'number.min': 'المبلغ يجب أن يكون أكبر من الصفر',
    'any.required': 'مبلغ المصروف مطلوب'
  }),
  date: Joi.date().iso().allow(null, '').messages({
    'date.format': 'تنسيق التاريخ غير صالح'
  }),
  shift: Joi.string().valid('MORNING', 'EVENING').allow(null, '').messages({
    'any.only': 'الوردية يجب أن تكون إما MORNING أو EVENING'
  }),
  notes: Joi.string().allow(null, '').messages({
    'string.base': 'الملاحظات يجب أن تكون نصاً'
  })
});

const updateExpenseSchema = Joi.object({
  category_id: Joi.string().pattern(objectIdRegex).messages({
    'string.pattern.base': 'معرف فئة المصروفات (ID) غير صالح'
  }),
  amount: Joi.number().min(0.01).messages({
    'number.base': 'المبلغ يجب أن يكون رقماً',
    'number.min': 'المبلغ يجب أن يكون أكبر من الصفر'
  }),
  date: Joi.date().iso().allow(null, ''),
  shift: Joi.string().valid('MORNING', 'EVENING'),
  notes: Joi.string().allow(null, '')
}).min(1).messages({
  'object.min': 'يجب إرسال حقل واحد على الأقل للتحديث'
});

module.exports = {
  createExpenseSchema,
  updateExpenseSchema
};