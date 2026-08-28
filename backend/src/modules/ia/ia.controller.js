const axios = require('axios');
const iaService = require('./ia.service');
const { getPythonBaseUrl } = require('../../config/serviceUrls');

class IaController {
  async checkPythonStatus(req, res) {
    try {
      const response = await axios.get(`${getPythonBaseUrl()}/health`, { timeout: 3000 });
      return res.status(200).json({ status: 'success', message: 'Conexão com a IA estabelecida.', python_data: response.data });
    } catch (_) {
      return res.status(503).json({ status: 'error', message: 'Serviço de reconhecimento facial offline ou inacessível.' });
    }
  }

  async criarSessaoCadastro(req, res, next) {
    try {
      const data = await iaService.criarSessaoCadastro({
        usuarioId: req.usuario.id,
        role: req.usuario.role,
        alunoId: req.body.alunoId,
        senha: req.body.senha,
      });
      return res.status(201).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  async validarSessaoCadastro(req, res, next) {
    try {
      const data = await iaService.validarSessaoCadastro(req.body.token);
      return res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  async cadastroConcluido(req, res, next) {
    try {
      const data = await iaService.marcarCadastroConcluido(req.body.token);
      return res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  async resolverAmbiguidade(req, res, next) {
    try {
      const data = await iaService.resolverAmbiguidade(req.body);
      return res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  async processarReconhecimento(req, res, next) {
    try {
      const resultado = await iaService.processarReconhecimento(req.body);
      return res.status(200).json({ status: 'success', data: resultado });
    } catch (error) { next(error); }
  }
}

module.exports = new IaController();
