const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const prisma = require('../../database/client');
const authConfig = require('../../config/auth.config');
const AppError = require('../../utils/AppError');
const enviarEmail = require('../../utils/email');
const auditService = require('../auditoria/audit.service');
const authRepository = require('./auth.repository');

class AuthService {
  _gerarTokens(usuario) {
    const token = jwt.sign(
      { id: usuario.id, role: usuario.role, tipo: 'access', tokenVersion: usuario.tokenVersion ?? 0 },
      authConfig.secret,
      { expiresIn: authConfig.expiresIn || '1h' }
    );

    const refreshToken = jwt.sign(
      { id: usuario.id, tipo: 'refresh', tokenVersion: usuario.tokenVersion ?? 0 },
      authConfig.refreshSecret,
      { expiresIn: authConfig.refreshExpiresIn || '7d' }
    );

    const decoded = jwt.decode(token);
    const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : null;

    return { token, refreshToken, expiresAt };
  }

  async _revogarToken(token) {
    if (!token) return;
    const decoded = jwt.decode(token);
    if (!decoded?.exp) return;

    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await prisma.jwtBlacklist.create({
        data: {
          token: tokenHash,
          expiresAt: new Date(decoded.exp * 1000),
        },
      });
    } catch (error) {
      if (error.code !== 'P2002') throw error;
    }
  }

  async _tokenRevogado(token) {
    if (!token) return false;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const registro = await prisma.jwtBlacklist.findUnique({ where: { token: tokenHash } });
    return Boolean(registro);
  }

  async login(email, senha, ip = null) {
    const usuario = await authRepository.findUserByEmail(email);

    if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
      throw new AppError('Credenciais inválidas.', 401);
    }

    if (!usuario.ativo) {
      throw new AppError('Esta conta foi desativada. Procure a administração.', 403);
    }

    const tokens = this._gerarTokens(usuario);

    await auditService.registrarLog({
      usuarioId: usuario.id,
      acao: 'LOGIN',
      entidade: 'Usuario',
      entidadeId: usuario.id,
      ip,
    });

    return {
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
      },
      ...tokens,
    };
  }

  async renovarToken(refreshToken) {
    if (!refreshToken) {
      throw new AppError('Refresh token não fornecido.', 401);
    }

    if (await this._tokenRevogado(refreshToken)) {
      throw new AppError('Refresh token revogado. Faça login novamente.', 401);
    }

    let decoded;
    try {
      decoded = await promisify(jwt.verify)(refreshToken, authConfig.refreshSecret);
    } catch (_) {
      throw new AppError('Refresh token inválido ou expirado. Faça login novamente.', 401);
    }

    if (decoded.tipo !== 'refresh') {
      throw new AppError('Tipo de token inválido para renovação.', 401);
    }

    const usuario = await authRepository.findUserById(decoded.id);

    if (!usuario || !usuario.ativo || decoded.tokenVersion !== usuario.tokenVersion) {
      throw new AppError('Sessão inválida ou revogada. Faça login novamente.', 401);
    }

    // Rotação: um refresh token só pode ser usado uma vez.
    await this._revogarToken(refreshToken);
    return this._gerarTokens(usuario);
  }

  async obterPerfil(usuarioId) {
    const usuario = await authRepository.findById(usuarioId);
    if (!usuario || !usuario.ativo) {
      throw new AppError('Usuário não encontrado ou desativado.', 404);
    }
    return usuario;
  }

  async recuperarSenha(email) {
    // Evita uma falsa promessa: sem SMTP a funcionalidade não pode funcionar.
    if (!enviarEmail.smtpConfigurado()) {
      throw new AppError('Recuperação por e-mail não está configurada neste ambiente.', 503);
    }

    const usuario = await authRepository.findUserByEmail(email);
    if (!usuario || !usuario.ativo) return true;

    const codigo = crypto.randomInt(100000, 1000000).toString();
    const tokenHash = crypto.createHash('sha256').update(codigo).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.$transaction([
      prisma.passwordResetToken.updateMany({
        where: { usuarioId: usuario.id, usadoEm: null },
        data: { usadoEm: new Date() },
      }),
      prisma.passwordResetToken.create({
        data: { usuarioId: usuario.id, tokenHash, expiresAt },
      }),
    ]);

    await enviarEmail({
      to: usuario.email,
      subject: 'Código de recuperação - Sistema de Presença SENAI',
      text: `Seu código de recuperação é ${codigo}. Ele expira em 15 minutos.`,
      html: `<p>Seu código de recuperação é <strong>${codigo}</strong>.</p><p>Ele expira em 15 minutos.</p>`,
    });

    return true;
  }

  async redefinirSenha(email, codigo, novaSenha) {
    const usuario = await authRepository.findUserByEmail(email);
    if (!usuario || !usuario.ativo) {
      throw new AppError('Código inválido ou expirado.', 400);
    }

    const tokenHash = crypto.createHash('sha256').update(codigo).digest('hex');
    const token = await prisma.passwordResetToken.findFirst({
      where: {
        usuarioId: usuario.id,
        tokenHash,
        usadoEm: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { criadoEm: 'desc' },
    });

    if (!token) {
      throw new AppError('Código inválido ou expirado.', 400);
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10);
    await prisma.$transaction([
      prisma.usuario.update({ where: { id: usuario.id }, data: { senha: senhaHash, tokenVersion: { increment: 1 } } }),
      prisma.passwordResetToken.update({ where: { id: token.id }, data: { usadoEm: new Date() } }),
      prisma.jwtBlacklist.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
    ]);

    return true;
  }

  async trocarSenha(usuarioId, senhaAtual, novaSenha) {
    const usuario = await authRepository.findUserById(usuarioId);
    if (!usuario || !usuario.ativo) throw new AppError('Usuário não encontrado.', 404);

    if (!(await bcrypt.compare(senhaAtual, usuario.senha))) {
      throw new AppError('Senha atual incorreta.', 400);
    }

    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { senha: novaSenhaHash, tokenVersion: { increment: 1 } },
    });

    return true;
  }

  async logout(accessToken, refreshToken) {
    await Promise.all([
      this._revogarToken(accessToken),
      this._revogarToken(refreshToken),
    ]);
    return true;
  }
}

module.exports = new AuthService();
