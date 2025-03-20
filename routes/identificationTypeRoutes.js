const express = require('express');
const { getIdentificationTypes } = require('../controllers/identificationTypeController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, getIdentificationTypes); // Requiere autenticación

module.exports = router;
