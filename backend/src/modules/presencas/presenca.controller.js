const presencaService = require('./presenca.service');
class PresencaController {
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 10, ...filtros } = req.query;
      return res.status(200).json({ status: 'success', data: await presencaService.listarTodas(page, limit, filtros) });
    } catch (error) { next(error); }
  }
  async getByAluno(req, res, next) { try { return res.status(200).json({ status: 'success', data: await presencaService.listarPorAluno(req.params.id) }); } catch (e) { next(e); } }
  async getByTurma(req, res, next) { try { return res.status(200).json({ status: 'success', data: await presencaService.listarPorTurma(req.params.id) }); } catch (e) { next(e); } }
  async getHoje(req, res, next) { try { return res.status(200).json({ status: 'success', data: await presencaService.listarPresencasHoje() }); } catch (e) { next(e); } }
  async registrarPresencaManual(req, res, next) {
    try { return res.status(201).json({ status: 'success', message: 'Presença manual registrada com sucesso.', data: await presencaService.registrarPresencaManual(req.body) }); }
    catch (e) { next(e); }
  }
  async sincronizarBatch(req, res, next) {
    try { return res.status(200).json({ status: 'success', message: 'Sincronização offline processada.', resumo: await presencaService.sincronizarBatch(req.body.lote) }); }
    catch (e) { next(e); }
  }
  async registrarSaida(req, res, next) {
    try { return res.status(200).json({ status: 'success', message: 'Saída registrada com sucesso.', data: await presencaService.registrarSaida(req.params.id, req.body.status) }); }
    catch (e) { next(e); }
  }
}
module.exports = new PresencaController();
