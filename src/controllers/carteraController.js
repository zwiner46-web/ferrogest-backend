const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ==================== CUENTAS POR COBRAR (CLIENTES) ====================

// Obtener todas las cuentas por cobrar (Cartera de Clientes)
const getAccountsReceivable = async (req, res) => {
  try {
    const accounts = await prisma.accountReceivable.findMany({
      include: {
        client: { select: { name: true, document: true, phone: true } },
        sale: { select: { id: true, total: true, createdAt: true } }
      },
      orderBy: { dueDate: 'asc' }
    });
    res.json(accounts);
  } catch (error) {
    console.error('Error al obtener cuentas por cobrar:', error);
    res.status(500).json({ error: 'Error interno al consultar las cuentas por cobrar.' });
  }
};

// Registrar un abono o pago a una cuenta por cobrar
const payAccountReceivable = async (req, res) => {
  try {
    const { id } = req.params;
    const { amountPaid } = req.body;

    if (!amountPaid || amountPaid <= 0) {
      return res.status(400).json({ error: 'El monto del abono debe ser mayor a cero.' });
    }

    const account = await prisma.accountReceivable.findUnique({
      where: { id: Number(id) }
    });

    if (!account) {
      return res.status(404).json({ error: 'Cuenta por cobrar no encontrada.' });
    }

    if (amountPaid > account.balance) {
      return res.status(400).json({ error: `El abono ($${amountPaid}) supera el saldo pendiente ($${account.balance}).` });
    }

    const newBalance = account.balance - amountPaid;
    const newStatus = newBalance === 0 ? 'PAGADA' : 'PENDIENTE';

    const updatedAccount = await prisma.accountReceivable.update({
      where: { id: Number(id) },
      data: {
        balance: newBalance,
        status: newStatus
      }
    });

    res.json({
      message: 'Abono registrado con éxito en cartera.',
      account: updatedAccount
    });
  } catch (error) {
    console.error('Error al registrar abono:', error);
    res.status(500).json({ error: 'Error al procesar el pago en cartera.' });
  }
};

// ==================== CUENTAS POR PAGAR (PROVEEDORES) ====================

// Obtener cuentas por pagar a proveedores
const getAccountsPayable = async (req, res) => {
  try {
    // Si manejas cuentas por pagar en el esquema, las consultamos aquí
    const purchases = await prisma.purchase.findMany({
      include: {
        supplier: { select: { name: true, nit: true, phone: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(purchases);
  } catch (error) {
    console.error('Error al obtener cuentas por pagar:', error);
    res.status(500).json({ error: 'Error al consultar las cuentas por pagar.' });
  }
};

module.exports = {
  getAccountsReceivable,
  payAccountReceivable,
  getAccountsPayable
};