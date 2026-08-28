const { Router } = require('express');
const horarioController = require('./horario.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const ROLES = require('../../constants/roles');
const { criarHorarioSchema, atualizarHorarioSchema, idHorarioSchema, turmaAgoraSchema } = require('../../validators/horario.validator');

const router = Router();
router.use(authenticate);
router.get('/', horarioController.getAll);
router.get('/turma/:id/agora', validate(turmaAgoraSchema), horarioController.buscarAulaAtual);
router.post('/', authorize([ROLES.ADMIN, ROLES.SECRETARIA]), validate(criarHorarioSchema), horarioController.create);
router.patch('/:id', authorize([ROLES.ADMIN, ROLES.SECRETARIA]), validate(atualizarHorarioSchema), horarioController.update);
router.delete('/:id', authorize([ROLES.ADMIN, ROLES.SECRETARIA]), validate(idHorarioSchema), horarioController.delete);
module.exports = router;
