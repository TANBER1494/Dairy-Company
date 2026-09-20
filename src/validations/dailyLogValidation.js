const Joi = require('joi');

const logItemSchema = Joi.object({
  local_id: Joi.string().required().messages({
    'any.required': 'المعرف المحلي مطلوب'
  }),
  barn_id: Joi.string().required().messages({
    'any.required': 'معرف العنبر مطلوب'
  }),
  barn_name: Joi.string().required().messages({
    'any.required': 'اسم العنبر مطلوب'
  }),
  cycle_id: Joi.string().required().messages({
    'any.required': 'معرف الدورة مطلوب'
  }),
  log_date: Joi.date().iso().required().messages({
    'any.required': 'تاريخ اليومية مطلوب'
  }),
  age_in_days: Joi.number().min(0).required().messages({
    'number.min': 'عمر الطائر لا يمكن أن يكون بالسالب',
    'any.required': 'عمر الطائر مطلوب'
  }),
  mortality_count: Joi.number().min(0).optional(),
  
  feed_item_id: Joi.string().allow('', null).optional(),
  feed_consumed_bags: Joi.number().min(0).optional(),
  
  egg_trays_produced: Joi.number().min(0).optional(),
  
  consumed_medications: Joi.array().items(
    Joi.object({
      item_id: Joi.string().required().messages({
        'any.required': 'معرف الدواء مطلوب'
      }),
      quantity: Joi.number().greater(0).required().messages({
        'number.greater': 'كمية الدواء يجب أن تكون أكبر من الصفر',
        'any.required': 'كمية الدواء مطلوبة'
      })
    })
  ).optional(),
  
  notes: Joi.string().allow('', null).optional()
});

const dailyLogValidation = {
  createBulkLogsSchema: Joi.object({
    logs: Joi.array().items(logItemSchema).min(1).required().messages({
      'array.min': 'يجب إرسال بيانات يومية واحدة على الأقل',
      'any.required': 'مصفوفة اليوميات (logs) مطلوبة'
    })
  }),
  
  updateBulkLogsSchema: Joi.object({
    old_date: Joi.date().iso().required().messages({
      'any.required': 'التاريخ القديم مطلوب'
    }),
    new_date: Joi.date().iso().required().messages({
      'any.required': 'التاريخ الجديد مطلوب'
    }),
    logs: Joi.array().items(logItemSchema).min(1).required().messages({
      'array.min': 'يجب إرسال بيانات يومية واحدة على الأقل',
      'any.required': 'مصفوفة اليوميات (logs) مطلوبة'
    })
  })
};

module.exports = dailyLogValidation;