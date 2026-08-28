const { Router } = require('express');
const turmaController = require('./turma.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const schemas = require('../../validators/turma.validator');
const ROLES = require('../../constants/roles');

const router = Router();

router.use(authenticate);

router.get('/', validate(schemas.listaTurmaSchema), turmaController.getAll);
router.get('/:id', validate(schemas.idTurmaSchema), turmaController.getById);
router.get('/:id/alunos', validate(schemas.idTurmaSchema), turmaController.getAlunosDaTurma);
router.get('/:id/frequencia/consolidado', validate(schemas.consolidadoSchema), turmaController.getConsolidadoFrequencia);

// Validadores do Zod injetados nas rotas de modificação
router.post('/', authorize([ROLES.ADMIN, ROLES.SECRETARIA]), validate(schemas.createTurmaSchema), turmaController.create);
router.patch('/:id', authorize([ROLES.ADMIN, ROLES.SECRETARIA]), validate(schemas.updateTurmaSchema), turmaController.update);
router.delete('/:id', authorize([ROLES.ADMIN, ROLES.SECRETARIA]), validate(schemas.idTurmaSchema), turmaController.delete);

module.exports = router;