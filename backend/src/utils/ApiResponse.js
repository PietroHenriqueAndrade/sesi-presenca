/**
 * Classe utilitária para padronizar as respostas de sucesso da API.
 * As respostas de erro já são tratadas pelo AppError + errorHandler.
 */
class ApiResponse {
  /**
   * Envia uma resposta HTTP padronizada.
   * @param {Object} res - O objeto de resposta (response) do Express.
   * @param {number} statusCode - O código HTTP de sucesso (ex: 200, 201).
   * @param {string} message - Uma mensagem descritiva da ação.
   * @param {any} data - O objeto ou array de dados a ser retornado.
   */
  static send(res, statusCode = 200, message = 'Operação realizada com sucesso', data = null) {
    const responsePayload = {
      status: 'success',
      message
    };

    // Só adiciona a chave 'data' no JSON se houver algum dado para enviar
    if (data !== null) {
      responsePayload.data = data;
    }

    return res.status(statusCode).json(responsePayload);
  }
}

module.exports = ApiResponse;