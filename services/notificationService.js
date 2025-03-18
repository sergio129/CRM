const nodemailer = require('nodemailer');

class NotificationService {
    static async sendEmail(to, subject, text) {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Correo enviado a ${to}`);
        } catch (error) {
            console.error('Error al enviar correo:', error);
        }
    }
}

module.exports = NotificationService;
