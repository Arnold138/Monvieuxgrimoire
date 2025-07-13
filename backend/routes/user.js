const express       = require('express');
const router        = express.Router();
const userCtrl      = require('../controllers/user');
const validateSignup = require('../middleware/validatesignup.js');
const rateLimit     = require('express-rate-limit');    ;

const loginLimiter = rateLimit({                      
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                   // 5 tentatives max par IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de tentatives de connexion. Réessaie dans 15 minutes.' }
});

router.post('/signup', validateSignup, userCtrl.signup);
router.post('/login',  loginLimiter,  userCtrl.login);   

module.exports = router;
