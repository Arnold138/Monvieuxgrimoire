const jwt = require('jsonwebtoken');
const tokenSecret = global.TOKEN_SECRET;
if (!tokenSecret) {
  throw new Error('TOKEN_SECRET introuvable en global !');
}

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    if (!token) {
      return res.status(401).json({ message: 'Token manquant.' });
    }

    const decoded = jwt.verify(token, tokenSecret);
    req.auth = { userId: decoded.userId };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Authentification invalide.' });
  }
};
