const { Router } = require('express');
const controller = require('./health.controller');
const router = Router();
router.get('/', controller.liveness);
router.get('/ready', controller.readiness);
module.exports = router;
