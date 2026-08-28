function minutos(hhmm) {
  if (!/^\d{2}:\d{2}$/.test(String(hhmm || ''))) throw new TypeError('Horário inválido. Use HH:mm.');
  const [h, m] = String(hhmm).split(':').map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) throw new TypeError('Horário inválido.');
  return h * 60 + m;
}

function classificarEntrada(horaAtual, horaInicio, horaFim, toleranciaAntes = 15, toleranciaAtraso = 15) {
  const atual = minutos(horaAtual);
  const inicio = minutos(horaInicio);
  const fim = minutos(horaFim);
  if (atual < inicio - toleranciaAntes || atual > fim) return null;
  return atual <= inicio + toleranciaAtraso ? 'PRESENTE' : 'ATRASO';
}

function classificarSaidaDia(horaAtual, horaFimDia, toleranciaFim = 10) {
  return minutos(horaAtual) < minutos(horaFimDia) - toleranciaFim ? 'SAIDA_ANTECIPADA' : null;
}

module.exports = { minutos, classificarEntrada, classificarSaidaDia };
