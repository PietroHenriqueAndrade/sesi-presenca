const { z } = require('zod');
const rolesPermitidos = ['ADMIN', 'PROFESSOR', 'SECRETARIA', 'COZINHA', 'SISTEMA_IA'];
const idSchema = z.object({ params: z.object({ id: z.string().uuid('ID de usuário inválido.') }) });
const perfilBody = z.object({
  nome: z.string().trim().min(3).max(120).optional(),
  email: z.string().trim().email().max(254).transform((v) => v.toLowerCase()).optional(),
}).refine((body) => Object.keys(body).length > 0, { message: 'Informe ao menos um campo para atualizar.' });

const createUsuarioSchema = z.object({
  body: z.object({
    nome: z.string().trim().min(3).max(120),
    email: z.string().trim().email().max(254).transform((v) => v.toLowerCase()),
    senha: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres.').max(128),
    role: z.enum(rolesPermitidos),
  }),
});

const updateUsuarioSchema = z.object({
  params: z.object({ id: z.string().uuid('ID de usuário inválido.') }),
  body: z.object({
    nome: z.string().trim().min(3).max(120).optional(),
    email: z.string().trim().email().max(254).transform((v) => v.toLowerCase()).optional(),
    senha: z.string().min(8).max(128).optional(),
    role: z.enum(rolesPermitidos).optional(),
    ativo: z.boolean().optional(),
  }).refine((body) => Object.keys(body).length > 0, { message: 'Informe ao menos um campo para atualizar.' }),
});

const updateMeSchema = z.object({ body: perfilBody });
module.exports = { createUsuarioSchema, updateUsuarioSchema, updateMeSchema, idSchema };
