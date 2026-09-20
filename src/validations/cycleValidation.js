const Joi = require('joi');

const cycleValidation = {
  startCycleSchema: Joi.object({
    local_id: Joi.string().required().messages({
      'any.required': 'المعرف المحلي مطلوب'
    }),
    barn_id: Joi.string().required().messages({
      'any.required': 'معرف العنبر مطلوب'
    }),
    name: Joi.string().trim().required().messages({
      'string.empty': 'اسم الدورة مطلوب',
      'any.required': 'حقل اسم الدورة إلزامي'
    }),
    type: Joi.string().required().messages({
      'string.empty': 'نوع الدورة مطلوب',
      'any.required': 'حقل نوع الدورة إلزامي'
    }),
    start_date: Joi.date().iso().required().messages({
      'any.required': 'تاريخ بدء الدورة مطلوب'
    }),
    initial_bird_count: Joi.number().greater(0).required().messages({
      'number.greater': 'لا يمكن أن يكون عدد الطيور صفراً أو بالسالب',
      'any.required': 'عدد الطيور الابتدائي مطلوب'
    })
  }),

  closeCycleSchema: Joi.object({
    end_date: Joi.date().iso().required().messages({
      'any.required': 'تاريخ الإغلاق الفعلي مطلوب'
    })
  })
};

module.exports = cycleValidation;