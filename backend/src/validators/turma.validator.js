const { z } = require('zod');
const turnosPermitidos = ['MANHA', 'TARDE', 'NOITE', 'INTEGRAL'];
const anoAtual = new Date().getFullYear();
const idTurmaSchema = z.object({ params: z.object({ id: z.string().uuid('ID de turma inválido.') }) });
const listaTurmaSchema = z.object({ query: z.object({ busca: z.string().trim().max(100).optional() }) });
const consolidadoSchema = z.object({
  params: z.object({ id: z.string().uuid('ID de turma inválido.') }),
  query: z.object({
    dataInicio: z.string().date().optional(),
    dataFim: z.string().date().optional(),
  }).refine((q) => !q.dataInicio || !q.dataFim || q.dataInicio <= q.dataFim, { message: 'dataInicio deve ser anterior ou igual a dataFim.' }),
});
const bodyCreate = z.object({
  nome: z.string().trim().min(3).max(100),
  anoLetivo: z.number().int().min(2024).max(anoAtual + 2),
  turno: z.enum(turnosPermitidos),
  sala: z.string().trim().max(50).optional(),
});
const createTurmaSchema = z.object({ body: bodyCreate });
const updateTurmaSchema = z.object({
  params: z.object({ id: z.string().uuid('ID de turma inválido.') }),
  body: bodyCreate.partial().refine((body) => Object.keys(body).length > 0, { message: 'Informe ao menos um campo para atualizar.' }),
});
module.exports = { createTurmaSchema, updateTurmaSchema, idTurmaSchema, listaTurmaSchema, consolidadoSchema };
