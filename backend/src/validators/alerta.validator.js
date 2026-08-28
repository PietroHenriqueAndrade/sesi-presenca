const { z } = require('zod');
const alertaIdSchema = z.object({ params: z.object({ id: z.string().uuid('ID do alerta inválido.') }) });
module.exports = { alertaIdSchema };
