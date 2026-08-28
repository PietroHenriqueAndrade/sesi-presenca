-- Production readiness: schema object already used by the application but
-- missing from the versioned migration history.
--
-- IF NOT EXISTS is intentional: older TCC installations may already have this
-- exact table because they were provisioned with `prisma db push`. This lets
-- `prisma migrate deploy` adopt the versioned migration without failing only
-- because the object already exists.
CREATE TABLE IF NOT EXISTS "biometric_second_factors" (
    "id" TEXT NOT NULL,
    "aluno_id" TEXT NOT NULL,
    "codigo_hash" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "biometric_second_factors_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "biometric_second_factors_aluno_id_key"
ON "biometric_second_factors"("aluno_id");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'biometric_second_factors_aluno_id_fkey'
          AND conrelid = 'biometric_second_factors'::regclass
    ) THEN
        ALTER TABLE "biometric_second_factors"
        ADD CONSTRAINT "biometric_second_factors_aluno_id_fkey"
        FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
