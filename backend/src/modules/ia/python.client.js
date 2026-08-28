const axios = require('axios');
const AppError = require('../../utils/AppError');
const { getPythonBaseUrl } = require('../../config/serviceUrls');

class PythonClient {
  async excluirBiometriaAluno(alunoId) {
    const urlBase = getPythonBaseUrl();
    const apiKey = (process.env.IA_API_KEY || '').trim();
    if (!urlBase || !apiKey) throw new AppError('Integração com a IA não está configurada para exclusão biométrica.', 503);
    try {
      const response = await axios.delete(`${urlBase}/alunos/${alunoId}/biometria`, {
        headers: { 'x-api-key': apiKey, Accept: 'application/json' },
        timeout: Number(process.env.PYTHON_TIMEOUT_MS) || 8000,
      });
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      const detalhe = error.response?.data?.detail || error.response?.data?.mensagem;
      throw new AppError(detalhe || 'Não foi possível apagar a biometria no serviço Python. A exclusão no banco foi cancelada.', status && status < 500 ? status : 503);
    }
  }
}
module.exports = new PythonClient();
