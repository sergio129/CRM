const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const clientRoutes = require('./routes/clientRoutes');
const roleRoutes = require('./routes/roleRoutes');
const payrollRoutes = require('./routes/payrollRoutes'); // Importa las rutas de nómina
const employeeRoutes = require('./routes/employeeRoutes'); // Importa las rutas de empleados
const idTypeRoutes = require('./routes/idTypeRoutes'); // Importa las rutas de tipos de identificación
const errorHandler = require('./middleware/errorHandler');
const sequelize = require('./utils/database');
const bodyParser = require('body-parser');

dotenv.config();

const app = express();

// Configuración de CORS
app.use(
  cors({
    origin: "http://localhost:5000", // Reemplaza con el puerto de tu frontend
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Authorization"],
  })
);

app.use(bodyParser.json());
app.use(express.json());
app.use(express.static('public'));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/payrolls', payrollRoutes); // Añade las rutas de nómina
app.use('/api/employees', employeeRoutes); // Añade las rutas de empleados
app.use('/api/id_types', idTypeRoutes); // Añade las rutas de tipos de identificación

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



