const { z } = require('zod');

const email = z.string().trim().max(254).email('O formato do e-mail é inválido.').transform((valor) => valor.toLowerCase());
const senha = z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.').max(128);

const loginSchema = z.object({
  body: z.object({
    email,
    senha,
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(20, 'Refresh token inválido.'),
  }),
});

const recuperarSenhaSchema = z.object({
  body: z.object({ email }),
});

const redefinirSenhaSchema = z.object({
  body: z.object({
    email,
    codigo: z.string().trim().regex(/^\d{6}$/, 'O código deve possuir 6 dígitos.'),
    novaSenha: senha,
  }),
});

const trocarSenhaSchema = z.object({
  body: z.object({
    senhaAtual: senha,
    novaSenha: senha,
  }).refine((data) => data.senhaAtual !== data.novaSenha, {
    message: 'A nova senha deve ser diferente da senha atual.',
    path: ['novaSenha'],
  }),
});

module.exports = {
  loginSchema,
  refreshSchema,
  recuperarSenhaSchema,
  redefinirSenhaSchema,
  trocarSenhaSchema,
};
