const justificativaService = require('./justificativa.service');

class JustificativaController {
  async create(req, res, next) {
    try {
      const resultado = await justificativaService.registrarJustificativa(
        { presencaId: req.params.presencaId, ...req.body },
        req.usuario.id
      );
      return res.status(201).json({ status: 'success', data: resultado });
    } catch (error) {
      next(error);
    }
  }

  async listar(req, res, next) {
    try {
      const itens = await justificativaService.listar(req.query.status || 'PENDENTE');
      return res.status(200).json({ status: 'success', data: itens });
    } catch (error) {
      next(error);
    }
  }

  async aprovar(req, res, next) {
    try {
      const resultado = await justificativaService.decidir(req.params.id, 'APROVADO', req.usuario.id, req.body.observacao);
      return res.status(200).json({ status: 'success', data: resultado });
    } catch (error) {
      next(error);
    }
  }

  async rejeitar(req, res, next) {
    try {
      const resultado = await justificativaService.decidir(req.params.id, 'REJEITADO', req.usuario.id, req.body.observacao);
      return res.status(200).json({ status: 'success', data: resultado });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new JustificativaController();
