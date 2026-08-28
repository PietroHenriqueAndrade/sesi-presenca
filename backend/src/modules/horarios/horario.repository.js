const prisma = require('../../database/client');

class HorarioRepository {
  async create(data) {
    return prisma.horario.create({ data, include: { turma: true, disciplina: true } });
  }

  async findAll() {
    return prisma.horario.findMany({
      where: { ativo: true },
      include: { turma: true, disciplina: true },
      orderBy: [{ turmaId: 'asc' }, { diaSemana: 'asc' }, { horaInicio: 'asc' }],
    });
  }

  async findById(id) {
    return prisma.horario.findUnique({ where: { id }, include: { turma: true, disciplina: true } });
  }

  async update(id, data) {
    return prisma.horario.update({ where: { id }, data, include: { turma: true, disciplina: true } });
  }

  async softDelete(id) {
    return prisma.horario.update({ where: { id }, data: { ativo: false } });
  }

  async findByTurmaEDia(turmaId, diaSemana) {
    return prisma.horario.findMany({
      where: { turmaId, diaSemana, ativo: true },
      include: { disciplina: true },
      orderBy: { horaInicio: 'asc' },
    });
  }

  async findConflito({ turmaId, diaSemana, horaInicio, horaFim, ignorarId = null }) {
    return prisma.horario.findFirst({
      where: {
        turmaId,
        diaSemana,
        ativo: true,
        ...(ignorarId ? { id: { not: ignorarId } } : {}),
        horaInicio: { lt: horaFim },
        horaFim: { gt: horaInicio },
      },
    });
  }
}

module.exports = new HorarioRepository();
