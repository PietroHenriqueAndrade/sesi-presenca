const { Router } = require('express');
const iaController = require('./ia.controller');
const validateApiKey = require('../../middlewares/validateApiKey');
const validate = require('../../middlewares/validate');
const iaRateLimiter = require('../../middlewares/iaRateLimiter');
const secondFactorRateLimiter = require('../../middlewares/secondFactorRateLimiter');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const ROLES = require('../../constants/roles');
const {
  registrarPresencaIaSchema,
  criarSessaoCadastroSchema,
  tokenCadastroSchema,
  resolverAmbiguidadeSchema,
} = require('../../validators/ia.validator');

const router = Router();

router.get('/health', iaController.checkPythonStatus);

// Dashboard administrativo: cria uma autorização curta, vinculada ao aluno e
// protegida por reautenticação com a senha do operador.
router.post(
  '/sessao-cadastro',
  authenticate,
  authorize([ROLES.ADMIN, ROLES.SECRETARIA]),
  validate(criarSessaoCadastroSchema),
  iaController.criarSessaoCadastro,
);

// Comunicação interna Python -> Node.
router.use(validateApiKey);
router.post('/validar-sessao-cadastro', validate(tokenCadastroSchema), iaController.validarSessaoCadastro);
router.post('/cadastro-concluido', validate(tokenCadastroSchema), iaController.cadastroConcluido);
router.post('/resolver-ambiguidade', secondFactorRateLimiter, validate(resolverAmbiguidadeSchema), iaController.resolverAmbiguidade);
router.post('/registrar-presenca', iaRateLimiter, validate(registrarPresencaIaSchema), iaController.processarReconhecimento);

module.exports = router;
