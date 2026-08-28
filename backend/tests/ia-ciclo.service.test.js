jest.mock('../src/modules/alunos/aluno.service', () => ({ buscarAlunoPorId: jest.fn() }));
jest.mock('../src/modules/horarios/horario.service', () => ({ validarStatusSaidaDia: jest.fn(), validarEObterDisciplinaAtual: jest.fn() }));
jest.mock('../src/modules/presencas/presenca.repository', () => ({ buscarPresencaCompletaDeHoje: jest.fn() }));
jest.mock('../src/utils/dateHelpers', () => ({
  agora: jest.fn(() => new Date('2026-08-24T10:00:00.000Z')),
  dataHojeDb: jest.fn(() => new Date('2026-08-24T00:00:00.000Z')),
}));
jest.mock('../src/database/client', () => ({
  turmaAluno: { findUnique: jest.fn() },
  biometricSecondFactor: { findUnique: jest.fn() },
  presenca: { create: jest.fn(), update: jest.fn() },
  iaLog: { create: jest.fn() },
  $transaction: jest.fn(),
}));

const alunoService = require('../src/modules/alunos/aluno.service');
const horarioService = require('../src/modules/horarios/horario.service');
const presencaRepository = require('../src/modules/presencas/presenca.repository');
const prisma = require('../src/database/client');
const service = require('../src/modules/ia/ia.service');

describe('IaService - ciclo de entrada e saída', () => {
  const aluno = { id: 'aluno-1', nome: 'Neil' };
  beforeEach(() => {
    jest.clearAllMocks();
    alunoService.buscarAlunoPorId.mockResolvedValue(aluno);
    prisma.turmaAluno.findUnique.mockResolvedValue({ ativo: true, turma: { ativo: true } });
    prisma.biometricSecondFactor.findUnique.mockResolvedValue(null);
    horarioService.validarEObterDisciplinaAtual.mockResolvedValue({ disciplinaId: 'disc-1', statusCalculado: 'PRESENTE' });
    prisma.iaLog.create.mockResolvedValue({ id: 'log-1' });
    prisma.$transaction.mockImplementation(async (operacoes) => Promise.all(operacoes));
  });

  test('rejeita score abaixo do limiar e registra log de rejeição', async () => {
    await expect(service.processarReconhecimento({
      alunoId: 'aluno-1', turmaId: 'turma-1', faceScore: 0.5,
    })).rejects.toMatchObject({ statusCode: 422 });

    expect(prisma.iaLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ resultado: 'REJEITADO' }),
    }));
    expect(prisma.presenca.create).not.toHaveBeenCalled();
  });

  test('registra entrada quando ainda não existe presença no dia', async () => {
    presencaRepository.buscarPresencaCompletaDeHoje.mockResolvedValue(null);
    prisma.presenca.create.mockResolvedValue({ id: 'presenca-1', status: 'PRESENTE' });

    const resultado = await service.processarReconhecimento({
      alunoId: 'aluno-1', turmaId: 'turma-1', faceScore: 0.96,
    });

    expect(resultado.status).toBe('ENTRADA_REGISTRADA');
    expect(prisma.presenca.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ origem: 'FACIAL', status: 'PRESENTE', disciplinaId: 'disc-1' }),
    }));
  });

  test('segundo reconhecimento registra saída e marca saída antecipada quando aplicável', async () => {
    presencaRepository.buscarPresencaCompletaDeHoje.mockResolvedValue({
      id: 'presenca-1', status: 'PRESENTE', dataHoraSaida: null,
    });
    horarioService.validarStatusSaidaDia.mockResolvedValue('SAIDA_ANTECIPADA');
    prisma.presenca.update.mockResolvedValue({ id: 'presenca-1', status: 'SAIDA_ANTECIPADA' });

    const resultado = await service.processarReconhecimento({
      alunoId: 'aluno-1', turmaId: 'turma-1', faceScore: 0.97,
    });

    expect(resultado.status).toBe('SAIDA_ANTECIPADA_REGISTRADA');
    expect(prisma.presenca.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'SAIDA_ANTECIPADA' }),
    }));
  });

  test('terceiro reconhecimento do mesmo dia é ignorado', async () => {
    presencaRepository.buscarPresencaCompletaDeHoje.mockResolvedValue({
      id: 'presenca-1', status: 'PRESENTE', dataHoraSaida: new Date(),
    });

    const resultado = await service.processarReconhecimento({
      alunoId: 'aluno-1', turmaId: 'turma-1', faceScore: 0.97,
    });

    expect(resultado.status).toBe('IGNORADO');
    expect(prisma.presenca.update).not.toHaveBeenCalled();
  });

  test('registra atraso quando o horário classifica a entrada como ATRASO', async () => {
    presencaRepository.buscarPresencaCompletaDeHoje.mockResolvedValue(null);
    horarioService.validarEObterDisciplinaAtual.mockResolvedValue({ disciplinaId: 'disc-1', statusCalculado: 'ATRASO' });
    prisma.presenca.create.mockResolvedValue({ id: 'presenca-1', status: 'ATRASO' });

    const resultado = await service.processarReconhecimento({
      alunoId: 'aluno-1', turmaId: 'turma-1', faceScore: 0.96,
    });

    expect(resultado.status).toBe('ENTRADA_REGISTRADA');
    expect(prisma.presenca.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'ATRASO' }),
    }));
  });

  test('rejeita reconhecimento facial fora da janela de entrada', async () => {
    presencaRepository.buscarPresencaCompletaDeHoje.mockResolvedValue(null);
    const erro = Object.assign(new Error('Fora da janela de horário permitido.'), { statusCode: 400 });
    horarioService.validarEObterDisciplinaAtual.mockRejectedValue(erro);

    await expect(service.processarReconhecimento({
      alunoId: 'aluno-1', turmaId: 'turma-1', faceScore: 0.97,
    })).rejects.toMatchObject({ statusCode: 400 });

    expect(prisma.presenca.create).not.toHaveBeenCalled();
    expect(prisma.iaLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ resultado: 'REJEITADO' }),
    }));
  });


  test('aluno marcado como caso especial exige segundo fator antes da presença', async () => {
    prisma.biometricSecondFactor.findUnique.mockResolvedValue({ ativo: true });

    await expect(service.processarReconhecimento({
      alunoId: 'aluno-1', turmaId: 'turma-1', faceScore: 0.98,
    })).rejects.toMatchObject({ statusCode: 428 });

    expect(prisma.presenca.create).not.toHaveBeenCalled();
  });

  test('segundo fator validado permite continuar o fluxo do caso especial', async () => {
    prisma.biometricSecondFactor.findUnique.mockResolvedValue({ ativo: true });
    presencaRepository.buscarPresencaCompletaDeHoje.mockResolvedValue(null);
    prisma.presenca.create.mockResolvedValue({ id: 'presenca-1', status: 'PRESENTE' });

    const resultado = await service.processarReconhecimento(
      { alunoId: 'aluno-1', turmaId: 'turma-1', faceScore: 0.98 },
      { segundoFatorValidado: true },
    );

    expect(resultado.status).toBe('ENTRADA_REGISTRADA');
  });

  test('rejeita aluno sem matrícula ativa na turma', async () => {
    prisma.turmaAluno.findUnique.mockResolvedValue(null);

    await expect(service.processarReconhecimento({
      alunoId: 'aluno-1', turmaId: 'turma-1', faceScore: 0.99,
    })).rejects.toMatchObject({ statusCode: 403 });
  });
});
