const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const turmas = await prisma.turma.findMany({
    where: { ativo: true },
    orderBy: [{ anoLetivo: 'desc' }, { nome: 'asc' }],
    select: { id: true, nome: true, anoLetivo: true, turno: true, sala: true },
  });
  if (!turmas.length) {
    console.log('Nenhuma turma ativa encontrada.');
    return;
  }
  console.table(turmas);
}

main()
  .catch((error) => {
    console.error('Falha ao listar turmas:', error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
