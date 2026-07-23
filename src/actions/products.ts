"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getProducts() {
  try {
    return await prisma.product.findMany({
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Error in getProducts:", error);
    throw new Error("Erro ao buscar produtos.");
  }
}

export async function createProduct(name: string, price: number) {
  if (!name.trim()) {
    throw new Error("O nome do produto é obrigatório.");
  }
  if (isNaN(price) || price <= 0) {
    throw new Error("O preço deve ser maior que zero.");
  }

  try {
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        price,
      },
    });

    revalidatePath("/produtos");
    revalidatePath("/");
    return product;
  } catch (error) {
    console.error("Error in createProduct:", error);
    throw new Error("Erro ao criar produto.");
  }
}

export async function updateProduct(id: string, name: string, price: number) {
  if (!name.trim()) {
    throw new Error("O nome do produto é obrigatório.");
  }
  if (isNaN(price) || price <= 0) {
    throw new Error("O preço deve ser maior que zero.");
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: name.trim(),
        price,
      },
    });

    revalidatePath("/produtos");
    revalidatePath("/");
    return product;
  } catch (error) {
    console.error("Error in updateProduct:", error);
    throw new Error("Erro ao atualizar produto.");
  }
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({
      where: { id },
    });

    revalidatePath("/produtos");
    revalidatePath("/");
  } catch (error) {
    console.error("Error in deleteProduct:", error);
    throw new Error("Erro ao excluir produto. Verifique se ele está vinculado a alguma comanda.");
  }
}
