const Joi = require('joi');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createTransactionSchema = Joi.object({
  client_id: Joi.string().pattern(objectIdRegex).required().messages({
    'string.pattern.base': 'معرف العميل (ID) غير صالح',
    'any.required': 'العميل مطلوب'
  }),
  worker_id: Joi.string().pattern(objectIdRegex).allow(null, '').messages({
    'string.pattern.base': 'معرف العامل (ID) غير صالح'
  }),
  product_id: Joi.string().pattern(objectIdRegex).allow(null, '').messages({
    'string.pattern.base': 'معرف المنتج (ID) غير صالح'
  }),
  quantity: Joi.number().min(0).default(0).messages({
    'number.base': 'الكمية يجب أن تكون رقماً',
    'number.min': 'لا يمكن أن تكون الكمية بالسالب'
  }),
  unit_price: Joi.number().min(0).default(0).messages({
    'number.base': 'السعر يجب أن يكون رقماً',
    'number.min': 'لا يمكن أن يكون السعر بالسالب'
  }),
  paid_amount: Joi.number().min(0).default(0).messages({
    'number.base': 'المبلغ المدفوع يجب أن يكون رقماً',
    'number.min': 'لا يمكن أن يكون المبلغ المدفوع بالسالب'
  }),
  shift: Joi.string().valid('MORNING', 'EVENING').allow(null, '').messages({
    'any.only': 'الوردية يجب أن تكون إما MORNING أو EVENING'
  }),
  date: Joi.date().iso().allow(null, '').messages({
    'date.format': 'تنسيق التاريخ غير صالح'
  }),
  notes: Joi.string().allow(null, '').messages({
    'string.base': 'الملاحظات يجب أن تكون نصاً'
  })
});

const updateTransactionSchema = Joi.object({
  client_id: Joi.string().pattern(objectIdRegex),
  worker_id: Joi.string().pattern(objectIdRegex).allow(null, ''),
  product_id: Joi.string().pattern(objectIdRegex).allow(null, ''),
  quantity: Joi.number().min(0),
  unit_price: Joi.number().min(0),
  paid_amount: Joi.number().min(0),
  shift: Joi.string().valid('MORNING', 'EVENING').allow(null, ''),
  date: Joi.date().iso().allow(null, ''),
  notes: Joi.string().allow(null, '')
}).min(1).messages({
  'object.min': 'يجب إرسال حقل واحد على الأقل للتحديث'
});

const bulkCreateTransactionSchema = Joi.object({
  transactions: Joi.array().items(createTransactionSchema).min(1).required().messages({
    'array.min': 'يجب إرسال فاتورة واحدة على الأقل',
    'any.required': 'قائمة الفواتير مطلوبة'
  })
});

module.exports = {
  createTransactionSchema,
  updateTransactionSchema,
  bulkCreateTransactionSchema
};
