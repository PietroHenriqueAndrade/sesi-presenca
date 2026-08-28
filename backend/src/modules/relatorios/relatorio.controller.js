const relatorioService = require('./relatorio.service');
const { Parser } = require('json2csv');

function enviarResposta(res, dados, formato, nomeArquivo) {
  if (formato === 'csv') {
    const csv = new Parser().parse(dados);
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment(`${nomeArquivo}.csv`);
    return res.send(`\uFEFF${csv}`);
  }
  return res.status(200).json({ status: 'success', data: dados });
}

class RelatorioController {
  async getRelatorioMensal(req, res, next) { try { return enviarResposta(res, [await relatorioService.gerarRelatorioMensal()], req.query.format, 'relatorio_mensal'); } catch (e) { next(e); } }
  async getCozinha(req, res, next) { try { const r = await relatorioService.previsaoCozinha(req.query.data); return enviarResposta(res, [{ Data: r.data, ...r.previsao }], req.query.format, 'relatorio_cozinha'); } catch (e) { next(e); } }
  async getAusentes(req, res, next) { try { return enviarResposta(res, await relatorioService.listarAusentes(req.query.turmaId, req.query.data), req.query.format, 'lista_ausentes'); } catch (e) { next(e); } }
  async getBaixaFrequencia(req, res, next) { try { return enviarResposta(res, await relatorioService.listarAlunosBaixaFrequencia(req.query.limiar, req.query.dataInicio, req.query.dataFim), req.query.format, 'alunos_em_risco'); } catch (e) { next(e); } }
}
module.exports = new RelatorioController();
