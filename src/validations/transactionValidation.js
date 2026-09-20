const Joi = require('joi');

const transactionValidation = {
  createTransactionSchema: Joi.object({
    local_id: Joi.string().required().messages({
      'any.required': 'المعرف المحلي مطلوب'
    }),
    type: Joi.string().valid('IN', 'OUT').required().messages({
      'any.only': 'نوع المعاملة يجب أن يكون IN أو OUT',
      'any.required': 'نوع المعاملة مطلوب'
    }),
    category: Joi.string().required().messages({
      'any.required': 'تصنيف المعاملة مطلوب (مثل SAFE_DEPOSIT, WORKER_ADVANCE)'
    }),
    amount: Joi.number().greater(0).required().messages({
      'number.greater': 'قيمة المعاملة يجب أن تكون أكبر من الصفر',
      'any.required': 'قيمة المعاملة مطلوبة'
    }),
    transaction_date: Joi.date().iso().required().messages({
      'any.required': 'تاريخ المعاملة مطلوب'
    }),
    
    worker_id: Joi.string().allow('', null).optional(),
    merchant_id: Joi.string().allow('', null).optional(),
    invoice_id: Joi.string().allow('', null).optional(),
    notes: Joi.string().allow('', null).optional(),
    reference_doc: Joi.string().allow('', null).optional()
  })
};

module.exports = transactionValidation;