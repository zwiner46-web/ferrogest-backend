const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const email = 'zwiner46@gmail.com';
  const passwordPlano = '123456789';
  
  // Encriptar la contraseña
  const hashedPassword = await bcrypt.hash(passwordPlano, 10);

  // Crear o actualizar el usuario en la base de datos de forma segura
  const user = await prisma.user.upsert({
    where: { email: email },
    update: { 
      password: hashedPassword,
      role: 'ADMINISTRADOR'
    },
    create: {
      name: 'Administrador',
      email: email,
      password: hashedPassword,
      role: 'ADMINISTRADOR'
    }
  });

  console.log('¡Credenciales configuradas con éxito para el usuario:', user.email);
}

main()
  .catch((e) => {
    console.error('Error al actualizar:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });