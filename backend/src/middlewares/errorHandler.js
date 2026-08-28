const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

function normalizarErro(err) {
  if (err instanceof AppError) return err;

  if (err?.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return new AppError('Arquivo acima do limite permitido de 5 MB.', 413);
    }
    return new AppError(`Falha no upload: ${err.message}`, 400);
  }

  if (err?.code === 'P2002') return new AppError('Já existe um registro com estes dados únicos.', 409);
  if (err?.code === 'P2025') return new AppError('Registro não encontrado.', 404);
  if (err?.code === 'P2003') return new AppError('A operação viola o vínculo entre registros.', 409);
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return new AppError('JSON inválido no corpo da requisição.', 400);
  }

  return err;
}

module.exports = (originalError, req, res, next) => {
  const err = normalizarErro(originalError);
  const statusCode = err.statusCode || err.status || 500;
  const status = statusCode >= 500 ? 'error' : 'fail';

  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl?.split('?')[0]} - ${err.message}`);
  }

  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      status,
      message: err.message || 'Erro interno.',
      ...(err.isOperational ? {} : { stack: err.stack }),
    });
  }

  if (err.isOperational || statusCode < 500) {
    return res.status(statusCode).json({ status, message: err.message });
  }

  return res.status(500).json({ status: 'error', message: 'Algo deu errado no servidor.' });
};
