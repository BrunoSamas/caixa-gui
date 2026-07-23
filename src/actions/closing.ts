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

export async function closeDia(operatorName: string) {
  if (!operatorName.trim()) {
    throw new Error("O nome do operador responsável é obrigatório.");
  }

  try {
    const { start, end } = getTodayBounds();

    // Check if today is already closed
    const existing = await prisma.dailyClosing.findUnique({
      where: { data: start },
    });

    if (existing) {
      throw new Error("O dia de hoje já foi fechado.");
    }

    // Fetch all comandas created today
    const orders = await prisma.customerOrder.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        items: true,
      },
    });

    let totalComandas = orders.length;
    let totalVendido = 0;
    let totalPendente = 0;
    
    let totalDinheiro = 0;
    let totalPix = 0;
    let totalDebito = 0;
    let totalCredito = 0;
    let totalOutros = 0;

    const unpaidClients: { name: string; id: string; amount: number }[] = [];

    orders.forEach((order) => {
      const orderTotal = order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      totalVendido += orderTotal;

      if (order.status === "OPEN") {
        totalPendente += orderTotal;
        unpaidClients.push({
          name: order.clientName,
          id: order.id,
          amount: orderTotal,
        });
      } else if (order.status === "CLOSED") {
        const method = (order.paymentMethod || "OUTROS").toUpperCase();
        if (method === "DINHEIRO") totalDinheiro += orderTotal;
        else if (method === "PIX") totalPix += orderTotal;
        else if (method === "DEBITO") totalDebito += orderTotal;
        else if (method === "CREDITO") totalCredito += orderTotal;
        else totalOutros += orderTotal;
      }
    });

    const closing = await prisma.dailyClosing.create({
      data: {
        data: start,
        fechamento: new Date(),
        usuarioId: operatorName.trim(),
        totalComandas,
        totalVendido,
        totalPendente,
        totalDinheiro,
        totalPix,
        totalDebito,
        totalCredito,
        totalOutros,
        unpaidClientsJson: JSON.stringify(unpaidClients),
      },
    });

    revalidatePath("/");
    return closing;
  } catch (error: any) {
    console.error("Error in closeDia:", error);
    throw new Error(error.message || "Erro ao fechar o dia.");
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
