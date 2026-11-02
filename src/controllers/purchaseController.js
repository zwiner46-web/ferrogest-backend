const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getPurchases = async (req, res) => {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        supplier: { select: { name: true, phone: true } },
        details: {
          include: { product: { select: { name: true, code: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(purchases);
  } catch (error) {
    res.json([]); // Devuelve lista vacía en vez de colapsar la vista
  }
};

const createPurchase = async (req, res) => {
  try {
    const { supplierId, items } = req.body;
    const userId = req.user && req.user.userId ? req.user.userId : 1;

    if (!supplierId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Se requiere proveedor y productos.' });
    }

    const purchase = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const detailsData = [];

      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: Number(item.productId) } });
        if (!product) throw new Error(`Producto ${item.productId} no encontrado.`);

        const cost = Number(item.cost) || Number(product.buyPrice) || 1000;
        const qty = Number(item.quantity) || 1;
        totalAmount += cost * qty;

        await tx.product.update({
          where: { id: product.id },
          data: { stock: product.stock + qty }
        });

        detailsData.push({ productId: product.id, quantity: qty, cost });
      }

      return await tx.purchase.create({
        data: {
          supplierId: Number(supplierId),
          userId: Number(userId),
          total: totalAmount,
          details: { create: detailsData }
        },
        include: { supplier: true, details: { include: { product: true } } }
      });
    });

    res.status(201).json({ message: 'Compra registrada con éxito.', purchase });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = { createPurchase, getPurchases };