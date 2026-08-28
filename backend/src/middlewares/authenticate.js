const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const authConfig = require('../config/auth.config');
const AppError = require('../utils/AppError');
const prisma = require('../database/client');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new AppError('Token não fornecido. Faça login para acessar.', 401);
    }

    const [scheme, token, extra] = authHeader.trim().split(/\s+/);
    if (extra || !/^Bearer$/i.test(scheme || '') || !token) {
      throw new AppError('Token mal formatado.', 401);
    }

    let decoded;
    try {
      decoded = await promisify(jwt.verify)(token, authConfig.secret);
    } catch (_) {
      throw new AppError('Token inválido ou expirado.', 401);
    }

    if (decoded.tipo !== 'access') {
      throw new AppError('Tipo de token inválido para esta operação.', 401);
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // As duas verificações são independentes e rodam em paralelo. Mantemos tanto
    // a blacklist (logout de um token específico) quanto tokenVersion
    // (revogação imediata de todas as sessões) sem serializar duas consultas.
    const [tokenRevogado, usuario] = await Promise.all([
      prisma.jwtBlacklist.findUnique({ where: { token: tokenHash }, select: { token: true } }),
      prisma.usuario.findUnique({
        where: { id: decoded.id },
        select: { id: true, role: true, ativo: true, tokenVersion: true },
      }),
    ]);

    if (tokenRevogado) {
      throw new AppError('Sessão encerrada. Faça login novamente.', 401);
    }

    if (!usuario || !usuario.ativo || decoded.tokenVersion !== usuario.tokenVersion) {
      throw new AppError('Sessão inválida, expirada ou revogada.', 401);
    }

    req.usuario = { id: usuario.id, role: usuario.role };
    req.accessToken = token;
    return next();
  } catch (error) {
    return next(error);
  }
};
