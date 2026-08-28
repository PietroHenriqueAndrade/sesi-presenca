const prisma = require('../../database/client');

class TurmaRepository {
  async create(data) {
    return await prisma.turma.create({ data });
  }

  // CORRIGIDO: Busca apenas turmas ativas no sistema
  async findAll(busca) {
    const termo = typeof busca === 'string' ? busca.trim() : '';
    return await prisma.turma.findMany({
      where: {
        ativo: true,
        ...(termo ? { nome: { contains: termo, mode: 'insensitive' } } : {})
      },
      orderBy: { nome: 'asc' } 
    });
  }

  async findDuplicate({ nome, anoLetivo, turno }, ignorandoId = null) {
    return prisma.turma.findFirst({
      where: {
        ativo: true,
        nome: { equals: nome, mode: 'insensitive' },
        anoLetivo,
        turno,
        ...(ignorandoId ? { id: { not: ignorandoId } } : {}),
      },
    });
  }

  async findById(id) {
    return await prisma.turma.findUnique({
      where: { id }
    });
  }

  async findAlunosByTurmaId(turmaId) {
    return await prisma.aluno.findMany({
      where: {
        turmas: {
          some: { turmaId, ativo: true }
        },
        ativo: true // Ignora os alunos que sofreram soft delete
      },
      orderBy: { nome: 'asc' } // Entrega a lista de chamada em ordem alfabética pro professor
    });
  }

  async update(id, data) {
    return await prisma.turma.update({
      where: { id },
      data
    });
  }

  // CORRIGIDO: Soft delete puro. A turma some do front, mas o histórico de presenças fica intacto no banco!
  async delete(id) {
    return await prisma.turma.update({
      where: { id },
      data: { ativo: false }
    });
  }
}

module.exports = new TurmaRepository();