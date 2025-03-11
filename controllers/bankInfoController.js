const BankInfo = require('../models/BankInfo');
const { validationResult } = require('express-validator');

exports.getBankInfoByEmployeeId = async (req, res) => {
    try {
        const bankInfo = await BankInfo.findOne({
            where: { employee_id: req.params.employee_id }
        });

        if (!bankInfo) return res.status(404).json({ message: "Información bancaria no encontrada" });

        res.json(bankInfo);
    } catch (error) {
        console.error("Error al obtener la información bancaria:", error);
        res.status(500).json({ message: "Error al obtener la información bancaria", error });
    }
};

exports.createOrUpdateBankInfo = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { employee_id, bank_account_number, bank_account_type, bank_name } = req.body;
        const bankInfo = await BankInfo.findOne({ where: { employee_id } });

        if (bankInfo) {
            await bankInfo.update({
                bank_account_number,
                bank_account_type,
                bank_name
            });
            res.json({ message: "Información bancaria actualizada correctamente", bankInfo });
        } else {
            const newBankInfo = await BankInfo.create({
                employee_id,
                bank_account_number,
                bank_account_type,
                bank_name
            });
            res.status(201).json({ message: "Información bancaria creada correctamente", bankInfo: newBankInfo });
        }
    } catch (error) {
        console.error("Error al crear o actualizar la información bancaria:", error);
        res.status(500).json({ message: "Error al crear o actualizar la información bancaria", error: error.message });
    }
};
