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
const bankInfoRoutes = require('./routes/bankInfoRoutes'); // Importa las rutas de información bancaria
const loanRoutes = require('./routes/loanRoutes'); // Importa las rutas de préstamos
const paymentHistoryRoutes = require('./routes/paymentHistoryRoutes'); // Importa las rutas del historial de pagos
const permissionRoutes = require('./routes/permissionRoutes'); // Importa las rutas de permisos
const errorHandler = require('./middleware/errorHandler');
const sequelize = require('./config/database');
const bodyParser = require('body-parser');

// Cargar el archivo .env correcto según el entorno
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: envFile });

const app = express();

// Probar conexión
sequelize.authenticate()
    .then(() => {
        console.log('Conexión a la base de datos establecida correctamente.');
    })
    .catch(err => {
        console.error('No se pudo conectar a la base de datos:', err);
    });

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

// IMPORTANTE: Importar los modelos y sus relaciones antes de las rutas
require('./models/index');

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/payrolls', payrollRoutes); // Añade las rutas de nómina
app.use('/api/employees', employeeRoutes); // Añade las rutas de empleados
app.use('/api/id_types', idTypeRoutes); // Añade las rutas de tipos de identificación
app.use('/api/bank_info', bankInfoRoutes); // Añade las rutas de información bancaria
app.use('/api/loans', loanRoutes); // Añade las rutas de préstamos
app.use('/api/payment-history', paymentHistoryRoutes); // Añade las rutas del historial de pagos
app.use('/api/permissions', permissionRoutes); // Añade las rutas de permisos

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



