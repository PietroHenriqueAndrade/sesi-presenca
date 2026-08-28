const { z } = require('zod');
const uuid = z.string().uuid('ID inválido.');
const matricula = z.string().trim().min(5, 'A matrícula deve ter no mínimo 5 caracteres.').max(50);
const nome = z.string().trim().min(3, 'O nome deve ter no mínimo 3 caracteres.').max(160);
const dataYmdBase = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use data no formato YYYY-MM-DD.').refine((valor) => {
  const data = new Date(`${valor}T00:00:00.000Z`);
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
}, 'Data de calendário inválida.');
const dataYmd = dataYmdBase.optional();

const createAlunoSchema = z.object({
  body: z.object({ nome, matricula, turmaId: uuid.optional() }),
});
const updateAlunoSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({ nome: nome.optional(), matricula: matricula.optional(), turmaId: uuid.optional() })
    .refine((data) => Object.keys(data).length > 0, 'Envie pelo menos um campo.'),
});
const idAlunoSchema = z.object({ params: z.object({ id: uuid }) });
const checkRaSchema = z.object({
  params: z.object({ ra: matricula }),
  query: z.object({ ignorandoId: uuid.optional() }),
});
const listarAlunosSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    busca: z.string().trim().max(160).optional(),
    turma: uuid.optional(),
  }),
});
const frequenciaSchema = z.object({
  params: z.object({ id: uuid }),
  query: z.object({ dataInicio: dataYmd, dataFim: dataYmd }).refine(
    (data) => !data.dataInicio || !data.dataFim || data.dataInicio <= data.dataFim,
    { message: 'dataInicio deve ser anterior ou igual a dataFim.', path: ['dataFim'] },
  ),
});
module.exports = { createAlunoSchema, updateAlunoSchema, idAlunoSchema, checkRaSchema, listarAlunosSchema, frequenciaSchema };
