const alertaService = require('./alerta.service');

class AlertaController {
  async listar(req, res, next) {
    try {
      // O service já tem esse método pronto!
      const alertas = await alertaService.listarAlertasAtivos();
      return res.status(200).json({ status: 'success', data: alertas });
    } catch (error) {
      next(error);
    }
  }

  async resolver(req, res, next) {
    try {
      // Passa o ID do alerta e quem está resolvendo (Auditoria)
      const alerta = await alertaService.resolverAlerta(req.params.id, req.usuario.id);
      return res.status(200).json({ status: 'success', data: alerta });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AlertaController();