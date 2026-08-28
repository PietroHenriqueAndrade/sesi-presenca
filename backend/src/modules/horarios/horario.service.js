const horarioRepository = require('./horario.repository');
const auditService = require('../auditoria/audit.service');
const AppError = require('../../utils/AppError');
const prisma = require('../../database/client');
const DateHelpers = require('../../utils/dateHelpers');
const { classificarEntrada, classificarSaidaDia } = require('../../domain/horario.rules');

const DIAS = ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'];

class HorarioService {
  async _validarReferencias(turmaId, disciplinaId) {
    const [turma, disciplina] = await Promise.all([
      prisma.turma.findFirst({ where: { id: turmaId, ativo: true } }),
      prisma.disciplina.findFirst({ where: { id: disciplinaId, ativo: true } }),
    ]);
    if (!turma) throw new AppError('Turma não encontrada ou inativa.', 400);
    if (!disciplina) throw new AppError('Disciplina não encontrada ou inativa.', 400);
  }

  async _validarConflito(dados, ignorarId = null) {
    const conflito = await horarioRepository.findConflito({ ...dados, ignorarId });
    if (conflito) throw new AppError('Existe outro horário da turma que se sobrepõe a este intervalo.', 409);
  }

  async cadastrarHorario(data, usuarioLogadoId) {
    await this._validarReferencias(data.turmaId, data.disciplinaId);
    await this._validarConflito(data);
    const horario = await horarioRepository.create(data);
    await auditService.registrarLog({ usuarioId: usuarioLogadoId, acao: 'CREATE', entidade: 'Horario', entidadeId: horario.id, dadosNovos: horario });
    return horario;
  }

  async listarTodos() {
    return horarioRepository.findAll();
  }

  _contextoAgora() {
    const agora = DateHelpers.agoraDayjs();
    return { agora, diaHoje: DIAS[agora.day()], horaAtual: agora.format('HH:mm') };
  }

  async buscarAulaAtual(turmaId) {
    const { diaHoje, horaAtual } = this._contextoAgora();
    if (diaHoje === 'DOMINGO') throw new AppError('Não há aulas agendadas para domingo.', 404);

    const grade = await horarioRepository.findByTurmaEDia(turmaId, diaHoje);
    const aula = grade.find((item) => item.horaInicio <= horaAtual && item.horaFim >= horaAtual);
    if (!aula) throw new AppError('Nenhuma aula acontecendo neste momento para esta turma.', 404);
    return aula;
  }

  async atualizarHorario(id, data, usuarioLogadoId) {
    const antigo = await horarioRepository.findById(id);
    if (!antigo) throw new AppError('Horário não encontrado.', 404);

    const combinado = {
      turmaId: data.turmaId ?? antigo.turmaId,
      disciplinaId: data.disciplinaId ?? antigo.disciplinaId,
      diaSemana: data.diaSemana ?? antigo.diaSemana,
      horaInicio: data.horaInicio ?? antigo.horaInicio,
      horaFim: data.horaFim ?? antigo.horaFim,
    };
    if (combinado.horaInicio >= combinado.horaFim) throw new AppError('horaFim deve ser posterior a horaInicio.', 400);
    await this._validarReferencias(combinado.turmaId, combinado.disciplinaId);
    if (data.ativo !== false) await this._validarConflito(combinado, id);

    const atualizado = await horarioRepository.update(id, data);
    await auditService.registrarLog({ usuarioId: usuarioLogadoId, acao: 'UPDATE', entidade: 'Horario', entidadeId: id, dadosAntigos: antigo, dadosNovos: atualizado });
    return atualizado;
  }

  async deletarHorario(id, usuarioLogadoId) {
    const antigo = await horarioRepository.findById(id);
    if (!antigo) throw new AppError('Horário não encontrado.', 404);
    if (!antigo.ativo) return antigo;
    const removido = await horarioRepository.softDelete(id);
    await auditService.registrarLog({ usuarioId: usuarioLogadoId, acao: 'DELETE', entidade: 'Horario', entidadeId: id, dadosAntigos: antigo });
    return removido;
  }

  async validarEObterDisciplinaAtual(turmaId) {
    const { diaHoje, horaAtual } = this._contextoAgora();
    if (diaHoje === 'DOMINGO') throw new AppError('Não há aulas agendadas para domingo.', 400);
    const grade = await horarioRepository.findByTurmaEDia(turmaId, diaHoje);

    for (const horario of grade) {
      const statusCalculado = classificarEntrada(horaAtual, horario.horaInicio, horario.horaFim);
      if (statusCalculado) return { disciplinaId: horario.disciplinaId, statusCalculado };
    }
    throw new AppError('Fora da janela de horário permitido para as aulas desta turma.', 400);
  }

  async validarStatusSaida(turmaId, disciplinaId) {
    const { diaHoje, horaAtual } = this._contextoAgora();
    if (diaHoje === 'DOMINGO') return null;
    const grade = await horarioRepository.findByTurmaEDia(turmaId, diaHoje);
    const horario = grade.find((item) => item.disciplinaId === disciplinaId);
    if (!horario) return null;
    return classificarSaidaDia(horaAtual, horario.horaFim);
  }

  async validarStatusSaidaDia(turmaId) {
    const { diaHoje, horaAtual } = this._contextoAgora();
    if (diaHoje === 'DOMINGO') return null;
    const grade = await horarioRepository.findByTurmaEDia(turmaId, diaHoje);
    if (!grade.length) return null;
    const fim = grade.reduce((max, item) => item.horaFim > max ? item.horaFim : max, '00:00');
    return classificarSaidaDia(horaAtual, fim);
  }
}

module.exports = new HorarioService();
