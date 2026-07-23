"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Helper to get local start and end of today
function getTodayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

export async function getTodayClosing() {
  try {
    const { start } = getTodayBounds();
    return await prisma.dailyClosing.findUnique({
      where: { data: start },
    });
  } catch (error) {
    console.error("Error in getTodayClosing:", error);
    return null;
  }
}

export async function openCaixa(saldoInicial: number, operatorName: string, registerName: string) {
  if (saldoInicial < 0 || isNaN(saldoInicial)) {
    throw new Error("O saldo inicial deve ser maior ou igual a zero.");
  }
  if (!operatorName.trim()) {
    throw new Error("O nome do operador é obrigatório.");
  }

  try {
    const { start } = getTodayBounds();

    // Check if closing already exists for today
    const existing = await prisma.dailyClosing.findUnique({
      where: { data: start },
    });

    if (existing) {
      throw new Error("Já existe um registro de caixa para a data atual.");
    }

    const closing = await prisma.dailyClosing.create({
      data: {
        data: start,
        abertura: new Date(),
        saldoInicial,
        usuarioId: operatorName.trim(),
        caixaId: registerName.trim() || "Principal",
        status: "OPEN",
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        usuarioId: operatorName.trim(),
        acao: "ABERTURA",
        detalhes: `Caixa "${registerName.trim() || "Principal"}" aberto com saldo inicial de R$ ${saldoInicial.toFixed(2)}`,
      },
    });

    revalidatePath("/");
    return closing;
  } catch (error: any) {
    console.error("Error in openCaixa:", error);
    throw new Error(error.message || "Erro ao abrir o caixa.");
  }
}

export async function createCashTransaction(type: string, amount: number, description: string) {
  if (!["SUPRIMENTO", "SANGRIA", "SAIDA"].includes(type)) {
    throw new Error("Tipo de transação inválido.");
  }
  if (amount <= 0 || isNaN(amount)) {
    throw new Error("O valor da transação deve ser maior que zero.");
  }
  if (!description.trim()) {
    throw new Error("A descrição da transação é obrigatória.");
  }

  // Check if today's caixa is closed
  const closing = await getTodayClosing();
  if (!closing) {
    throw new Error("O caixa do dia atual não está aberto.");
  }
  if (closing.status === "CLOSED") {
    throw new Error("O caixa do dia atual está fechado. Movimentação bloqueada.");
  }

  try {
    const transaction = await prisma.cashTransaction.create({
      data: {
        type,
        amount,
        description: description.trim(),
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        usuarioId: closing.usuarioId,
        acao: "ALTERACAO",
        detalhes: `Transação de ${type} registrada: R$ ${amount.toFixed(2)} (${description.trim()})`,
      },
    });

    revalidatePath("/");
    return transaction;
  } catch (error: any) {
    console.error("Error in createCashTransaction:", error);
    throw new Error(error.message || "Erro ao criar transação de caixa.");
  }
}

export async function getCashTransactionsForToday() {
  try {
    const { start, end } = getTodayBounds();
    return await prisma.cashTransaction.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    console.error("Error in getCashTransactionsForToday:", error);
    return [];
  }
}

export async function closeCaixa(closingId: string, saldoInformado: number, observacoes: string) {
  if (saldoInformado < 0 || isNaN(saldoInformado)) {
    throw new Error("O valor informado deve ser maior ou igual a zero.");
  }

  const closing = await prisma.dailyClosing.findUnique({
    where: { id: closingId },
  });

  if (!closing) {
    throw new Error("Registro de caixa não encontrado.");
  }

  if (closing.status === "CLOSED") {
    throw new Error("Este caixa já está fechado.");
  }

  try {
    const { start, end } = getTodayBounds();

    // 1. Fetch all today's closed orders
    const closedOrders = await prisma.customerOrder.findMany({
      where: {
        status: "CLOSED",
        createdAt: { gte: start, lte: end },
      },
      include: {
        items: true,
      },
    });

    // 2. Fetch all today's cancelled orders
    const cancelledOrders = await prisma.customerOrder.findMany({
      where: {
        status: "CANCELLED",
        createdAt: { gte: start, lte: end },
      },
      include: {
        items: true,
      },
    });

    // 3. Fetch all today's cash transactions
    const transactions = await prisma.cashTransaction.findMany({
      where: {
        createdAt: { gte: start, lte: end },
      },
    });

    // Calculations
    let totalDinheiro = 0;
    let totalPix = 0;
    let totalDebito = 0;
    let totalCredito = 0;
    let totalVale = 0;
    let totalOutros = 0;
    let totalEntradas = 0;

    closedOrders.forEach((order) => {
      const orderTotal = order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      totalEntradas += orderTotal;

      const method = (order.paymentMethod || "OUTROS").toUpperCase();
      if (method === "DINHEIRO") totalDinheiro += orderTotal;
      else if (method === "PIX") totalPix += orderTotal;
      else if (method === "DEBITO") totalDebito += orderTotal;
      else if (method === "CREDITO") totalCredito += orderTotal;
      else if (method === "VALE") totalVale += orderTotal;
      else totalOutros += orderTotal;
    });

    const totalCancelamentos = cancelledOrders.reduce((sum, order) => {
      const orderTotal = order.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
      return sum + orderTotal;
    }, 0);

    let totalSuprimentos = 0;
    let totalSangrias = 0;
    let totalSaidas = 0;

    transactions.forEach((tx) => {
      if (tx.type === "SUPRIMENTO") totalSuprimentos += tx.amount;
      else if (tx.type === "SANGRIA") totalSangrias += tx.amount;
      else if (tx.type === "SAIDA") totalSaidas += tx.amount;
    });

    // Saldo esperado em dinheiro = inicial + dinheiro entrado + suprimentos - sangrias - saídas
    const saldoEsperado = closing.saldoInicial + totalDinheiro + totalSuprimentos - totalSangrias - totalSaidas;
    const diferenca = saldoInformado - saldoEsperado;

    const updatedClosing = await prisma.dailyClosing.update({
      where: { id: closingId },
      data: {
        status: "CLOSED",
        fechamento: new Date(),
        totalEntradas,
        totalSaidas,
        totalSangrias,
        totalSuprimentos,
        totalCancelamentos,
        totalDinheiro,
        totalPix,
        totalDebito,
        totalCredito,
        totalVale,
        totalOutros,
        saldoEsperado,
        saldoInformado,
        diferenca,
        observacoes: observacoes.trim() || null,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        usuarioId: closing.usuarioId,
        acao: "FECHAMENTO",
        detalhes: `Caixa fechado. Saldo esperado: R$ ${saldoEsperado.toFixed(2)}, Informado: R$ ${saldoInformado.toFixed(2)}, Diferença: R$ ${diferenca.toFixed(2)}`,
      },
    });

    revalidatePath("/");
    return updatedClosing;
  } catch (error: any) {
    console.error("Error in closeCaixa:", error);
    throw new Error(error.message || "Erro ao fechar o caixa.");
  }
}

export async function reopenCaixa(closingId: string, motivo: string) {
  if (!motivo.trim()) {
    throw new Error("O motivo da reabertura é obrigatório.");
  }

  const closing = await prisma.dailyClosing.findUnique({
    where: { id: closingId },
  });

  if (!closing) {
    throw new Error("Registro de caixa não encontrado.");
  }

  if (closing.status === "OPEN") {
    throw new Error("Este caixa já está aberto.");
  }

  try {
    const updated = await prisma.dailyClosing.update({
      where: { id: closingId },
      data: {
        status: "OPEN",
        fechamento: null,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        usuarioId: "Administrador",
        acao: "REABERTURA",
        detalhes: `Caixa do dia ${closing.data.toLocaleDateString()} reaberto. Motivo: ${motivo.trim()}`,
      },
    });

    revalidatePath("/");
    return updated;
  } catch (error: any) {
    console.error("Error in reopenCaixa:", error);
    throw new Error(error.message || "Erro ao reabrir o caixa.");
  }
}

export async function getDailyClosings() {
  try {
    return await prisma.dailyClosing.findMany({
      orderBy: {
        data: "desc",
      },
    });
  } catch (error) {
    console.error("Error in getDailyClosings:", error);
    return [];
  }
}

export async function getAuditLogs() {
  try {
    return await prisma.auditLog.findMany({
      orderBy: {
        dataHora: "desc",
      },
      take: 100, // Limit to last 100 entries
    });
  } catch (error) {
    console.error("Error in getAuditLogs:", error);
    return [];
  }
}

export async function logReportAction(action: "IMPRESSAO" | "EXCLUSAO" | "ALTERACAO", details: string) {
  try {
    await prisma.auditLog.create({
      data: {
        usuarioId: "Operador",
        acao: action,
        detalhes: details,
      },
    });
  } catch (error) {
    console.error("Error in logReportAction:", error);
  }
}
