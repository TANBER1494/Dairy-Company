const Joi = require('joi');

const platformPaymentValidation = {
  submitPaymentSchema: Joi.object({
    amount_paid: Joi.number().greater(0).required().messages({
      'number.greater': 'المبلغ المدفوع يجب أن يكون أكبر من الصفر',
      'any.required': 'المبلغ الصحيح مطلوب'
    }),
    transfer_number: Joi.string().trim().required().messages({
      'string.empty': 'رقم التحويل مطلوب',
      'any.required': 'حقل رقم التحويل إلزامي'
    }),
    requested_months: Joi.number().greater(0).required().messages({
      'number.greater': 'مدة الباقة يجب أن تكون شهراً واحداً على الأقل',
      'any.required': 'مدة الباقة مطلوبة'
    })
  }),

  reviewPaymentSchema: Joi.object({
    action: Joi.string().valid('APPROVE', 'REJECT').required().messages({
      'any.only': 'الرجاء تحديد الإجراء المطلوب (APPROVE أو REJECT)',
      'any.required': 'حقل الإجراء مطلوب'
    }),
    admin_notes: Joi.string().allow('', null).optional()
  })
};

module.exports = platformPaymentValidation;