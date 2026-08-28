const { z } = require('zod');

const uuid = z.string().uuid('ID inválido.');
const motivo = z.string().trim().min(5, 'Informe um motivo com pelo menos 5 caracteres.').max(1000);

const criarJustificativaSchema = z.object({
  params: z.object({ presencaId: uuid }),
  body: z.object({
    motivo,
    anexoUrl: z.string().trim().url('anexoUrl deve ser uma URL válida.').max(2048).optional().or(z.literal('')),
  }),
});

const decidirJustificativaSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({
    observacao: z.string().trim().max(500).optional(),
  }).default({}),
});

const listarJustificativasSchema = z.object({
  query: z.object({
    status: z.enum(['PENDENTE', 'APROVADO', 'REJEITADO']).optional(),
  }),
});

module.exports = {
  criarJustificativaSchema,
  decidirJustificativaSchema,
  listarJustificativasSchema,
};
