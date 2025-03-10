const bcrypt = require('bcrypt');
const sequelize = require('./utils/database');
const User = require('./models/User');

const seedUsers = async () => {
    try {
        await sequelize.sync({ force: true }); // 🚨 Esto borrará y recreará la base de datos

        const users = [
            { full_name: 'Juan Pérez', email: 'juan@example.com', username: 'juanperez', password: 'Sheyo_0129', role: 'Administrador' },
            { full_name: 'María López', email: 'maria@example.com', username: 'marialopez', password: 'Maria_456', role: 'Asesor' },
            { full_name: 'Carlos Torres', email: 'carlos@example.com', username: 'carlostorres', password: 'Carlos_789', role: 'Cliente' }
        ];

        for (let user of users) {
            const passwordHash = await bcrypt.hash(user.password, 10); // 🔹 Hash de la contraseña
            await User.create({
                full_name: user.full_name,
                email: user.email,
                username: user.username,
                password_hash: passwordHash,
                role: user.role,
                status: 'Activo'
            });
        }

        console.log("✅ Usuarios insertados correctamente.");
        process.exit();
    } catch (error) {
        console.error("❌ Error al poblar la base de datos:", error);
        process.exit(1);
    }
};

seedUsers();
