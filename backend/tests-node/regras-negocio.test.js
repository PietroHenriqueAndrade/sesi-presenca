const test = require('node:test');
const assert = require('node:assert/strict');
const { consolidarGrupos, calcularFrequencia } = require('../src/domain/frequencia.rules');
const { minutos, classificarEntrada, classificarSaidaDia } = require('../src/domain/horario.rules');

test('frequência: justificado continua ausência e atraso conta como comparecimento', () => {
  const contagens = consolidarGrupos([
    { status: 'PRESENTE', _count: { _all: 3 } },
    { status: 'ATRASO', _count: { _all: 1 } },
    { status: 'SAIDA_ANTECIPADA', _count: { _all: 1 } },
    { status: 'AUSENTE', _count: { _all: 1 } },
    { status: 'JUSTIFICADO', _count: { _all: 2 } },
  ]);
  const r = calcularFrequencia(contagens);
  assert.equal(r.total, 8);
  assert.equal(r.comparecimentos, 5);
  assert.equal(r.percentual, 62.5);
  assert.equal(r.statusRisco, 'EM_RISCO');
});

test('frequência sem registros é 100%', () => {
  assert.equal(calcularFrequencia({}).percentual, 100);
});

test('75% exatos permanecem regulares', () => {
  const r = calcularFrequencia({ PRESENTE: 3, AUSENTE: 1 });
  assert.equal(r.percentual, 75);
  assert.equal(r.statusRisco, 'REGULAR');
});

test('entrada até 15 minutos após início é PRESENTE', () => {
  assert.equal(classificarEntrada('07:15', '07:00', '08:00'), 'PRESENTE');
});

test('entrada depois da tolerância é ATRASO', () => {
  assert.equal(classificarEntrada('07:16', '07:00', '08:00'), 'ATRASO');
});

test('entrada fora da janela é rejeitada', () => {
  assert.equal(classificarEntrada('06:44', '07:00', '08:00'), null);
  assert.equal(classificarEntrada('08:01', '07:00', '08:00'), null);
});

test('saída antes dos 10 minutos finais é antecipada', () => {
  assert.equal(classificarSaidaDia('11:49', '12:00'), 'SAIDA_ANTECIPADA');
  assert.equal(classificarSaidaDia('11:50', '12:00'), null);
});

test('parser de horário rejeita valores inválidos', () => {
  assert.throws(() => minutos('25:99'), TypeError);
});

const { selecionarFaltasAutomaticas } = require('../src/domain/faltas.rules');
const {
  validarSolicitacaoJustificativa,
  validarDecisaoJustificativa,
  statusPresencaAposDecisao,
} = require('../src/domain/justificativa.rules');

test('faltas automáticas: não duplica turma com várias disciplinas e ignora quem já registrou presença', () => {
  const turma = {
    alunos: [
      { alunoId: 'a1', aluno: { ativo: true } },
      { alunoId: 'a2', aluno: { ativo: true } },
      { alunoId: 'a3', aluno: { ativo: false } },
    ],
  };
  const data = new Date('2026-08-24T03:00:00.000Z');
  const agora = new Date('2026-08-24T18:00:00.000Z');
  const faltas = selecionarFaltasAutomaticas({
    aulas: [{ turmaId: 't1', turma }, { turmaId: 't1', turma }],
    existentes: [{ alunoId: 'a1', turmaId: 't1' }],
    data,
    agora,
  });
  assert.equal(faltas.length, 1);
  assert.equal(faltas[0].alunoId, 'a2');
  assert.equal(faltas[0].status, 'AUSENTE');
});

test('justificativa: só ausência sem justificativa pode abrir solicitação', () => {
  assert.equal(validarSolicitacaoJustificativa({ status: 'AUSENTE', justificativa: null }), null);
  assert.equal(validarSolicitacaoJustificativa({ status: 'PRESENTE', justificativa: null }).statusCode, 400);
  assert.equal(validarSolicitacaoJustificativa({ status: 'AUSENTE', justificativa: { id: 'j1' } }).statusCode, 409);
});

test('justificativa: apenas pendente pode ser decidida e aprovação muda a falta para JUSTIFICADO', () => {
  assert.equal(validarDecisaoJustificativa({ status: 'PENDENTE' }, 'APROVADO'), null);
  assert.equal(validarDecisaoJustificativa({ status: 'APROVADO' }, 'REJEITADO').statusCode, 409);
  assert.equal(validarDecisaoJustificativa({ status: 'PENDENTE' }, 'QUALQUER').statusCode, 400);
  assert.equal(statusPresencaAposDecisao('AUSENTE', 'APROVADO'), 'JUSTIFICADO');
  assert.equal(statusPresencaAposDecisao('AUSENTE', 'REJEITADO'), 'AUSENTE');
});
