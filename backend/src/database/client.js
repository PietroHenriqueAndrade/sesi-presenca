const { PrismaClient } = require('@prisma/client');

// Cria uma instância única do Prisma para a aplicação
const prisma = new PrismaClient({
  // Ative isso se quiser ver no terminal todas as consultas SQL que o Prisma gera
  // log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

module.exports = prisma;