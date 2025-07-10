const express = require ('express');
const router = express.Router();
const userCtrl = require('../controllers/user');
const rateLimiter = require('../middleware/ratelimiter.js'); 
const validateSignup  = require('../middleware/validatesignup.js');

router.post ('/signup', validateSignup, userCtrl.signup);
router.post ('/login',  rateLimiter,userCtrl.login);

module.exports = router;
