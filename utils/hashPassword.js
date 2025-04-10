const bcrypt = require('bcrypt');

exports.hashPassword = async (password) => {
    // Desactivado el cifrado, ahora devuelve la contraseña en texto plano
    return password;
    // Código original: return await bcrypt.hash(password, 10);
};
