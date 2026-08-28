const auditService = require('./audit.service');

class AuditoriaController {
  async listar(req, res, next) {
    try {
      const { entidade, usuarioId } = req.query;
      
      const filtros = {};
      if (entidade) filtros.entidade = entidade;
      if (usuarioId) filtros.usuarioId = usuarioId;

      const logs = await auditService.listarLogs(filtros);
      return res.status(200).json({ status: 'success', data: logs });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuditoriaController();