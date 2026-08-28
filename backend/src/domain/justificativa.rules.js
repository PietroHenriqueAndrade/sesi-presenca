function validarSolicitacaoJustificativa(presenca) {
  if (!presenca) return { statusCode: 404, message: 'Registro de presença/falta não encontrado.' };
  if (presenca.status !== 'AUSENTE') return { statusCode: 400, message: 'Só é possível solicitar justificativa para uma ausência.' };
  if (presenca.justificativa) return { statusCode: 409, message: 'Esta ausência já possui uma justificativa cadastrada.' };
  return null;
}

function validarDecisaoJustificativa(atual, novoStatus) {
  if (!['APROVADO', 'REJEITADO'].includes(novoStatus)) {
    return { statusCode: 400, message: 'Decisão de justificativa inválida.' };
  }
  if (!atual) return { statusCode: 404, message: 'Justificativa não encontrada.' };
  if (atual.status !== 'PENDENTE') return { statusCode: 409, message: 'Esta justificativa já foi analisada.' };
  return null;
}

function statusPresencaAposDecisao(statusAtual, novoStatus) {
  return novoStatus === 'APROVADO' ? 'JUSTIFICADO' : statusAtual;
}

module.exports = {
  validarSolicitacaoJustificativa,
  validarDecisaoJustificativa,
  statusPresencaAposDecisao,
};
