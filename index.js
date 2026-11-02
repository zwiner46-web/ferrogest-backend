const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Configuración de Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de peticiones para auditoría local
app.use((req, res, next) => {
  console.log(`[API Request] ${req.method} ${req.originalUrl}`);
  next();
});

// Importación segura de Rutas del Sistema FerroGest
const productRoutes = require('./src/routes/productRoutes');
const purchaseRoutes = require('./src/routes/purchaseRoutes');
const saleRoutes = require('./src/routes/saleRoutes');
const authRoutes = require('./src/routes/authRoutes');
const accountingRoutes = require('./src/routes/accountingRoutes');
const carteraRoutes = require('./src/routes/carteraRoutes');

// Montaje de Endpoints
app.use('/api/products', productRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/cartera', carteraRoutes);

// Verificación de Estado y Base de Datos (PostgreSQL / Prisma)
app.get('/', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'success',
      message: 'Servidor backend de FerroGest operando al 100% y conectado a PostgreSQL.',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'El servidor está activo pero la base de datos presenta problemas de conexión.',
      details: error.message
    });
  }
});

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error('Error crítico en el servidor:', err.stack);
  res.status(500).json({
    error: 'Error interno en el servidor backend de FerroGest.',
    details: err.message
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 FerroGest Backend corriendo exitosamente en el puerto ${PORT}`);
  console.log('====================================================');
});