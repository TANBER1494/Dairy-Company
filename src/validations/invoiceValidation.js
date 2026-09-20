const Joi = require('joi');

const invoiceValidation = {
  createInvoiceSchema: Joi.object({
    local_id: Joi.string().required().messages({
      'any.required': 'المعرف المحلي مطلوب (Local ID)'
    }),
    merchant_id: Joi.string().required().messages({
      'any.required': 'معرف التاجر مطلوب'
    }),
    representative_name: Joi.string().allow('', null).optional(),
    invoice_type: Joi.string().valid('SALE', 'PURCHASE', 'RETURN').required().messages({
      'any.only': 'نوع الفاتورة غير صحيح',
      'any.required': 'نوع الفاتورة مطلوب'
    }),
    
    items: Joi.array().items(
      Joi.object({
        item_id: Joi.string().required(),
        item_name: Joi.string().optional(),
        quantity: Joi.number().greater(0).required().messages({
          'number.greater': 'كمية الصنف يجب أن تكون أكبر من الصفر'
        }),
        unit_price: Joi.number().min(0).required(),
        total_price: Joi.number().min(0).required()
      })
    ).min(1).required().messages({
      'array.min': 'يجب إضافة صنف واحد على الأقل للفاتورة',
      'any.required': 'قائمة الأصناف مطلوبة'
    }),

    total_amount: Joi.number().greater(0).required().messages({
      'number.greater': 'إجمالي الفاتورة يجب أن يكون أكبر من الصفر',
      'any.required': 'إجمالي الفاتورة مطلوب'
    }),
    paid_amount: Joi.number().min(0).max(Joi.ref('total_amount')).optional().messages({
      'number.min': 'المبلغ المدفوع لا يمكن أن يكون بالسالب',
      'number.max': 'المبلغ المدفوع لا يمكن أن يتجاوز إجمالي الفاتورة'
    }),

    invoice_date: Joi.date().iso().required().messages({
      'any.required': 'تاريخ الفاتورة مطلوب'
    }),
    notes: Joi.string().allow('', null).optional()
  }),

  updateInvoiceSchema: Joi.object({
    representative_name: Joi.string().allow('', null).optional(),
    items: Joi.array().items(
      Joi.object({
        item_id: Joi.string().required(),
        item_name: Joi.string().optional(),
        quantity: Joi.number().greater(0).required(),
        unit_price: Joi.number().min(0).required(),
        total_price: Joi.number().min(0).required()
      })
    ).min(1).required(),
    total_amount: Joi.number().greater(0).required(),
    paid_amount: Joi.number().min(0).max(Joi.ref('total_amount')).optional(),
    invoice_date: Joi.date().iso().required(),
    notes: Joi.string().allow('', null).optional()
  })
};

module.exports = invoiceValidation;