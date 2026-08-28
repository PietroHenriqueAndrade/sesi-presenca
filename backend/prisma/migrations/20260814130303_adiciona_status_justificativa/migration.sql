-- CreateEnum
CREATE TYPE "StatusJustificativa" AS ENUM ('PENDENTE', 'APROVADO', 'REJEITADO');

-- AlterTable
ALTER TABLE "justificativas" ADD COLUMN     "status" "StatusJustificativa" NOT NULL DEFAULT 'PENDENTE';
