const prisma = require('../../database/client');

class AlunoRepository {
  async create(data) {
    return prisma.aluno.create({ data });
  }

  async findAll(pagina = 1, limite = 10, filtros = {}) {
    const skip = (Number(pagina) - 1) * Number(limite);
    const take = Number(limite);
    const busca = typeof filtros.busca === 'string' ? filtros.busca.trim() : '';
    const turmaId = typeof filtros.turmaId === 'string' ? filtros.turmaId.trim() : '';

    const where = {
      ativo: true,
      ...(busca
        ? {
            OR: [
              { nome: { contains: busca, mode: 'insensitive' } },
              { matricula: { contains: busca, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(turmaId
        ? { turmas: { some: { turmaId, ativo: true } } }
        : {}),
    };

    const include = {
      turmas: {
        where: { ativo: true },
        include: { turma: { select: { id: true, nome: true, turno: true, ativo: true } } },
      },
    };

    const [alunos, total] = await prisma.$transaction([
      prisma.aluno.findMany({ where, include, skip, take, orderBy: { nome: 'asc' } }),
      prisma.aluno.count({ where }),
    ]);

    return {
      dados: alunos,
      meta: {
        total,
        paginaAtual: Number(pagina),
        totalPaginas: Math.ceil(total / take),
        itensPorPagina: take,
      },
    };
  }

  async findById(id) {
    return prisma.aluno.findUnique({
      where: { id },
      include: {
        turmas: {
          where: { ativo: true },
          include: { turma: true },
        },
      },
    });
  }

  async findByMatricula(matricula) {
    return prisma.aluno.findUnique({ where: { matricula } });
  }

  async checkMatricula(matricula, ignorandoId = null) {
    const aluno = await prisma.aluno.findUnique({ where: { matricula }, select: { id: true } });
    return Boolean(aluno && aluno.id !== ignorandoId);
  }

  async update(id, data) {
    return prisma.aluno.update({ where: { id }, data });
  }

  async delete(id) {
    return prisma.aluno.update({ where: { id }, data: { ativo: false } });
  }
}

module.exports = new AlunoRepository();
