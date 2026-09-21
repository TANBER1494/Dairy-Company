const Joi = require('joi');

const loginSchema = Joi.object({
  username: Joi.string().required().messages({
    'string.empty': 'اسم المستخدم مطلوب',
    'any.required': 'اسم المستخدم مطلوب'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'كلمة المرور مطلوبة',
    'any.required': 'كلمة المرور مطلوبة'
  })
});

const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string().required().messages({
    'string.empty': 'رمز التحديث (refresh token) مطلوب',
    'any.required': 'رمز التحديث (refresh token) مطلوب'
  })
});

module.exports = {
  loginSchema,
  refreshTokenSchema
};