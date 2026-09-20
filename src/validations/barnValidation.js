const Joi = require('joi');

const barnValidation = {
  addBarnSchema: Joi.object({
    local_id: Joi.string().required().messages({
      'any.required': 'المعرف المحلي مطلوب'
    }),
    name: Joi.string().trim().required().messages({
      'string.empty': 'اسم العنبر مطلوب',
      'any.required': 'حقل اسم العنبر إلزامي'
    }),
    barn_type: Joi.string().required().messages({
      'string.empty': 'نوع العنبر مطلوب',
      'any.required': 'حقل نوع العنبر إلزامي'
    }),
    capacity: Joi.number().greater(0).required().messages({
      'number.greater': 'سعة العنبر يجب أن تكون أكبر من الصفر',
      'any.required': 'سعة العنبر مطلوبة'
    })
  }),

  updateBarnSchema: Joi.object({
    name: Joi.string().trim().optional(),
    barn_type: Joi.string().optional(),
    capacity: Joi.number().greater(0).optional().messages({
      'number.greater': 'سعة العنبر يجب أن تكون أكبر من الصفر'
    }),
    status: Joi.string().valid('ACTIVE', 'INACTIVE','MAINTENANCE').optional()
  }).min(1).messages({
    'object.min': 'يجب إرسال حقل واحد على الأقل للتحديث'
  })
};

module.exports = barnValidation;