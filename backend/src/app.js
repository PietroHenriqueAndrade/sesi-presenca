const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('./middlewares/errorHandler');
const AppError = require('./utils/AppError');
const authRoutes = require('./modules/auth/auth.routes');
const alunoRoutes = require('./modules/alunos/aluno.routes');
const turmaRoutes = require('./modules/turmas/turma.routes');
const disciplinaRoutes = require('./modules/disciplinas/disciplina.routes');
const presencaRoutes = require('./modules/presencas/presenca.routes');
const iaRoutes = require('./modules/ia/ia.routes');
const relatorioRoutes = require('./modules/relatorios/relatorio.routes');
const appConfig = require('./config/app.config');
const requestLogger = require('./middlewares/requestLogger');
const rateLimiter = require('./middlewares/rateLimiter');
const usuarioRoutes = require('./modules/usuarios/usuario.routes');
const horarioRoutes = require('./modules/horarios/horario.routes');
const alertaRoutes = require('./modules/alertas/alerta.routes');
const auditoriaRoutes = require('./modules/auditoria/auditoria.routes');
const justificativaRoutes = require('./modules/justificativas/justificativa.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();

if (appConfig.trustProxy) {
  app.set('trust proxy', appConfig.trustProxy);
}

// ==========================================
// MIDDLEWARES GLOBAIS
// ==========================================
app.use(helmet()); // Adiciona headers de segurança HTTP
app.use(cors(appConfig.corsOptions)); // Permite requisições do frontend (React/Flutter)
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '1mb' })); // Transforma o corpo das requisições (body) em JSON
app.use(requestLogger); // Registra as requisições
app.use(rateLimiter); // Aplica o rate limiting

const healthRoutes = require('./modules/health/health.routes');

// ==========================================
// ROTAS DA APLICAÇÃO
// ==========================================

app.use('/api/health', healthRoutes);
app.use(`${appConfig.apiPrefix}/health`, healthRoutes);
app.use(`${appConfig.apiPrefix}/auth`, authRoutes);
if (appConfig.env !== 'production' || String(process.env.ENABLE_API_DOCS || '').toLowerCase() === 'true') {
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
app.use(`${appConfig.apiPrefix}/alunos`, alunoRoutes);
app.use(`${appConfig.apiPrefix}/turmas`, turmaRoutes);
app.use(`${appConfig.apiPrefix}/disciplinas`, disciplinaRoutes);
app.use(`${appConfig.apiPrefix}/presencas`, presencaRoutes);
app.use(`${appConfig.apiPrefix}/ia`, iaRoutes);
app.use(`${appConfig.apiPrefix}/relatorios`, relatorioRoutes);
app.use(`${appConfig.apiPrefix}/usuarios`, usuarioRoutes);
app.use(`${appConfig.apiPrefix}/horarios`, horarioRoutes);
app.use(`${appConfig.apiPrefix}/alertas`, alertaRoutes);
app.use(`${appConfig.apiPrefix}/auditoria`, auditoriaRoutes);
app.use(`${appConfig.apiPrefix}/justificativas`, justificativaRoutes);
app.use(`${appConfig.apiPrefix}/dashboard`, dashboardRoutes);
// ==========================================
// TRATAMENTO DE ERROS E ROTAS INEXISTENTES
// ==========================================

// Tratamento para rotas não encontradas (404)
app.use((req, res, next) => {
  next(new AppError(`A rota ${req.originalUrl} não foi encontrada neste servidor.`, 404));
});

// Middleware Global de Erros (Sempre deve ser o último middleware)
app.use(errorHandler);

module.exports = app;