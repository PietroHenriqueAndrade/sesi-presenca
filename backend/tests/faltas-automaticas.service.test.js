let diaSemana = 1;
const dataHoje = new Date('2026-08-24T00:00:00.000Z');

jest.mock('../src/utils/dateHelpers', () => ({
  agoraDayjs: jest.fn(() => ({ day: () => diaSemana })),
  dataHojeDb: jest.fn(() => dataHoje),
  agora: jest.fn(() => new Date('2026-08-24T18:00:00.000Z')),
}));
jest.mock('../src/modules/alunos/aluno.service', () => ({ buscarAlunoPorId: jest.fn() }));
jest.mock('../src/modules/turmas/turma.service', () => ({ buscarTurmaPorId: jest.fn() }));
jest.mock('../src/modules/presencas/presenca.repository', () => ({}));
jest.mock('../src/utils/logger', () => ({ info: jest.fn(), error: jest.fn() }));
jest.mock('../src/database/client', () => ({
  horario: { findMany: jest.fn() },
  presenca: { findMany: jest.fn(), createMany: jest.fn() },
}));

const prisma = require('../src/database/client');
const service = require('../src/modules/presencas/presenca.service');

describe('PresencaService - faltas automáticas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    diaSemana = 1; // SEGUNDA
    prisma.presenca.findMany.mockResolvedValue([]);
    prisma.presenca.createMany.mockResolvedValue({ count: 0 });
  });

  test('não processa faltas aos domingos', async () => {
    diaSemana = 0;
    const resultado = await service.processarFaltasAutomaticasDoDia();
    expect(resultado).toEqual({ inseridas: 0 });
    expect(prisma.horario.findMany).not.toHaveBeenCalled();
  });

  test('gera no máximo uma falta por aluno/turma mesmo com várias disciplinas no dia', async () => {
    const turma = {
      id: 'turma-1',
      ativo: true,
      alunos: [
        { alunoId: 'aluno-1', ativo: true, aluno: { id: 'aluno-1', ativo: true } },
        { alunoId: 'aluno-2', ativo: true, aluno: { id: 'aluno-2', ativo: true } },
      ],
    };
    prisma.horario.findMany.mockResolvedValue([
      { turmaId: 'turma-1', disciplinaId: 'disc-1', turma },
      { turmaId: 'turma-1', disciplinaId: 'disc-2', turma },
    ]);

    const resultado = await service.processarFaltasAutomaticasDoDia();

    expect(resultado).toEqual({ inseridas: 2 });
    expect(prisma.presenca.createMany).toHaveBeenCalledTimes(1);
    const faltas = prisma.presenca.createMany.mock.calls[0][0].data;
    expect(faltas).toHaveLength(2);
    expect(new Set(faltas.map((f) => `${f.alunoId}:${f.turmaId}`)).size).toBe(2);
    expect(faltas.every((f) => f.status === 'AUSENTE' && f.origem === 'SISTEMA')).toBe(true);
  });

  test('não cria falta para quem já tem registro de presença no dia', async () => {
    const turma = {
      id: 'turma-1',
      alunos: [
        { alunoId: 'aluno-1', aluno: { ativo: true } },
        { alunoId: 'aluno-2', aluno: { ativo: true } },
      ],
    };
    prisma.horario.findMany.mockResolvedValue([{ turmaId: 'turma-1', turma }]);
    prisma.presenca.findMany.mockResolvedValue([{ alunoId: 'aluno-1', turmaId: 'turma-1' }]);

    const resultado = await service.processarFaltasAutomaticasDoDia();

    expect(resultado).toEqual({ inseridas: 1 });
    expect(prisma.presenca.createMany.mock.calls[0][0].data[0].alunoId).toBe('aluno-2');
  });
});
