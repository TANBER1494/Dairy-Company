const Joi = require('joi');

const merchantValidation = {
  addMerchantSchema: Joi.object({
    local_id: Joi.string().required().messages({
      'any.required': 'المعرف المحلي مطلوب'
    }),
    company_name: Joi.string().trim().required().messages({
      'string.empty': 'اسم الشركة/التاجر مطلوب',
      'any.required': 'حقل اسم الشركة إلزامي'
    }),
    company_phone: Joi.string().trim().allow('', null).optional(),
    address: Joi.string().trim().allow('', null).optional(),
    representatives: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        phone: Joi.string().allow('', null).optional()
      })
    ).optional()
  }),

  updateMerchantSchema: Joi.object({
    company_name: Joi.string().trim().optional(),
    company_phone: Joi.string().trim().allow('', null).optional(),
    address: Joi.string().trim().allow('', null).optional(),
    status: Joi.string().valid('ACTIVE', 'INACTIVE').optional()
  }).min(1).messages({
    'object.min': 'يجب إرسال حقل واحد على الأقل للتحديث'
  }),

  addRepresentativeSchema: Joi.object({
    name: Joi.string().trim().required().messages({
      'string.empty': 'اسم المندوب مطلوب',
      'any.required': 'حقل اسم المندوب إلزامي'
    }),
    phone: Joi.string().trim().allow('', null).optional()
  }),

  recordPaymentSchema: Joi.object({
    local_id: Joi.string().required().messages({
      'any.required': 'المعرف المحلي مطلوب'
    }),
    amount: Joi.number().greater(0).required().messages({
      'number.greater': 'المبلغ يجب أن يكون أكبر من الصفر',
      'any.required': 'المبلغ مطلوب'
    }),
    type: Joi.string().valid('IN', 'OUT').required().messages({
      'any.only': 'نوع الدفعة يجب أن يكون IN أو OUT',
      'any.required': 'نوع الدفعة مطلوب'
    }),
    transaction_date: Joi.date().iso().optional(),
    notes: Joi.string().trim().allow('', null).optional(),
    rep_name: Joi.string().trim().allow('', null).optional()
  })
};

module.exports = merchantValidation;