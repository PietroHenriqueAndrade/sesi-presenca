const AppError = require('../utils/AppError');

// Recebe um array de perfis permitidos (ex: ['ADMIN', 'SECRETARIA'])
const authorize = (rolesPermitidas = []) => {
  return (req, res, next) => {
    // Verifica se o perfil do usuário logado está dentro do array de perfis permitidos
    if (!rolesPermitidas.includes(req.usuario.role)) {
      return next(
        new AppError('Acesso negado. Seu perfil não tem permissão para esta ação.', 403)
      );
    }

    next(); // Tem permissão, pode seguir!
  };
};

module.exports = authorize;