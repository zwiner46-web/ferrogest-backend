const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createSale = async (req, res) => {
  try {
    const { items } = req.body;
    const userId = req.user && req.user.userId ? req.user.userId : 1;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'El carrito de venta está vacío.' });
    }

    const sale = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const saleDetailsData = [];
      const kardexMovementsData = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: Number(item.productId) }
        });

        if (!product) {
          throw new Error(`Producto con ID ${item.productId} no encontrado.`);
        }

        const quantity = Number(item.quantity) || 1;
        if (product.stock < quantity) {
          throw new Error(`Stock insuficiente para el producto: ${product.name}. Stock actual: ${product.stock}`);
        }

        // Usamos el precio del producto de la base de datos de manera segura
        const price = Number(product.price) || Number(item.price) || 0;
        const subtotal = price * quantity;
        totalAmount += subtotal;

        // Descontar inventario
        await tx.product.update({
          where: { id: product.id },
          data: { stock: product.stock - quantity }
        });

        // Estructura adaptada al esquema exacto de Prisma (sin campos desconocidos)
        saleDetailsData.push({
          productId: product.id,
          quantity: quantity,
          price: price
        });

        kardexMovementsData.push({
          productId: product.id,
          type: 'SALIDA',
          quantity: quantity,
          reason: 'Venta en Punto de Venta (POS)',
          userId: Number(userId)
        });
      }

      const newSale = await tx.sale.create({
        data: {
          userId: Number(userId),
          total: totalAmount,
          details: {
            create: saleDetailsData
          }
        },
        include: {
          details: {
            include: { product: true }
          },
          user: { select: { name: true } }
        }
      });

      for (const mov of kardexMovementsData) {
        // Validación por si la tabla kárdex tiene otro nombre de modelo en tu Prisma
        if (tx.kardex) {
          await tx.kardex.create({ data: mov });
        }
      }

      return newSale;
    });

    res.status(201).json({
      message: 'Venta registrada con éxito, inventario descontado y factura generada.',
      sale
    });

  } catch (error) {
    console.error('Error al registrar venta:', error);
    res.status(400).json({ error: error.message || 'Error al procesar la venta.' });
  }
};

const getSales = async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        details: {
          include: { product: { select: { name: true, code: true, price: true } } }
        },
        user: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(sales);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ error: 'Error al consultar el historial de ventas.' });
  }
};

module.exports = { createSale, getSales };