/*
  Warnings:

  - You are about to drop the column `face_id` on the `alunos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "alunos" DROP COLUMN "face_id";

-- CreateIndex
CREATE INDEX "presencas_turma_id_data_hora_idx" ON "presencas"("turma_id", "data_hora");

-- CreateIndex
CREATE INDEX "presencas_status_idx" ON "presencas"("status");
