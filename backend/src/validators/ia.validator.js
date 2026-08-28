const { z } = require('zod');

const uuid = z.string().uuid('ID deve ser um UUID válido.');
const faceScore = z.number({ required_error: 'faceScore é obrigatório.' }).min(0).max(1);

const registrarPresencaIaSchema = z.object({
  body: z.object({
    alunoId: uuid,
    turmaId: uuid,
    faceScore,
    imagemHash: z.string().trim().min(8).max(128).optional(),
  }),
});

const criarSessaoCadastroSchema = z.object({
  body: z.object({
    alunoId: uuid,
    senha: z.string().min(8).max(128),
  }),
});

const tokenCadastroSchema = z.object({
  body: z.object({
    token: z.string().min(20).max(4096),
  }),
});

const resolverAmbiguidadeSchema = z.object({
  body: z.object({
    codigo: z.string().regex(/^\d{6}$/, 'O código deve possuir 6 dígitos.'),
    candidatos: z.array(z.object({
      alunoId: uuid,
      turmaId: uuid,
      faceScore,
    })).min(1).max(3),
  }),
});

module.exports = {
  registrarPresencaIaSchema,
  criarSessaoCadastroSchema,
  tokenCadastroSchema,
  resolverAmbiguidadeSchema,
};
