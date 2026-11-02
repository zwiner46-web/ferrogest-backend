const express = require('express');
const router = express.Router();
const { 
  getAccountsReceivable, 
  payAccountReceivable, 
  getAccountsPayable 
} = require('../controllers/carteraController');
const { verifyToken, verifyRole } = require('../controllers/authController');

router.use(verifyToken);

// Cuentas por cobrar (Admin y Contador)
router.get('/receivable', verifyRole(['ADMINISTRADOR', 'CONTADOR']), getAccountsReceivable);
router.post('/receivable/:id/pay', verifyRole(['ADMINISTRADOR']), payAccountReceivable);

// Cuentas por pagar (Admin y Contador)
router.get('/payable', verifyRole(['ADMINISTRADOR', 'CONTADOR']), getAccountsPayable);

module.exports = router;