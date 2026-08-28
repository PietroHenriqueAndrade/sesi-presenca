const { Router } = require('express');
const justificativaController = require('./justificativa.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const ROLES = require('../../constants/roles');
const {
  criarJustificativaSchema,
  decidirJustificativaSchema,
  listarJustificativasSchema,
} = require('../../validators/justificativa.validator');

const router = Router();
router.use(authenticate);

router.get(
  '/',
  authorize([ROLES.ADMIN, ROLES.SECRETARIA]),
  validate(listarJustificativasSchema),
  justificativaController.listar
);
router.post(
  '/:presencaId/justificar',
  authorize([ROLES.ADMIN, ROLES.SECRETARIA, ROLES.PROFESSOR]),
  validate(criarJustificativaSchema),
  justificativaController.create
);
router.patch(
  '/:id/aprovar',
  authorize([ROLES.ADMIN, ROLES.SECRETARIA]),
  validate(decidirJustificativaSchema),
  justificativaController.aprovar
);
router.patch(
  '/:id/rejeitar',
  authorize([ROLES.ADMIN, ROLES.SECRETARIA]),
  validate(decidirJustificativaSchema),
  justificativaController.rejeitar
);

module.exports = router;
