const express = require('express');
const { getBankInfoByEmployeeId, createOrUpdateBankInfo } = require('../controllers/bankInfoController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:employee_id', authenticate, authorize(['Administrador']), getBankInfoByEmployeeId);
router.post('/', authenticate, authorize(['Administrador']), createOrUpdateBankInfo);

module.exports = router;
