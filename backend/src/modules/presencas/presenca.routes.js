const { Router } = require('express');
const presencaController = require('./presenca.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const schemas = require('../../validators/presenca.validator');
const ROLES = require('../../constants/roles');

const router = Router();
router.use(authenticate);
router.get('/', validate(schemas.listarSchema), presencaController.getAll);
router.get('/hoje', presencaController.getHoje);
router.get('/aluno/:id', validate(schemas.idSchema), presencaController.getByAluno);
router.get('/turma/:id', validate(schemas.idSchema), presencaController.getByTurma);
router.post('/', authorize([ROLES.ADMIN, ROLES.SECRETARIA, ROLES.PROFESSOR]), validate(schemas.registrarPresencaSchema), presencaController.registrarPresencaManual);
router.post('/batch', authorize([ROLES.PROFESSOR, ROLES.ADMIN, ROLES.SECRETARIA]), validate(schemas.batchSchema), presencaController.sincronizarBatch);
router.patch('/:id/saida', authorize([ROLES.ADMIN, ROLES.SECRETARIA]), validate(schemas.saidaSchema), presencaController.registrarSaida);
module.exports = router;
