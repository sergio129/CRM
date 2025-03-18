const PaymentHistory = require('../models/PaymentHistory');
const Loan = require('../models/Loan');
const Client = require('../models/Client');

exports.getPaymentHistoryByLoan = async (req, res) => {
    try {
        const { loanId } = req.params;
        const payments = await PaymentHistory.findAll({
            where: { loan_id: loanId },
            include: [{ model: Loan, as: 'Loan', attributes: ['loan_number'] }]
        });

        res.json(payments);
    } catch (error) {
        console.error("Error al obtener el historial de pagos:", error);
        res.status(500).json({ message: "Error al obtener el historial de pagos." });
    }
};

exports.addPayment = async (req, res) => {
    try {
        const { loan_id, payment_date, amount_paid, payment_method, payment_type, notes } = req.body;

        // Verificar si el préstamo existe
        const loan = await Loan.findByPk(loan_id);
        if (!loan) {
            return res.status(404).json({ message: "Préstamo no encontrado." });
        }

        // Registrar el pago
        const payment = await PaymentHistory.create({
            loan_id,
            payment_date,
            amount_paid,
            payment_method,
            payment_type,
            notes
        });

        // Actualizar el saldo pendiente y las cuotas restantes
        let remainingBalance = parseFloat(loan.total_due);
        let remainingInstallments = loan.remaining_installments;

        // Abonar el pago al saldo pendiente
        remainingBalance -= amount_paid;

        // Si el saldo pendiente es menor o igual a 0, actualizar cuotas pendientes a 0
        if (remainingBalance <= 0) {
            remainingBalance = 0;
            remainingInstallments = 0;
        } else {
            // Recalcular cuotas pendientes si el saldo no es 0
            const monthlyRate = loan.interest_rate / 100 / 12;
            const installmentAmount = loan.installment_amount || 
                (loan.amount_requested * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -loan.payment_term));

            remainingInstallments = Math.ceil(remainingBalance / installmentAmount);
        }

        // Actualizar el préstamo
        loan.total_due = remainingBalance;
        loan.remaining_installments = remainingInstallments;

        // Cambiar el estado del préstamo a "Pagado" si el saldo es 0
        if (remainingBalance === 0) {
            loan.loan_status = 'Pagado';
        }

        await loan.save();

        res.status(201).json({ message: "Pago registrado correctamente.", payment, loan });
    } catch (error) {
        console.error("Error al registrar el pago:", error);
        res.status(500).json({ message: "Error al registrar el pago." });
    }
};
