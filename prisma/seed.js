const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando siembra de datos para FerroGest...');

  // 1. Plan de Cuentas Contables (NIIF para PYMES / PUC)
  const accounts = [
    { code: '1105', name: 'Caja General', type: 'ACTIVO' },
    { code: '1305', name: 'Clientes / Cartera por Cobrar', type: 'ACTIVO' },
    { code: '1435', name: 'Inventario de Mercancías No Fabricadas por la Empresa', type: 'ACTIVO' },
    { code: '2205', name: 'Proveedores Nacionales', type: 'PASIVO' },
    { code: '3115', name: 'Aportes Sociales (Patrimonio)', type: 'PATRIMONIO' },
    { code: '4135', name: 'Comercio al por Mayor y al por Menor (Ingresos por Ventas)', type: 'INGRESO' },
    { code: '5105', name: 'Gastos de Operación y Personal', type: 'GASTO' },
  ];

  for (const acc of accounts) {
    await prisma.accountPlan.upsert({
      where: { code: acc.code },
      update: {},
      create: acc,
    });
  }

  // 2. Usuarios con Roles Únicos (Administrador y Contador)
  const hashedPasswordAdmin = await bcrypt.hash('Admin123*', 10);
  const hashedPasswordContador = await bcrypt.hash('Contador123*', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ferrogest.com' },
    update: {},
    create: {
      name: 'Administrador General',
      email: 'admin@ferrogest.com',
      password: hashedPasswordAdmin,
      role: 'ADMINISTRADOR',
    },
  });

  await prisma.user.upsert({
    where: { email: 'contador@ferrogest.com' },
    update: {},
    create: {
      name: 'Contador Auditor',
      email: 'contador@ferrogest.com',
      password: hashedPasswordContador,
      role: 'CONTADOR',
    },
  });

  // 3. Proveedor Inicial
  const supplier = await prisma.supplier.upsert({
    where: { nit: '900123456-1' },
    update: {},
    create: {
      name: 'Distribuidora Ferretera de la Sabana S.A.S.',
      nit: '900123456-1',
      phone: '6018654321',
      address: 'Vía Chía - Cajicá Km 2, Chía, Cundinamarca',
    },
  });

  // 4. Generación de 300 Productos
  const categoryTemplates = [
    {
      name: 'Tornillería',
      items: ['Tornillo Autoperforante', 'Chazo Plástico', 'Perno Hexagonal', 'Tuerca Galvanizada', 'Arandela de Presión', 'Tornillo Goloso'],
      units: ['UNIDAD', 'CAJA'],
      baseCost: 300,
    },
    {
      name: 'Herramientas',
      items: ['Martillo de Uña', 'Alicate Universal', 'Destornillador de Estrella', 'Llave Expansiva 8"', 'Flexómetro 5m', 'Cinta Métrica'],
      units: ['UNIDAD'],
      baseCost: 8000,
    },
    {
      name: 'Plomería',
      items: ['Tubo PVC Presión 1/2"', 'Codo PVC 90° 1/2"', 'Limpiador PVC 760g', 'Soldadura Líquida PVC', 'Válvula de Bola 1/2"', 'Cinta Teflón'],
      units: ['UNIDAD', 'METRO'],
      baseCost: 2500,
    },
    {
      name: 'Electricidad',
      items: ['Cable Dúplex 14 AWG', 'Interruptor Sencillo', 'Tomacorriente Doble', 'Cinta Aislar Negra', 'Breaker 20A Monofásico', 'Bombillo LED 12W'],
      units: ['UNIDAD', 'METRO'],
      baseCost: 3500,
    },
    {
      name: 'Pinturas',
      items: ['Esmalte Sintético Blanco 1/4 Galón', 'Vinilo Tipo 1 Blanco Galón', 'Brocha de Cerda 2"', 'Rodillo Antigoteo 9"', 'Thinner Corriente 1L'],
      units: ['UNIDAD'],
      baseCost: 12000,
    },
    {
      name: 'Construcción',
      items: ['Cemento Gris 50kg', 'Arena de Peña m3', 'Varilla Corrugada 1/2"', 'Alambre Quemado N18 kg', 'Sika 1 Impermeabilizante 1kg'],
      units: ['UNIDAD', 'KILO'],
      baseCost: 18000,
    },
  ];

  for (let i = 1; i <= 300; i++) {
    const template = categoryTemplates[(i - 1) % categoryTemplates.length];
    const itemBaseName = template.items[(i - 1) % template.items.length];
    const unitMeasure = template.units[(i - 1) % template.units.length];
    
    const barcode = `770${String(i).padStart(9, '0')}`;
    const name = `${itemBaseName} Ref. F-GO${i}`;
    const buyPrice = Math.round(template.baseCost + (i * 150));
    const sellPrice = Math.round(buyPrice * 1.35);
    const stock = (i % 7 === 0) ? 3 : Math.floor(Math.random() * 60) + 10;
    const minStock = 5;

    await prisma.product.upsert({
      where: { barcode },
      update: {},
      create: {
        barcode,
        name,
        category: template.name,
        brand: 'FerroPro',
        description: `Especificación estándar ferretera para ${template.name.toLowerCase()} - Referencia #${i}`,
        unitMeasure,
        buyPrice,
        sellPrice,
        stock,
        minStock,
      },
    });

    const createdProduct = await prisma.product.findUnique({ where: { barcode } });
    if (createdProduct) {
      await prisma.kardex.create({
        data: {
          productId: createdProduct.id,
          type: 'ENTRADA',
          quantity: stock,
          reason: 'Inventario inicial de apertura de sistema',
          userId: adminUser.id,
        },
      });
    }
  }

  console.log('🎉 ¡Siembra completada exitosamente con 300 productos, Kardex inicial, Plan NIIF y usuarios de acceso!');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });