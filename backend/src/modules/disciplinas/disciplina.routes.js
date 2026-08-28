const { Router } = require('express');
const disciplinaController = require('./disciplina.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const schemas = require('../../validators/disciplina.validator');
const ROLES = require('../../constants/roles');

const router = Router();

router.use(authenticate);

router.get('/', validate(schemas.listaDisciplinaSchema), disciplinaController.getAll);
router.get('/:id', validate(schemas.idDisciplinaSchema), disciplinaController.getById);

// Validadores do Zod injetados
router.post('/', authorize([ROLES.ADMIN, ROLES.SECRETARIA]), validate(schemas.createDisciplinaSchema), disciplinaController.create);
router.patch('/:id', authorize([ROLES.ADMIN, ROLES.SECRETARIA]), validate(schemas.updateDisciplinaSchema), disciplinaController.update);
router.delete('/:id', authorize([ROLES.ADMIN, ROLES.SECRETARIA]), validate(schemas.idDisciplinaSchema), disciplinaController.delete);

module.exports = router;