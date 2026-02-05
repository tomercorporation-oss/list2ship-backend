const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  country: Joi.string().required()
});

module.exports = { loginSchema };