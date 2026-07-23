-- CreateTable
CREATE TABLE "transacoes_caixa" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transacoes_caixa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fechamentos_caixa" (
    "id" TEXT NOT NULL,
    "caixa_id" TEXT NOT NULL DEFAULT 'Principal',
    "usuario_id" TEXT NOT NULL DEFAULT 'Operador Padrão',
    "data" TIMESTAMP(3) NOT NULL,
    "abertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechamento" TIMESTAMP(3),
    "saldo_inicial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_entradas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_saidas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_sangrias" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_suprimentos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_cancelamentos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_dinheiro" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_pix" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_debito" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_credito" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_vale" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_outros" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldo_esperado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldo_informado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "diferenca" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fechamentos_caixa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_auditoria" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL DEFAULT 'Operador Padrão',
    "acao" TEXT NOT NULL,
    "data_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "detalhes" TEXT,

    CONSTRAINT "logs_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fechamentos_caixa_data_key" ON "fechamentos_caixa"("data");
