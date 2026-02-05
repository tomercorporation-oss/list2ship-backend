const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  phone: Joi.string().optional(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  companyName: Joi.string().required(),
  country: Joi.string().required()
});

module.exports = { registerSchema };