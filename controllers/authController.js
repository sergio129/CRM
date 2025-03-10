const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Buscar usuario en la base de datos
        const user = await User.findOne({ where: { username } });

        console.log("Usuario encontrado:", user); // 🔍 Verifica si Sequelize devuelve el usuario

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        console.log("Contraseña ingresada:", password);
        console.log("Hash en BD:", user.password_hash);

        // Comparar la contraseña ingresada con la almacenada
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        console.log("Resultado de bcrypt.compare:", isPasswordValid); // 🔍 Verifica si bcrypt devuelve true o false

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }
// Obtener los permisos del rol
const role = await Role.findOne({ where: { role_name: user.role } });

        // Generar Token JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role,  permission: role.permission },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.json({ token, user: { id: user.id, username: user.username, role: user.role,permission: role.permission } });

    } catch (error) {
        console.error("Error en el login:", error);
        res.status(500).json({ message: 'Error al procesar el login', error });
    }
};
