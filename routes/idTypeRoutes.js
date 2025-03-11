const express = require('express');
const { getIdTypes } = require('../controllers/idTypeController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, authorize(['Administrador']), getIdTypes);

module.exports = router;
