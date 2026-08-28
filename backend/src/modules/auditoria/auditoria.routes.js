const { Router } = require('express');
const auditoriaController = require('./auditoria.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const ROLES = require('../../constants/roles');

const router = Router();
router.use(authenticate);

// ATENÇÃO: Só Administradores (Diretoria) podem bisbilhotar os logs da LGPD!
router.get('/', authorize([ROLES.ADMIN]), auditoriaController.listar);

module.exports = router;