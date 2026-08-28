const { z } = require('zod');

const dias = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'];
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário deve estar no formato HH:mm.');
const uuid = z.string().uuid('ID inválido.');

const dadosHorario = z.object({
  turmaId: uuid,
  disciplinaId: uuid,
  diaSemana: z.enum(dias),
  horaInicio: hhmm,
  horaFim: hhmm,
}).superRefine((data, ctx) => {
  if (data.horaInicio >= data.horaFim) {
    ctx.addIssue({ code: 'custom', path: ['horaFim'], message: 'horaFim deve ser posterior a horaInicio.' });
  }
});

const criarHorarioSchema = z.object({ body: dadosHorario });
const atualizarHorarioSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({
    turmaId: uuid.optional(),
    disciplinaId: uuid.optional(),
    diaSemana: z.enum(dias).optional(),
    horaInicio: hhmm.optional(),
    horaFim: hhmm.optional(),
    ativo: z.boolean().optional(),
  }).refine((data) => Object.keys(data).length > 0, 'Envie pelo menos um campo para atualizar.'),
});
const idHorarioSchema = z.object({ params: z.object({ id: uuid }) });
const turmaAgoraSchema = z.object({ params: z.object({ id: uuid }) });

module.exports = { criarHorarioSchema, atualizarHorarioSchema, idHorarioSchema, turmaAgoraSchema };
