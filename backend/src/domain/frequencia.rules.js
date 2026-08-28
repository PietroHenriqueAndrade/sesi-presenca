const STATUS = ['PRESENTE', 'AUSENTE', 'JUSTIFICADO', 'ATRASO', 'SAIDA_ANTECIPADA'];
const COMPARECIMENTO = new Set(['PRESENTE', 'ATRASO', 'SAIDA_ANTECIPADA']);

function criarContagens() {
  return Object.fromEntries(STATUS.map((status) => [status, 0]));
}

function consolidarGrupos(grupos = []) {
  const contagens = criarContagens();
  for (const item of grupos) {
    if (Object.hasOwn(contagens, item?.status)) {
      contagens[item.status] = Number(item?._count?._all) || 0;
    }
  }
  return contagens;
}

function calcularFrequencia(contagens = {}) {
  const normalizadas = criarContagens();
  for (const status of STATUS) normalizadas[status] = Number(contagens[status]) || 0;
  const total = STATUS.reduce((acc, status) => acc + normalizadas[status], 0);
  const comparecimentos = STATUS
    .filter((status) => COMPARECIMENTO.has(status))
    .reduce((acc, status) => acc + normalizadas[status], 0);
  const percentual = total > 0 ? (comparecimentos / total) * 100 : 100;
  return {
    contagens: normalizadas,
    total,
    comparecimentos,
    percentual: Number(percentual.toFixed(2)),
    statusRisco: percentual < 75 ? 'EM_RISCO' : 'REGULAR',
  };
}

module.exports = { STATUS, COMPARECIMENTO, criarContagens, consolidarGrupos, calcularFrequencia };
