const authService = require('./auth.service');

class AuthController {
  async login(req, res, next) {
    try {
      const result = await authService.login(req.body.email, req.body.senha, req.ip);
      return res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const tokens = await authService.renovarToken(req.body.refreshToken);
      return res.status(200).json({ status: 'success', data: tokens });
    } catch (error) {
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      const usuario = await authService.obterPerfil(req.usuario.id);
      return res.status(200).json({ status: 'success', data: usuario });
    } catch (error) {
      next(error);
    }
  }

  async recuperarSenha(req, res, next) {
    try {
      await authService.recuperarSenha(req.body.email);
      return res.status(200).json({
        status: 'success',
        message: 'Se o e-mail existir, um código de recuperação será enviado.',
      });
    } catch (error) {
      next(error);
    }
  }

  async redefinirSenha(req, res, next) {
    try {
      await authService.redefinirSenha(req.body.email, req.body.codigo, req.body.novaSenha);
      return res.status(200).json({
        status: 'success',
        message: 'Senha redefinida com sucesso.',
      });
    } catch (error) {
      next(error);
    }
  }

  async trocarSenha(req, res, next) {
    try {
      await authService.trocarSenha(req.usuario.id, req.body.senhaAtual, req.body.novaSenha);
      return res.status(200).json({ status: 'success', message: 'Senha atualizada com sucesso.' });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1] || null;
      await authService.logout(token, req.body?.refreshToken || null);
      return res.status(200).json({ status: 'success', message: 'Logout realizado com sucesso.' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
