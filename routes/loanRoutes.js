const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');
const Loan = require('../models/Loan'); // Importar el modelo Loan
const Client = require('../models/Client'); // Importar el modelo Client si es necesario

router.get('/', loanController.getLoans);
router.post('/', loanController.createLoan);
router.put('/:id', loanController.updateLoan);
router.delete('/:id', loanController.deleteLoan);

router.get('/:id', async (req, res) => {
    try {
        const loan = await Loan.findByPk(req.params.id, {
            include: [
                { model: Client, as: 'Client', attributes: ['full_name', 'id_number'] },
                { model: Client, as: 'CoSigner', attributes: ['full_name', 'id_number'] }
            ]
        });

        if (!loan) {
            return res.status(404).json({ message: "Préstamo no encontrado." });
        }

        res.json(loan);
    } catch (error) {
        console.error("Error al obtener el préstamo:", error);
        res.status(500).json({ message: "Error al obtener el préstamo." });
    }
});

module.exports = router;
