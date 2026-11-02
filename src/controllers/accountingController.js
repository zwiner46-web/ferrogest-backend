const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAccountingEntries = async (req, res) => {
  try {
    // Si la tabla de asientos contables existe
    if (prisma.accountingEntry) {
      const entries = await prisma.accountingEntry.findMany({ orderBy: { createdAt: 'desc' } });
      return res.json(entries);
    }
    res.json([]);
  } catch (error) {
    res.json([]);
  }
};

// Alias para satisfacer la ruta /journal (getJournalEntries)
const getJournalEntries = getAccountingEntries;

// Controlador para el Plan de Cuentas PUC
const getAccountPlan = async (req, res) => {
  try {
    // Devolvemos el plan de cuentas PUC base de FerroGest
    const accounts = [
      { code: '110505', name: 'Caja General' },
      { code: '143501', name: 'Mercancías No Fabricadas' },
      { code: '220505', name: 'Proveedores Nacionales' },
      { code: '311505', name: 'Aportes Sociales' },
      { code: '413501', name: 'Comercio al por menor' }
    ];
    res.json(accounts);
  } catch (error) {
    res.json([]);
  }
};

const getCartera = async (req, res) => {
  try {
    if (prisma.cartera) {
      const cartera = await prisma.cartera.findMany();
      return res.json(cartera);
    }
    res.json([]);
  } catch (error) {
    res.json([]);
  }
};

module.exports = { 
  getAccountingEntries, 
  getJournalEntries, 
  getAccountPlan, 
  getCartera 
};