const { z } = require('zod');
const codigo = z.string().trim().min(2).max(30).transform((v) => v.toUpperCase());
const idDisciplinaSchema = z.object({ params: z.object({ id: z.string().uuid('ID de disciplina inválido.') }) });
const listaDisciplinaSchema = z.object({ query: z.object({ busca: z.string().trim().max(100).optional() }) });
const disciplinaBody = z.object({
  nome: z.string().trim().min(3).max(120),
  codigo: codigo.optional(),
  professor: z.string().trim().max(120).optional(),
  cargaHoraria: z.number().int().positive().max(10000).optional(),
});
const createDisciplinaSchema = z.object({ body: disciplinaBody });
const updateDisciplinaSchema = z.object({
  params: z.object({ id: z.string().uuid('ID de disciplina inválido.') }),
  body: disciplinaBody.partial().refine((body) => Object.keys(body).length > 0, { message: 'Informe ao menos um campo para atualizar.' }),
});
module.exports = { createDisciplinaSchema, updateDisciplinaSchema, idDisciplinaSchema, listaDisciplinaSchema };
