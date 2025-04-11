const express = require('express');
const { login, verifyToken } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/login', login);
router.get('/verify', authenticate, verifyToken);

module.exports = router;
