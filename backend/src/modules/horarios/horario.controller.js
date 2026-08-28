const horarioService = require('./horario.service');

class HorarioController {
  async create(req, res, next) {
    try {
      const novoHorario = await horarioService.cadastrarHorario(req.body, req.usuario.id);
      return res.status(201).json({ status: 'success', data: novoHorario });
    } catch (error) { next(error); }
  }
  async update(req, res, next) {
    try {
      const horario = await horarioService.atualizarHorario(req.params.id, req.body, req.usuario.id);
      return res.status(200).json({ status: 'success', data: horario });
    } catch (error) { next(error); }
  }
  async delete(req, res, next) {
    try {
      await horarioService.deletarHorario(req.params.id, req.usuario.id);
      return res.status(204).send();
    } catch (error) { next(error); }
  }
  async getAll(req, res, next) {
    try { return res.status(200).json({ status: 'success', data: await horarioService.listarTodos() }); }
    catch (error) { next(error); }
  }
  async buscarAulaAtual(req, res, next) {
    try { return res.status(200).json({ status: 'success', data: await horarioService.buscarAulaAtual(req.params.id) }); }
    catch (error) { next(error); }
  }
}
module.exports = new HorarioController();
