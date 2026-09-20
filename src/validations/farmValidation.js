const Joi = require('joi');

const farmValidation = {
  updateFarmSchema: Joi.object({
    name: Joi.string().trim().optional().messages({
      'string.empty': 'لا يمكن ترك اسم المزرعة فارغاً'
    }),
    location: Joi.string().trim().optional().messages({
      'string.empty': 'لا يمكن ترك موقع المزرعة فارغاً'
    })
  }).min(1).messages({
    'object.min': 'يجب إرسال حقل واحد على الأقل (الاسم أو الموقع) للتحديث'
  })
};

module.exports = farmValidation;