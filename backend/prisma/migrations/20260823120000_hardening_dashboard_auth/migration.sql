ALTER TABLE "usuarios" ADD COLUMN "token_version" INTEGER NOT NULL DEFAULT 0;

-- Security / recovery support
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "usado_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");
CREATE INDEX "password_reset_tokens_usuario_id_expires_at_idx" ON "password_reset_tokens"("usuario_id", "expires_at");
CREATE INDEX "jwt_blacklist_expires_at_idx" ON "jwt_blacklist"("expires_at");

-- Query indexes used by terminal, reports and future React dashboard
CREATE INDEX "turmas_alunos_turma_id_ativo_idx" ON "turmas_alunos"("turma_id", "ativo");
CREATE INDEX "horarios_turma_id_dia_semana_ativo_idx" ON "horarios"("turma_id", "dia_semana", "ativo");
CREATE INDEX "presencas_data_idx" ON "presencas"("data");
CREATE INDEX "presencas_turma_id_data_idx" ON "presencas"("turma_id", "data");
CREATE INDEX "justificativas_status_criado_em_idx" ON "justificativas"("status", "criado_em");

ALTER TABLE "password_reset_tokens"
ADD CONSTRAINT "password_reset_tokens_usuario_id_fkey"
FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
