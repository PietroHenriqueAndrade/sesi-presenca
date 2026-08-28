jest.mock('../src/modules/auditoria/audit.service', () => ({ registrarLog: jest.fn().mockResolvedValue(null) }));
jest.mock('../src/database/client', () => ({
  presenca: { findUnique: jest.fn() },
  justificativa: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
  $transaction: jest.fn(),
}));

const prisma = require('../src/database/client');
const auditService = require('../src/modules/auditoria/audit.service');
const service = require('../src/modules/justificativas/justificativa.service');

describe('JustificativaService', () => {
  beforeEach(() => jest.clearAllMocks());

  test('só permite justificar uma ausência', async () => {
    prisma.presenca.findUnique.mockResolvedValue({ id: 'p1', status: 'PRESENTE', justificativa: null });
    await expect(service.registrarJustificativa({ presencaId: 'p1', motivo: 'Atestado médico' }, 'u1'))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  test('impede segunda justificativa para a mesma ausência', async () => {
    prisma.presenca.findUnique.mockResolvedValue({ id: 'p1', status: 'AUSENTE', justificativa: { id: 'j1' } });
    await expect(service.registrarJustificativa({ presencaId: 'p1', motivo: 'Atestado médico' }, 'u1'))
      .rejects.toMatchObject({ statusCode: 409 });
  });

  test('aprovação muda a presença de AUSENTE para JUSTIFICADO em transação', async () => {
    prisma.justificativa.findUnique.mockResolvedValue({
      id: 'j1', status: 'PENDENTE', presencaId: 'p1', presenca: { id: 'p1', status: 'AUSENTE' },
    });
    const tx = {
      justificativa: { update: jest.fn().mockResolvedValue({ id: 'j1', status: 'APROVADO' }) },
      presenca: { update: jest.fn().mockResolvedValue({ id: 'p1', status: 'JUSTIFICADO' }) },
    };
    prisma.$transaction.mockImplementation(async (callback) => callback(tx));

    const resultado = await service.decidir('j1', 'APROVADO', 'admin-1', 'Documento conferido');

    expect(tx.presenca.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { status: 'JUSTIFICADO' } });
    expect(resultado.presenca.status).toBe('JUSTIFICADO');
    expect(auditService.registrarLog).toHaveBeenCalled();
  });

  test('rejeição mantém a ausência original', async () => {
    const presenca = { id: 'p1', status: 'AUSENTE' };
    prisma.justificativa.findUnique.mockResolvedValue({ id: 'j1', status: 'PENDENTE', presencaId: 'p1', presenca });
    const tx = {
      justificativa: { update: jest.fn().mockResolvedValue({ id: 'j1', status: 'REJEITADO' }) },
      presenca: { update: jest.fn() },
    };
    prisma.$transaction.mockImplementation(async (callback) => callback(tx));

    const resultado = await service.decidir('j1', 'REJEITADO', 'admin-1');

    expect(tx.presenca.update).not.toHaveBeenCalled();
    expect(resultado.presenca).toBe(presenca);
  });

  test('não permite decidir a mesma justificativa duas vezes', async () => {
    prisma.justificativa.findUnique.mockResolvedValue({ id: 'j1', status: 'APROVADO', presencaId: 'p1', presenca: {} });
    await expect(service.decidir('j1', 'REJEITADO', 'admin-1')).rejects.toMatchObject({ statusCode: 409 });
  });
});
