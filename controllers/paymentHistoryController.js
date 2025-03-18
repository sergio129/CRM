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
        const loan = await Loan.findByPk(loan_id, { include: [{ model: Client, as: 'Client' }] });
        if (!loan) {
            return res.status(404).json({ message: "Préstamo no encontrado." });
        }

        // Validar que el monto pagado no exceda el total adeudado
        const totalDue = parseFloat(loan.total_due);
        if (amount_paid > totalDue) {
            return res.status(400).json({ message: "El monto pagado no puede exceder el total adeudado." });
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

        // Actualizar el préstamo según el tipo de pago
        loan.total_due = Math.max(0, totalDue - amount_paid);
        if (payment_type === 'Cuota') {
            loan.remaining_installments = Math.max(0, loan.remaining_installments - 1);
        } else if (payment_type === 'Capital') {
            loan.amount_requested = Math.max(0, loan.amount_requested - amount_paid);
        }

        // Cambiar el estado del préstamo a "Pagado" solo si el total adeudado es 0
        if (loan.total_due === 0) {
            loan.loan_status = 'Pagado';
        }

        // Guardar los cambios en el préstamo
        await loan.save();

        // Actualizar la deuda total del cliente
        const client = loan.Client;
        client.deuda_total = Math.max(0, parseFloat(client.deuda_total || 0) - parseFloat(amount_paid));
        await client.save();

        res.status(201).json({ message: "Pago registrado correctamente.", payment, loan });
    } catch (error) {
        console.error("Error al registrar el pago:", error);
        res.status(500).json({ message: "Error al registrar el pago." });
    }
};
