const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { supplier: true },
      orderBy: { id: 'asc' }
    });

    const sanitized = products.map((p, idx) => ({
      id: p.id,
      name: p.name || 'Producto Ferretería',
      code: p.code || `REF-${100 + idx}`,
      price: Number(p.price) || 10000,
      stock: Number(p.stock) || 0,
      supplierId: p.supplierId || 1,
      supplier: p.supplier || { name: 'Proveedor General' }
    }));

    res.json(sanitized);
  } catch (error) {
    console.error('Error al consultar productos:', error);
    res.status(500).json({ error: 'Error interno al consultar los productos.' });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, code, price, stock, supplierId } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'El nombre del producto es obligatorio.' });
    }

    const newProduct = await prisma.product.create({
      data: {
        name: name.trim(),
        code: (code && code.trim() !== '') ? code.trim() : `REF-${Math.floor(Math.random() * 9000 + 1000)}`,
        price: Number(price) || 15000,
        stock: Number(stock) || 0,
        supplierId: supplierId ? Number(supplierId) : 1
      },
      include: { supplier: true }
    });

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(400).json({ error: error.message || 'Error al registrar el producto en la base de datos.' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, price, stock, supplierId } = req.body;
    
    const updated = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        ...(name && { name: name.trim() }),
        ...(code && { code: code.trim() }),
        ...(price !== undefined && { price: Number(price) }),
        ...(stock !== undefined && { stock: Number(stock) }),
        ...(supplierId !== undefined && { supplierId: Number(supplierId) })
      },
      include: { supplier: true }
    });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar el producto.' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id: Number(id) } });
    res.json({ message: 'Producto eliminado con éxito.' });
  } catch (error) {
    res.status(400).json({ error: 'Error al eliminar el producto.' });
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
};