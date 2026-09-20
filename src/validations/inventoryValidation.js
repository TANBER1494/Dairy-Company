const Joi = require('joi');

const inventoryValidation = {
  addInventoryItemSchema: Joi.object({
    local_id: Joi.string().required().messages({
      'any.required': 'المعرف المحلي مطلوب'
    }),
    name: Joi.string().trim().required().messages({
      'string.empty': 'اسم الصنف مطلوب',
      'any.required': 'حقل اسم الصنف إلزامي'
    }),
    category: Joi.string().required().messages({
      'string.empty': 'التصنيف مطلوب',
      'any.required': 'حقل التصنيف إلزامي'
    }),
    unit: Joi.string().required().messages({
      'string.empty': 'وحدة القياس مطلوبة',
      'any.required': 'حقل الوحدة إلزامي'
    }),
    min_alert_level: Joi.number().min(0).optional().messages({
      'number.min': 'حد التنبيه الأدنى لا يمكن أن يكون بالسالب'
    }),
    unloading_cost: Joi.number().min(0).optional().messages({
      'number.min': 'سعر التنزيل لا يمكن أن يكون بالسالب'
    })
  }),

  updateInventoryItemSchema: Joi.object({
    name: Joi.string().trim().optional(),
    category: Joi.string().optional(),
    unit: Joi.string().optional(),
    min_alert_level: Joi.number().min(0).optional().messages({
      'number.min': 'حد التنبيه الأدنى لا يمكن أن يكون بالسالب'
    }),
    unloading_cost: Joi.number().min(0).optional().messages({
      'number.min': 'سعر التنزيل لا يمكن أن يكون بالسالب'
    })
  }).min(1).messages({
    'object.min': 'يجب إرسال حقل واحد على الأقل للتحديث'
  }),

  recordMovementSchema: Joi.object({
    local_id: Joi.string().required().messages({
      'any.required': 'المعرف المحلي مطلوب'
    }),
    item_id: Joi.string().required().messages({
      'any.required': 'معرف الصنف مطلوب'
    }),
    movement_type: Joi.string().valid('PURCHASE', 'PRODUCTION', 'RETURN', 'ADJUSTMENT', 'CONSUMPTION', 'SALE', 'UNLOADING').required().messages({
      'any.only': 'نوع الحركة المخزنية غير صحيح',
      'any.required': 'نوع الحركة مطلوب'
    }),
    quantity: Joi.number().greater(0).required().messages({
      'number.greater': 'الكمية يجب أن تكون أكبر من الصفر',
      'any.required': 'الكمية مطلوبة'
    }),
    unit_cost_at_time: Joi.number().min(0).required().messages({
      'number.min': 'تكلفة الوحدة لا يمكن أن تكون بالسالب',
      'any.required': 'تكلفة الوحدة مطلوبة'
    }),
    movement_date: Joi.date().iso().required().messages({
      'any.required': 'تاريخ الحركة مطلوب'
    }),
    reference_doc: Joi.string().trim().allow('', null).optional()
  }),

  produceFeedSchema: Joi.object({
    local_id: Joi.string().required().messages({
      'any.required': 'المعرف المحلي مطلوب'
    }),
    item_id: Joi.string().required().messages({
      'any.required': 'معرف الصنف (العلف) مطلوب'
    }),
    quantity: Joi.number().greater(0).required().messages({
      'number.greater': 'كمية الإنتاج يجب أن تكون أكبر من الصفر',
      'any.required': 'الكمية مطلوبة'
    }),
    unit_cost: Joi.number().min(0).required().messages({
      'number.min': 'التكلفة لا يمكن أن تكون بالسالب',
      'any.required': 'التكلفة مطلوبة'
    })
  }),

  recordDokhanSchema: Joi.object({
    local_id: Joi.string().required().messages({
      'any.required': 'المعرف المحلي مطلوب'
    }),
    item_id: Joi.string().required().messages({
      'any.required': 'معرف الصنف مطلوب'
    }),
    quantity: Joi.number().greater(0).required().messages({
      'number.greater': 'كمية التنزيل يجب أن تكون أكبر من الصفر',
      'any.required': 'الكمية مطلوبة'
    }),
    movement_date: Joi.date().iso().required().messages({
      'any.required': 'تاريخ الحركة مطلوب'
    }),
    notes: Joi.string().trim().allow('', null).optional()
  })
  ,
  updateDokhanSchema: Joi.object({
    quantity: Joi.number().greater(0).required().messages({
      'number.greater': 'كمية التنزيل يجب أن تكون أكبر من الصفر',
      'any.required': 'الكمية مطلوبة'
    }),
    movement_date: Joi.date().iso().required().messages({
      'any.required': 'تاريخ الحركة مطلوب'
    }),
    notes: Joi.string().trim().allow('', null).optional()
  })
};

module.exports = inventoryValidation;