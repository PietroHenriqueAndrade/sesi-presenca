/*
  Warnings:

  - A unique constraint covering the columns `[aluno_id,turma_id,data]` on the table `presencas` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "presencas_aluno_id_data_hora_idx";

-- AlterTable
ALTER TABLE "presencas" ADD COLUMN     "data" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "jwt_blacklist" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jwt_blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jwt_blacklist_token_key" ON "jwt_blacklist"("token");

-- CreateIndex
CREATE INDEX "presencas_aluno_id_data_idx" ON "presencas"("aluno_id", "data");

-- CreateIndex
CREATE UNIQUE INDEX "presencas_aluno_id_turma_id_data_key" ON "presencas"("aluno_id", "turma_id", "data");
