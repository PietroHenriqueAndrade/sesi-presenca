const { Router } = require('express');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const ROLES = require('../../constants/roles');
const dashboardController = require('./dashboard.controller');

const router = Router();
router.use(authenticate);
router.get('/resumo', authorize([ROLES.ADMIN, ROLES.SECRETARIA, ROLES.PROFESSOR]), dashboardController.resumo);
module.exports = router;
