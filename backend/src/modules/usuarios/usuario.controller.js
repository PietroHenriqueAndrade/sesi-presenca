const usuarioService = require('./usuario.service');

class UsuarioController {
  async create(req, res, next) {
    try {
      const novoUsuario = await usuarioService.criarUsuario(req.body, req.usuario.id);
      return res.status(201).json({ status: 'success', data: novoUsuario });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const usuarios = await usuarioService.listarUsuarios();
      return res.status(200).json({ status: 'success', data: usuarios });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const usuario = await usuarioService.buscarUsuarioPorId(req.usuario.id);
      return res.status(200).json({ status: 'success', data: usuario });
    } catch (error) {
      next(error);
    }
  }

  async updateMe(req, res, next) {
    try {
      // Self-service não permite alterar role, ativo ou senha por esta rota.
      const dadosPermitidos = {
        ...(req.body.nome !== undefined ? { nome: req.body.nome } : {}),
        ...(req.body.email !== undefined ? { email: req.body.email } : {})
      };
      const usuario = await usuarioService.atualizarUsuario(
        req.usuario.id,
        dadosPermitidos,
        req.usuario.id
      );
      return res.status(200).json({ status: 'success', data: usuario });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const usuarioAtualizado = await usuarioService.atualizarUsuario(
        req.params.id,
        req.body,
        req.usuario.id
      );
      return res.status(200).json({ status: 'success', data: usuarioAtualizado });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await usuarioService.deletarUsuario(req.params.id, req.usuario.id);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UsuarioController();
