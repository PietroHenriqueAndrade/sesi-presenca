const { Router } = require('express');
const alunoController = require('./aluno.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const schemas = require('../../validators/aluno.validator');
const ROLES = require('../../constants/roles');
const upload = require('../../middlewares/upload');

const router = Router();
router.use(authenticate);
const leitura = authorize([ROLES.ADMIN, ROLES.SECRETARIA, ROLES.PROFESSOR]);
const escrita = authorize([ROLES.ADMIN, ROLES.SECRETARIA]);

router.get('/', leitura, validate(schemas.listarAlunosSchema), alunoController.getAll);
router.get('/check-ra/:ra', escrita, validate(schemas.checkRaSchema), alunoController.checkRa);
router.get('/:id', leitura, validate(schemas.idAlunoSchema), alunoController.getById);
router.get('/:id/frequencia', leitura, validate(schemas.frequenciaSchema), alunoController.getFrequencia);
router.get('/:id/frequencia/disciplinas', leitura, validate(schemas.frequenciaSchema), alunoController.getFrequenciaDisciplinas);
router.get('/:id/segundo-fator', escrita, validate(schemas.idAlunoSchema), alunoController.statusSegundoFator);
router.post('/:id/segundo-fator', escrita, validate(schemas.idAlunoSchema), alunoController.gerarSegundoFator);
router.delete('/:id/segundo-fator', escrita, validate(schemas.idAlunoSchema), alunoController.desativarSegundoFator);
router.post('/:id/foto', escrita, validate(schemas.idAlunoSchema), upload.single('foto'), alunoController.uploadFoto);
router.post('/', escrita, validate(schemas.createAlunoSchema), alunoController.create);
router.patch('/:id', escrita, validate(schemas.updateAlunoSchema), alunoController.update);
router.delete('/:id', escrita, validate(schemas.idAlunoSchema), alunoController.delete);
router.delete('/:id/lgpd', authorize([ROLES.ADMIN]), validate(schemas.idAlunoSchema), alunoController.exclusaoLGPD);
module.exports = router;
