const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('./auth.controller');
const validate = require('../../middlewares/validate');
const authenticate = require('../../middlewares/authenticate');
const {
  loginSchema,
  refreshSchema,
  recuperarSenhaSchema,
  redefinirSenhaSchema,
  trocarSenhaSchema,
} = require('../../validators/auth.validator');

const router = Router();

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Muitas tentativas de autenticação. Aguarde alguns minutos e tente novamente.',
  },
});

router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authRateLimiter, validate(refreshSchema), authController.refresh);
router.post('/recuperar-senha', authRateLimiter, validate(recuperarSenhaSchema), authController.recuperarSenha);
router.post('/redefinir-senha', authRateLimiter, validate(redefinirSenhaSchema), authController.redefinirSenha);

router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);
router.post('/trocar-senha', authenticate, validate(trocarSenhaSchema), authController.trocarSenha);

module.exports = router;
