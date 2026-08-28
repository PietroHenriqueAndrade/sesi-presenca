const disciplinaService = require('./disciplina.service');

class DisciplinaController {
  async create(req, res, next) {
    try {
      const novaDisciplina = await disciplinaService.createDisciplina(req.body, req.usuario.id);
      return res.status(201).json({ status: 'success', data: novaDisciplina });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const disciplinas = await disciplinaService.listarDisciplinas(req.query.busca);
      return res.status(200).json({ status: 'success', data: disciplinas });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const disciplina = await disciplinaService.buscarDisciplinaPorId(req.params.id);
      return res.status(200).json({ status: 'success', data: disciplina });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const disciplinaAtualizada = await disciplinaService.atualizarDisciplina(req.params.id, req.body, req.usuario.id);
      return res.status(200).json({ status: 'success', data: disciplinaAtualizada });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await disciplinaService.deletarDisciplina(req.params.id, req.usuario.id);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DisciplinaController();