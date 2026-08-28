jest.mock('../src/modules/alunos/aluno.service', () => ({ buscarAlunoPorId: jest.fn() }));
jest.mock('../src/modules/turmas/turma.service', () => ({ buscarTurmaPorId: jest.fn() }));
jest.mock('../src/modules/presencas/presenca.repository', () => ({ sincronizarBatchOffline: jest.fn() }));
jest.mock('../src/utils/dateHelpers', () => ({
  agoraDayjs: jest.fn(() => ({ day: () => 1 })), dataHojeDb: jest.fn(), agora: jest.fn(),
}));
jest.mock('../src/utils/logger', () => ({ info: jest.fn() }));
jest.mock('../src/database/client', () => ({
  turmaAluno: { findUnique: jest.fn() },
}));

const prisma = require('../src/database/client');
const repository = require('../src/modules/presencas/presenca.repository');
const service = require('../src/modules/presencas/presenca.service');

describe('Sincronização offline de presenças', () => {
  beforeEach(() => jest.clearAllMocks());

  test('envia apenas alunos/turmas com vínculo ativo e contabiliza inválidos como falha', async () => {
    prisma.turmaAluno.findUnique
      .mockResolvedValueOnce({ ativo: true, aluno: { ativo: true }, turma: { ativo: true } })
      .mockResolvedValueOnce(null);
    repository.sincronizarBatchOffline.mockResolvedValue({ sucesso: 1, falha: 0, total: 1 });

    const lote = [
      { alunoId: 'a1', turmaId: 't1', dataHora: '2026-08-24T10:00:00.000Z', status: 'PRESENTE' },
      { alunoId: 'a2', turmaId: 't2', dataHora: '2026-08-24T10:00:00.000Z', status: 'PRESENTE' },
    ];

    const resultado = await service.sincronizarBatch(lote);

    expect(repository.sincronizarBatchOffline).toHaveBeenCalledWith([lote[0]]);
    expect(resultado).toEqual({ sucesso: 1, falha: 1, total: 2 });
  });

  test('não chama repository quando nenhum vínculo é válido', async () => {
    prisma.turmaAluno.findUnique.mockResolvedValue(null);
    const lote = [{ alunoId: 'a1', turmaId: 't1', dataHora: '2026-08-24T10:00:00.000Z' }];

    const resultado = await service.sincronizarBatch(lote);

    expect(repository.sincronizarBatchOffline).not.toHaveBeenCalled();
    expect(resultado).toEqual({ sucesso: 0, falha: 1, total: 1 });
  });
});
