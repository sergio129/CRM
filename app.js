const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // ✅ Importar cors solo una vez
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const clientRoutes = require('./routes/clientRoutes');
const errorHandler = require('./middleware/errorHandler');
const sequelize = require('./utils/database');
const roleRoutes = require('./routes/roleRoutes');

dotenv.config();

const app = express();

// Configuración de CORS
app.use(
  cors({
    origin: "http://localhost:5000", // Reemplaza con el puerto de tu frontend
    allowedHeaders: ["Content-Type", "Authorization"], // 🔹 Permite el encabezado "Authorization"
    exposedHeaders: ["Authorization"], // 🔹 Expone el encabezado "Authorization"
  })
);

app.use(express.json());
app.use(express.static('public'));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/roles', roleRoutes);

// Middleware de errores
app.use(errorHandler);

// Conectar Base de Datos
sequelize
  .sync()
  .then(() => console.log('Database connected successfully'))
  .catch((err) => console.error('Database connection error:', err));

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



