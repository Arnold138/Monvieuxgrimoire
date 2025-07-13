const Joi = require('joi');

const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(6)
      .message('Le mot de passe doit contenir au moins 6 caractères.')
    .pattern(/[a-z]/)
      .message('Le mot de passe doit contenir au moins une lettre minuscule.')
    .pattern(/[A-Z]/)
      .message('Le mot de passe doit contenir au moins une lettre majuscule.')
    .pattern(/[0-9]/)
      .message('Le mot de passe doit contenir au moins un chiffre.')
    .pattern(/[!@#$%^&*]/)
      .message('Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*).')
    .required()
      .messages({
        'string.empty': 'Le mot de passe est requis.'
      })
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
