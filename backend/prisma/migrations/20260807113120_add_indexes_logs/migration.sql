-- CreateIndex
CREATE INDEX "alertas_aluno_id_idx" ON "alertas"("aluno_id");

-- CreateIndex
CREATE INDEX "audit_logs_usuario_id_idx" ON "audit_logs"("usuario_id");

-- CreateIndex
CREATE INDEX "audit_logs_criado_em_idx" ON "audit_logs"("criado_em");

-- CreateIndex
CREATE INDEX "ia_logs_aluno_id_idx" ON "ia_logs"("aluno_id");

-- CreateIndex
CREATE INDEX "ia_logs_turma_id_idx" ON "ia_logs"("turma_id");
