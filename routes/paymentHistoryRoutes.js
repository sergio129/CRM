const express = require('express');
const router = express.Router();
const paymentHistoryController = require('../controllers/paymentHistoryController');

router.get('/:loanId', paymentHistoryController.getPaymentHistoryByLoan);
router.post('/', paymentHistoryController.addPayment);

module.exports = router;
