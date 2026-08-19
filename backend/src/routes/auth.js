const express = require('express');
const router = express.Router();
const { register, login, me, updateProfile, changePassword, forgotPassword } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth.requireAuth, me);
router.put('/profile', auth.requireAuth, updateProfile);
router.post('/change-password', auth.requireAuth, changePassword);
router.post('/forgot-password', forgotPassword);

module.exports = router;
