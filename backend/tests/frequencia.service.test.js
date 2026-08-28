jest.mock('../src/modules/alunos/aluno.repository', () => ({
  findById: jest.fn(),
}));
jest.mock('../src/modules/presencas/presenca.repository', () => ({
  countByStatusAndAluno: jest.fn(),
  countAgrupadoPorDisciplina: jest.fn(),
}));
jest.mock('../src/modules/alertas/alerta.service', () => ({
  checarEGerarAlerta: jest.fn().mockResolvedValue(null),
}));
jest.mock('../src/modules/auditoria/audit.service', () => ({ registrarLog: jest.fn() }));
jest.mock('../src/modules/ia/python.client', () => ({ excluirBiometriaAluno: jest.fn() }));
jest.mock('../src/database/client', () => ({
  disciplina: { findUnique: jest.fn() },
}));

const alunoRepository = require('../src/modules/alunos/aluno.repository');
const presencaRepository = require('../src/modules/presencas/presenca.repository');
const alertaService = require('../src/modules/alertas/alerta.service');
const prisma = require('../src/database/client');
const alunoService = require('../src/modules/alunos/aluno.service');

describe('AlunoService - cálculo de frequência', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    alunoRepository.findById.mockResolvedValue({ id: 'aluno-1', ativo: true });
  });

  test('considera presença, atraso e saída antecipada como comparecimento', async () => {
    presencaRepository.countByStatusAndAluno.mockResolvedValue([
      { status: 'PRESENTE', _count: { _all: 3 } },
      { status: 'ATRASO', _count: { _all: 1 } },
      { status: 'SAIDA_ANTECIPADA', _count: { _all: 1 } },
      { status: 'AUSENTE', _count: { _all: 1 } },
      { status: 'JUSTIFICADO', _count: { _all: 2 } },
    ]);

    const resultado = await alunoService.calcularFrequenciaPercentual('aluno-1');

    expect(resultado.totalAulasPrevistas).toBe(8);
    expect(resultado.frequenciaPercentual).toBe(62.5);
    expect(resultado.statusRisco).toBe('EM_RISCO');
    expect(resultado.detalhes.justificados).toBe(2);
    expect(alertaService.checarEGerarAlerta).toHaveBeenCalledWith('aluno-1', null, 62.5);
  });

  test('não transforma falta justificada em presença', async () => {
    presencaRepository.countByStatusAndAluno.mockResolvedValue([
      { status: 'PRESENTE', _count: { _all: 3 } },
      { status: 'JUSTIFICADO', _count: { _all: 1 } },
    ]);

    const resultado = await alunoService.calcularFrequenciaPercentual('aluno-1');

    expect(resultado.frequenciaPercentual).toBe(75);
    expect(resultado.statusRisco).toBe('REGULAR');
  });

  test('retorna 100% quando ainda não existem registros', async () => {
    presencaRepository.countByStatusAndAluno.mockResolvedValue([]);

    const resultado = await alunoService.calcularFrequenciaPercentual('aluno-1');

    expect(resultado.totalAulasPrevistas).toBe(0);
    expect(resultado.frequenciaPercentual).toBe(100);
    expect(alertaService.checarEGerarAlerta).not.toHaveBeenCalled();
  });

  test('calcula frequência por disciplina e resolve o nome da disciplina', async () => {
    presencaRepository.countAgrupadoPorDisciplina.mockResolvedValue([
      { disciplinaId: 'disc-1', status: 'PRESENTE', _count: { _all: 3 } },
      { disciplinaId: 'disc-1', status: 'AUSENTE', _count: { _all: 1 } },
    ]);
    prisma.disciplina.findUnique.mockResolvedValue({ id: 'disc-1', nome: 'Matemática' });

    const resultado = await alunoService.calcularFrequenciaPorDisciplina('aluno-1');

    expect(resultado).toEqual([
      expect.objectContaining({
        disciplinaId: 'disc-1',
        nomeDisciplina: 'Matemática',
        totalAulasPrevistas: 4,
        frequenciaPercentual: 75,
        statusRisco: 'REGULAR',
      }),
    ]);
  });
});
