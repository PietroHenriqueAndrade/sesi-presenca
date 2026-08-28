const { Router } = require('express');
const usuarioController = require('./usuario.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const { createUsuarioSchema, updateUsuarioSchema, updateMeSchema, idSchema } = require('../../validators/usuario.validator');
const ROLES = require('../../constants/roles');

const router = Router();

router.use(authenticate);

// Perfil do próprio usuário autenticado (Flutter/configurações).
router.get('/me', usuarioController.getMe);
router.patch('/me', validate(updateMeSchema), usuarioController.updateMe);

// Administração de usuários continua exclusiva do ADMIN.
router.use(authorize([ROLES.ADMIN]));
router.post('/', validate(createUsuarioSchema), usuarioController.create);
router.get('/', usuarioController.getAll);
router.patch('/:id', validate(updateUsuarioSchema), usuarioController.update);
router.delete('/:id', validate(idSchema), usuarioController.delete);

module.exports = router;
