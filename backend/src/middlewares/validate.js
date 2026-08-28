const AppError = require('../utils/AppError');

const validate = (schema) => (req, res, next) => {
  try {
    // A CORREÇÃO CRÍTICA DA AUDITORIA: 
    // Envelopar o req.body dentro da chave 'body' para o Zod entender
    const validData = schema.parse({ 
      body: req.body,
      query: req.query,
      params: req.params 
    });
    
    // Atualiza os dados com a versão sanitizada pelo Zod
    if (validData.body) req.body = validData.body;
    if (validData.query) {
      Object.defineProperty(req, 'query', { value: validData.query, writable: true, configurable: true, enumerable: true });
    }
    if (validData.params) req.params = validData.params;
    
    next();
  } catch (error) {
    if (error.issues) {
      const mensagensErro = error.issues.map((issue) => {
        const campo = issue.path.length > 0 ? `${issue.path.join('.')} - ` : '';
        return `${campo}${issue.message}`;
      });

      return res.status(400).json({
        status: 'error',
        message: 'Falha na validação dos dados enviados.',
        erros: mensagensErro
      });
    }
    next(error);
  }
};

module.exports = validate;