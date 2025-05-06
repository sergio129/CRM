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
const identificationTypeRoutes = require('./routes/identificationTypeRoutes'); // Importa las rutas de tipos de identificación (nuevo)
const bankInfoRoutes = require('./routes/bankInfoRoutes'); // Importa las rutas de información bancaria
const loanRoutes = require('./routes/loanRoutes'); // Importa las rutas de préstamos
const paymentHistoryRoutes = require('./routes/paymentHistoryRoutes'); // Importa las rutas del historial de pagos
const permissionRoutes = require('./routes/permissionRoutes'); // Importa las rutas de permisos
const dashboardRoutes = require('./routes/dashboardRoutes'); // Importa las rutas del dashboard
const categoriaEgresoRoutes = require('./routes/categoriaEgresoRoutes'); // Importa las rutas de categorías de egresos
const egresoRoutes = require('./routes/egresoRoutes'); // Importa las rutas de egresos
const proveedorRoutes = require('./routes/proveedorRoutes'); // Importa las rutas de proveedores
const categoriaIngresoRoutes = require('./routes/categoriasIngresos'); // Importa las rutas de categorías de ingresos
const ingresoRoutes = require('./routes/ingresos'); // Importa las rutas de ingresos
const errorHandler = require('./middleware/errorHandler');
const pageAuthMiddleware = require('./middleware/pageAuthMiddleware'); // Importar middleware de autenticación para páginas
const sequelize = require('./config/database');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload'); // Para subir archivos adjuntos
const path = require('path');
const fs = require('fs');

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
    origin: "http://localhost:3000", // Permitir solicitudes desde el frontend
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Authorization"],
  })
);

app.use(bodyParser.json());
app.use(express.json());

// Middleware para redireccionar URLs con extensión .html a versiones limpias
app.use((req, res, next) => {
  const url = req.url;
  
  // Si la URL termina en .html, redirigir a la versión sin extensión
  if (url.endsWith('.html')) {
    const cleanUrl = url.substring(0, url.length - 5); // Quitar los últimos 5 caracteres (.html)
    console.log(`Redirigiendo URL con extensión: ${url} -> ${cleanUrl}`);
    return res.redirect(301, cleanUrl); // 301 es redirección permanente
  }
  
  next();
});

// Rutas específicas para páginas HTML sin extensión
app.get('/dashboard', (req, res) => {
  // Servir dashboard.html cuando se accede a /dashboard
  console.log('Acceso a /dashboard - Sirviendo dashboard.html');
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/login', (req, res) => {
  // Servir login.html cuando se accede a /login
  console.log('Acceso a /login - Sirviendo login.html');
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Para otras páginas
app.get('/:page', (req, res, next) => {
  const page = req.params.page;
  // Si tiene extensión o es una carpeta/API, pasar al siguiente middleware
  if (page.includes('.') || 
      page === 'api' || 
      page === 'js' || 
      page === 'css' || 
      page === 'img' || 
      page === 'assets') {
    return next();
  }
  
  // Intentar servir el archivo HTML correspondiente
  const htmlPath = path.join(__dirname, 'public', `${page}.html`);
  if (fs.existsSync(htmlPath)) {
    console.log(`Acceso a /${page} - Sirviendo ${page}.html`);
    return res.sendFile(htmlPath);
  }
  
  // Si no existe, continuar con la cadena de middleware
  next();
});

// Aplicar middleware de autenticación para páginas HTML antes de servir archivos estáticos
app.use(pageAuthMiddleware);

// Ruta específica para el sidebar sin extensión
app.get('/templates/sidebar', (req, res) => {
  console.log('Acceso directo a /templates/sidebar - Sirviendo sidebar.html');
  res.sendFile(path.join(__dirname, 'public/templates/sidebar.html'));
});

// Servir archivos estáticos después de validar autenticación
app.use(express.static('public'));
// Configurar alias para que /templates apunte a public/templates
app.use('/templates', express.static(path.join(__dirname, 'public/templates')));

app.use(fileUpload({
  createParentPath: true,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  },
}));

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
app.use('/api/identification-types', identificationTypeRoutes); // Añade las rutas con el formato que espera el frontend
app.use('/api/bank_info', bankInfoRoutes); // Añade las rutas de información bancaria
app.use('/api/loans', loanRoutes); // Añade las rutas de préstamos
app.use('/api/payment-history', paymentHistoryRoutes); // Añade las rutas del historial de pagos
app.use('/api/permissions', permissionRoutes); // Añade las rutas de permisos
app.use('/api/dashboard', dashboardRoutes); // Añade las rutas del dashboard
app.use('/api/categorias-egreso', categoriaEgresoRoutes); // Añade las rutas de categorías de egresos
app.use('/api/egresos', egresoRoutes); // Añade las rutas de egresos
app.use('/api/proveedores', proveedorRoutes); // Añade las rutas de proveedores
app.use('/api/categorias-ingreso', categoriaIngresoRoutes); // Añade las rutas de categorías de ingresos
app.use('/api/ingresos', ingresoRoutes); // Añade las rutas de ingresos

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



