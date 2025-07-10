const Joi = require('joi');

const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
               .min(6)
               .pattern(/[a-z]/)   // au moins une minuscule
               .required()
});

module.exports = (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      message: 'Données d’inscription invalides.',
      details: error.details
    });
  }
  next();
};
