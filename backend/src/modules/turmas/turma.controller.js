const turmaService = require('./turma.service');

class TurmaController {
  async create(req, res, next) {
    try {
      // CORREÇÃO: Passando o req.usuario.id para rastrear quem criou a turma
      const novaTurma = await turmaService.createTurma(req.body, req.usuario.id);
      return res.status(201).json({ status: 'success', data: novaTurma });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const turmas = await turmaService.listarTurmas(req.query.busca);
      return res.status(200).json({ status: 'success', data: turmas });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const turma = await turmaService.buscarTurmaPorId(req.params.id);
      return res.status(200).json({ status: 'success', data: turma });
    } catch (error) {
      next(error);
    }
  }

  async getAlunos(req, res, next) {
    try {
      const alunos = await turmaService.listarAlunosDaTurma(req.params.id);
      return res.status(200).json({ status: 'success', data: alunos });
    } catch (error) {
      next(error);
    }
  }

  async getAlunosDaTurma(req, res, next) {
    try {
      // Pega o ID da turma que vem na URL
      const alunos = await turmaService.listarAlunosDaTurma(req.params.id);
      
      return res.status(200).json({ status: 'success', data: alunos });
    } catch (error) {
      next(error);
    }
  }

  async getConsolidadoFrequencia(req, res, next) {
    try {
      const { dataInicio, dataFim } = req.query;
      const relatorio = await turmaService.relatorioConsolidadoFrequencia(req.params.id, dataInicio, dataFim);
      return res.status(200).json({ status: 'success', data: relatorio });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      // CORREÇÃO: Passando o req.usuario.id para rastrear quem editou a turma
      const turmaAtualizada = await turmaService.atualizarTurma(req.params.id, req.body, req.usuario.id);
      return res.status(200).json({ status: 'success', data: turmaAtualizada });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      // CORREÇÃO: Passando o req.usuario.id para rastrear quem deletou a turma
      await turmaService.deletarTurma(req.params.id, req.usuario.id);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TurmaController();