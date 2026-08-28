const AppError = require('../../utils/AppError');
const alunoService = require('./aluno.service');

class AlunoController {
  async create(req, res, next) {
    try {
      const novoAluno = await alunoService.createAluno(req.body, req.usuario.id);
      return res.status(201).json({ status: 'success', data: novoAluno });
    } catch (error) {
      next(error);
    }
  }

  // Adicione junto aos outros métodos (create, update, etc)
  async uploadFoto(req, res, next) {
    try {
      const { id } = req.params;
      if (!req.file) {
        // Agora o AppError existe e vai devolver o erro 400 certinho
        throw new AppError('Nenhuma imagem enviada na requisição.', 400); 
      }
      const resultado = await alunoService.uploadFotoTreinamento(id, req.file);
      return res.status(200).json({ status: 'success', data: resultado });
    } catch (error) {
      next(error);
    }
  }

  async exclusaoLGPD(req, res, next) {
    try {
      const { id } = req.params;
      await alunoService.exclusaoDefinitivaLGPD(id, req.usuario.id);
      return res.status(200).json({
        status: 'success',
        message: 'Dados do aluno foram apagados permanentemente conforme Art. 18 VI LGPD.'
      });
    } catch (error) {
      next(error);
    }
  }


  async gerarSegundoFator(req, res, next) {
    try {
      const data = await alunoService.gerarCodigoSegundoFator(req.params.id, req.usuario.id);
      return res.status(201).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  async desativarSegundoFator(req, res, next) {
    try {
      const data = await alunoService.desativarSegundoFator(req.params.id, req.usuario.id);
      return res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  async statusSegundoFator(req, res, next) {
    try {
      const data = await alunoService.statusSegundoFator(req.params.id);
      return res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  async checkRa(req, res, next) {
    try {
      const { ra } = req.params;
      const { ignorandoId } = req.query;
      const existe = await alunoService.matriculaExiste(ra, ignorandoId);
      return res.status(200).json({ status: 'success', data: { existe } });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const pagina = parseInt(req.query.page, 10) || 1;
      const limiteSolicitado = parseInt(req.query.limit, 10) || 10;
      const limiteSeguro = Math.min(limiteSolicitado, 100);

      const resultado = await alunoService.listarAlunos(pagina, limiteSeguro, {
        busca: req.query.busca,
        turmaId: req.query.turma,
      });
      
      return res.status(200).json({ status: 'success', data: resultado });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const aluno = await alunoService.buscarAlunoPorId(req.params.id);
      return res.status(200).json({ status: 'success', data: aluno });
    } catch (error) {
      next(error);
    }
  }

  async getFrequencia(req, res, next) {
    try {
      const { dataInicio, dataFim } = req.query;
      const estatisticas = await alunoService.calcularFrequenciaPercentual(
        req.params.id, 
        dataInicio, 
        dataFim
      );
      return res.status(200).json({ status: 'success', data: estatisticas });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      // CORREÇÃO: Passando o req.usuario.id para a auditoria!
      const alunoAtualizado = await alunoService.atualizarAluno(req.params.id, req.body, req.usuario.id);
      return res.status(200).json({ status: 'success', data: alunoAtualizado });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      // CORREÇÃO: Passando o req.usuario.id para a auditoria!
      await alunoService.deletarAluno(req.params.id, req.usuario.id);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
  
  async getFrequenciaDisciplinas(req, res, next) {
    try {
      const { dataInicio, dataFim } = req.query; 
      const relatorio = await alunoService.calcularFrequenciaPorDisciplina(req.params.id, dataInicio, dataFim);
      return res.status(200).json({ status: 'success', data: relatorio });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AlunoController();