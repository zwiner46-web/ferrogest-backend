const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Encriptamos correctamente tu contraseña '123456789'
  const hashedPassword = await bcrypt.hash('123456789', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'zwiner46@gmail.com' },
    update: {
      password: hashedPassword,
    },
    create: {
      email: 'zwiner46@gmail.com',
      password: hashedPassword,
      name: 'Administrador Principal',
      role: 'ADMINISTRADOR',
    },
  });

  console.log('¡Usuario Administrador creado/actualizado con éxito!');
  console.log({ email: admin.email, role: admin.role });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });