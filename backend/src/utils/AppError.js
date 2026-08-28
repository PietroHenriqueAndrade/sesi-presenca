/**
 * Classe para padronização de erros operacionais da API.
 * @class AppError
 * @extends Error
 */
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Identifica se é um erro previsto por nós (ex: "Aluno não encontrado")

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;