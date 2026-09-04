let agora = { dia: 1, hora: '07:05' };

function mockFakeDayjs() {
  return {
    day: () => agora.dia,
    format: () => agora.hora,
    hour(h) {
      return {
        minute(m) {
          return {
            second() {
              const total = h * 60 + m;
              return {
                subtract(qtd, unidade) {
                  const minutos = unidade === 'minute' ? total - qtd : total;
                  const hh = String(Math.floor(minutos / 60)).padStart(2, '0');
                  const mm = String((minutos % 60 + 60) % 60).padStart(2, '0');
                  return { format: () => `${hh}:${mm}` };
                },
                add(qtd, unidade) {
                  const minutos = unidade === 'minute' ? total + qtd : total;
                  const hh = String(Math.floor(minutos / 60)).padStart(2, '0');
                  const mm = String(minutos % 60).padStart(2, '0');
                  return { format: () => `${hh}:${mm}` };
                },
              };
            },
          };
        },
      };
    },
  };
}

jest.mock('../src/utils/dateHelpers', () => ({ agoraDayjs: jest.fn(() => mockFakeDayjs()) }));
jest.mock('../src/modules/horarios/horario.repository', () => ({
  findByTurmaEDia: jest.fn(),
  findConflito: jest.fn(),
}));
jest.mock('../src/modules/auditoria/audit.service', () => ({ registrarLog: jest.fn() }));
jest.mock('../src/database/client', () => ({ turma: { findFirst: jest.fn() }, disciplina: { findFirst: jest.fn() } }));

const repo = require('../src/modules/horarios/horario.repository');
const service = require('../src/modules/horarios/horario.service');

describe('HorarioService - regras de entrada e saída', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    agora = { dia: 1, hora: '07:05' };
  });

  test('entrada até 15 minutos após início é PRESENTE', async () => {
    repo.findByTurmaEDia.mockResolvedValue([{ disciplinaId: 'd1', horaInicio: '07:00', horaFim: '08:00' }]);
    const resultado = await service.validarEObterDisciplinaAtual('t1');
    expect(resultado).toEqual({ disciplinaId: 'd1', statusCalculado: 'PRESENTE' });
  });

  test('entrada depois da tolerância é ATRASO', async () => {
    agora.hora = '07:30';
    repo.findByTurmaEDia.mockResolvedValue([{ disciplinaId: 'd1', horaInicio: '07:00', horaFim: '08:00' }]);
    const resultado = await service.validarEObterDisciplinaAtual('t1');
    expect(resultado.statusCalculado).toBe('ATRASO');
  });

  test('entrada fora da janela da aula é rejeitada', async () => {
    agora.hora = '09:00';
    repo.findByTurmaEDia.mockResolvedValue([{ disciplinaId: 'd1', horaInicio: '07:00', horaFim: '08:00' }]);
    await expect(service.validarEObterDisciplinaAtual('t1')).rejects.toMatchObject({ statusCode: 400 });
  });

  test('saída antes de 10 minutos do fim do dia é marcada antecipada', async () => {
    agora.hora = '11:30';
    repo.findByTurmaEDia.mockResolvedValue([
      { disciplinaId: 'd1', horaInicio: '10:00', horaFim: '11:00' },
      { disciplinaId: 'd2', horaInicio: '11:00', horaFim: '12:00' },
    ]);
    expect(await service.validarStatusSaidaDia('t1')).toBe('SAIDA_ANTECIPADA');
  });

  test('saída nos 10 minutos finais do dia não é antecipada', async () => {
    agora.hora = '11:55';
    repo.findByTurmaEDia.mockResolvedValue([{ disciplinaId: 'd2', horaInicio: '11:00', horaFim: '12:00' }]);
    expect(await service.validarStatusSaidaDia('t1')).toBeNull();
  });
});
