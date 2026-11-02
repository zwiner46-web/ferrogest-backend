const express = require('express');
const router = express.Router();
const { 
  getJournalEntries, 
  getAccountPlan 
} = require('../controllers/accountingController');
const { verifyToken, verifyRole } = require('../controllers/authController');

router.use(verifyToken);

// Consultar Libro Diario (Exclusivo para Administrador y Contador)
router.get('/journal', verifyRole(['ADMINISTRADOR', 'CONTADOR']), getJournalEntries);

// Consultar Plan de Cuentas PUC
router.get('/accounts', verifyRole(['ADMINISTRADOR', 'CONTADOR']), getAccountPlan);

module.exports = router;