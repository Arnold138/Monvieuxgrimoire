const bcrypt = require('bcrypt');
const User   = require('../models/user');
const jwt    = require('jsonwebtoken');

const tokenSecret = global.TOKEN_SECRET;
if (!tokenSecret) {
  throw new Error('TOKEN_SECRET introuvable en global !');
}

exports.signup = (req, res, next) => {
  bcrypt.hash(req.body.password, 10)
    .then(hash => {
      const user = new User({ email: req.body.email, password: hash });
      return user.save();
    })
    .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
    .catch(error => res.status(400).json({ error }));
};

exports.login = (req, res, next) => {
  User.findOne({ email: req.body.email })
    .then(user => {
      if (!user) return res.status(401).json({ message: 'Identifiants invalides' });
      return bcrypt.compare(req.body.password, user.password)
        .then(valid => {
          if (!valid) return res.status(401).json({ message: 'Identifiants invalides' });

          const token = jwt.sign(
            { userId: user._id },
            tokenSecret,
            { expiresIn: '24h' }
          );
          res.status(200).json({ userId: user._id, token });
        });
    })
    .catch(() => res.status(500).json({ message: 'Erreur serveur.' }));
};
