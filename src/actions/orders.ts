"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createOrder(clientName: string) {
  if (!clientName.trim()) {
    throw new Error("O nome do cliente é obrigatório.");
  }

  try {
    const order = await prisma.customerOrder.create({
      data: {
        clientName: clientName.trim(),
        status: "OPEN",
      },
    });

    revalidatePath("/");
    return order;
  } catch (error) {
    console.error("Error in createOrder:", error);
    throw new Error("Erro ao abrir comanda.");
  }
}

export async function addItemToOrder(orderId: string, productId: string, quantity: number) {
  if (quantity <= 0 || isNaN(quantity)) {
    throw new Error("A quantidade deve ser maior que zero.");
  }

  try {
    // Verify product exists to capture its current price
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error("Produto não encontrado.");
    }

    // Verify order exists and is open
    const order = await prisma.customerOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error("Comanda não encontrada.");
    }

    if (order.status !== "OPEN") {
      throw new Error("Não é possível adicionar itens a uma comanda fechada.");
    }

    // Check if the item is already in this order to accumulate quantity
    const existingLine = await prisma.orderLine.findFirst({
      where: {
        customerOrderId: orderId,
        productId: productId,
      },
    });

    if (existingLine) {
      await prisma.orderLine.update({
        where: { id: existingLine.id },
        data: {
          quantity: existingLine.quantity + quantity,
          unitPrice: product.price, // Update unit price to current price
        },
      });
    } else {
      await prisma.orderLine.create({
        data: {
          customerOrderId: orderId,
          productId: productId,
          quantity: quantity,
          unitPrice: product.price,
        },
      });
    }

    revalidatePath("/");
  } catch (error) {
    console.error("Error in addItemToOrder:", error);
    throw new Error("Erro ao adicionar item à comanda.");
  }
}

export async function closeOrder(orderId: string) {
  try {
    const order = await prisma.customerOrder.update({
      where: { id: orderId },
      data: {
        status: "CLOSED",
      },
    });

    revalidatePath("/");
    return order;
  } catch (error) {
    console.error("Error in closeOrder:", error);
    throw new Error("Erro ao fechar comanda.");
  }
}

export async function deleteOrder(orderId: string) {
  try {
    await prisma.customerOrder.delete({
      where: { id: orderId },
    });

    revalidatePath("/");
  } catch (error) {
    console.error("Error in deleteOrder:", error);
    throw new Error("Erro ao excluir comanda.");
  }
}
