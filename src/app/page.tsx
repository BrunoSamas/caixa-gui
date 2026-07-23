import { Header } from "@/components/Header";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Fetch products for dropdown selection in the consumption modal
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
  });

  // Fetch orders, including line items and product details for display
  const orders = await prisma.customerOrder.findMany({
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <DashboardClient initialProducts={products} initialOrders={orders} />
      </main>
    </div>
  );
}
