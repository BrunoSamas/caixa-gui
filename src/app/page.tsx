import { Header } from "@/components/Header";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./DashboardClient";
import { getTodayClosing } from "@/actions/closing";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Fetch products for dropdown selection in the consumption modal
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
  });

  // Fetch orders: all OPEN orders, plus CLOSED orders created today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const orders = await prisma.customerOrder.findMany({
    where: {
      OR: [
        { status: "OPEN" },
        {
          status: "CLOSED",
          createdAt: {
            gte: todayStart,
          },
        },
      ],
    },
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

  // Fetch today's closing status
  const closing = await getTodayClosing();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <DashboardClient 
          initialProducts={products} 
          initialOrders={orders} 
          initialClosing={closing as any}
        />
      </main>
    </div>
  );
}
