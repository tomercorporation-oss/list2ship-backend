const Joi = require('joi');

const verifyOtpSchema = Joi.object({
  userId: Joi.string().required().messages({
    'string.empty': 'User ID is required',
    'any.required': 'User ID is required'
  }),
  otp: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      'string.empty': 'OTP is required',
      'string.length': 'OTP must be exactly 6 digits',
      'string.pattern.base': 'OTP must contain only numbers',
      'any.required': 'OTP is required'
    })
});

// Alternative with custom validation for UUID (if you're using UUIDs)
const verifyOtpSchemaWithUUID = Joi.object({
  userId: Joi.string()
    .guid({ version: ['uuidv4'] })
    .required()
    .messages({
      'string.guid': 'User ID must be a valid UUID',
      'string.empty': 'User ID is required',
      'any.required': 'User ID is required'
    }),
  otp: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      'string.empty': 'OTP is required',
      'string.length': 'OTP must be exactly 6 digits',
      'string.pattern.base': 'OTP must contain only numbers',
      'any.required': 'OTP is required'
    })
});

module.exports = { 
  verifyOtpSchema,
  verifyOtpSchemaWithUUID 
};