import { Header } from "@/components/Header";
import { getProducts } from "@/actions/products";
import { ProductListClient } from "./ProductListClient";

export const dynamic = "force-dynamic";

export default async function ProdutosPage() {
  const initialProducts = await getProducts();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 uppercase">Produtos</h1>
          <p className="text-sm text-muted">Cadastre e gerencie os itens do cardápio do seu restaurante ou bar.</p>
        </div>
        <ProductListClient initialProducts={initialProducts} />
      </main>
    </div>
  );
}
