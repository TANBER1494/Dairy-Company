const Joi = require('joi');

const workerValidation = {
  addWorkerSchema: Joi.object({
    local_id: Joi.string().required().messages({'any.required': 'المعرف المحلي مطلوب'}),
    name: Joi.string().trim().required().messages({'any.required': 'اسم العامل مطلوب'}),
    phone: Joi.string().allow('', null).optional(),
    national_id: Joi.string().allow('', null).optional(),
    base_daily_wage: Joi.number().min(0).required().messages({
      'number.min': 'الأجر اليومي لا يمكن أن يكون بالسالب',
      'any.required': 'الأجر اليومي الأساسي مطلوب'
    })
  }),

  recordLogSchema: Joi.object({
    local_id: Joi.string().required().messages({'any.required': 'المعرف المحلي مطلوب'}),
    worker_id: Joi.string().required().messages({'any.required': 'معرف العامل مطلوب'}),
    log_date: Joi.date().iso().required().messages({'any.required': 'تاريخ اليومية مطلوب'}),
    wage_multiplier: Joi.number().min(0).required().messages({
      'number.min': 'معامل الأجر لا يمكن أن يكون بالسالب',
      'any.required': 'معامل الأجر مطلوب'
    }),
    notes: Joi.string().allow('', null).optional()
  }),

  settleAccountSchema: Joi.object({
    local_id: Joi.string().required().messages({'any.required': 'المعرف المحلي مطلوب'}),
    worker_id: Joi.string().required().messages({'any.required': 'معرف العامل مطلوب'}),
    amount_to_pay: Joi.number().greater(0).required().messages({
      'number.greater': 'المبلغ المصروف يجب أن يكون أكبر من الصفر',
      'any.required': 'المبلغ المصروف مطلوب'
    }),
    transaction_date: Joi.date().iso().required().messages({'any.required': 'تاريخ العملية مطلوب'}),
    notes: Joi.string().allow('', null).optional()
  }),

  changeStatusSchema: Joi.object({
    status: Joi.string().valid('ACTIVE', 'ON_LEAVE', 'TERMINATED').required().messages({
      'any.only': 'حالة العامل غير صالحة. الحالات المقبولة: ACTIVE, ON_LEAVE, TERMINATED',
      'any.required': 'حالة العامل مطلوبة'
    })
  })
};

module.exports = workerValidation;