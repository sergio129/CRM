const jwt = require('jsonwebtoken');

exports.authenticate = (req, res, next) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
        return res.status(401).json({ message: "Acceso denegado. No hay token." });
    }

    const token = authHeader.split(" ")[1]; // 🔹 Extrae el token después de "Bearer"

    if (!token) {
        return res.status(401).json({ message: "Token inválido o mal formado." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // 🔹 Guardar info del usuario en `req.user`
        next();
    } catch (error) {
        return res.status(403).json({ message: "Token inválido o expirado." });
    }
};
