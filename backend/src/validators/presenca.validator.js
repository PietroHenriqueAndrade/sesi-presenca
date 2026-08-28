const { z } = require('zod');

const uuid = z.string().uuid('ID deve ser um UUID válido.');
const status = z.enum(['PRESENTE', 'AUSENTE', 'JUSTIFICADO', 'ATRASO', 'SAIDA_ANTECIPADA']);
const dataYmdBase = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use data no formato YYYY-MM-DD.').refine((valor) => {
  const data = new Date(`${valor}T00:00:00.000Z`);
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
}, 'Data de calendário inválida.');
const dataYmd = dataYmdBase;

const registrarPresencaSchema = z.object({
  body: z.object({
    alunoId: uuid,
    turmaId: uuid,
    disciplinaId: uuid.optional(),
    status: status.optional(),
    origem: z.enum(['MANUAL']).optional(),
  }),
});

const batchItemSchema = z.object({
  alunoId: uuid,
  turmaId: uuid,
  dataHora: z.string().datetime({ offset: true }).or(z.string().datetime()),
  status: z.enum(['PRESENTE', 'ATRASO']).optional(),
});

const batchSchema = z.object({
  body: z.object({ lote: z.array(batchItemSchema).min(1).max(500) }),
});

const listarSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    alunoId: uuid.optional(),
    turmaId: uuid.optional(),
    status: status.optional(),
    dataInicio: dataYmd.optional(),
    dataFim: dataYmd.optional(),
  }).refine(
    (data) => !data.dataInicio || !data.dataFim || data.dataInicio <= data.dataFim,
    { message: 'dataInicio deve ser anterior ou igual a dataFim.', path: ['dataFim'] },
  ),
});

const idSchema = z.object({ params: z.object({ id: uuid }) });
const saidaSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({ status: z.enum(['PRESENTE', 'ATRASO', 'SAIDA_ANTECIPADA']).optional() }),
});

module.exports = { registrarPresencaSchema, batchSchema, listarSchema, idSchema, saidaSchema };
