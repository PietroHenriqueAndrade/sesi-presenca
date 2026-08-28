const { z } = require('zod');

const ymdBase = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.').refine((valor) => {
  const data = new Date(`${valor}T00:00:00.000Z`);
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
}, 'Data de calendário inválida.');
const ymd = ymdBase.optional();
const formato = z.enum(['json', 'csv']).optional();

const cozinhaSchema = z.object({ query: z.object({ data: ymd, format: formato }) });
const ausentesSchema = z.object({
  query: z.object({ data: ymd, turmaId: z.string().uuid('turmaId inválido.'), format: formato }),
});
const baixaFrequenciaSchema = z.object({
  query: z.object({
    limiar: z.coerce.number().min(0).max(100).optional(),
    dataInicio: ymd,
    dataFim: ymd,
    format: formato,
  }).refine(
    (data) => !data.dataInicio || !data.dataFim || data.dataInicio <= data.dataFim,
    { message: 'dataInicio deve ser anterior ou igual a dataFim.', path: ['dataFim'] },
  ),
});

module.exports = { cozinhaSchema, ausentesSchema, baixaFrequenciaSchema };
