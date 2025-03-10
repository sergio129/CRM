const express = require('express');
const { getClientById } = require('../controllers/clientController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:id', authenticate, getClientById);

module.exports = router;
