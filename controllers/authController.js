const bcrypt = require('bcryptjs'); // Cambiar de 'bcrypt' a 'bcryptjs'
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const { validationResult } = require('express-validator');

exports.login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
        const user = await User.findOne({ where: { username } });

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }

        const role = await Role.findOne({ where: { role_name: user.role } });

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, permission: role.permission },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.json({ token, user: { id: user.id, username: user.username, role: user.role, permission: role.permission } });

    } catch (error) {
        console.error("Error en el login:", error);
        res.status(500).json({ message: 'Error al procesar el login', error });
    }
};
