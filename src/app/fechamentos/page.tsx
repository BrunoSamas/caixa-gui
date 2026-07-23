import { Header } from "@/components/Header";
import { getDailyClosings } from "@/actions/closing";
import { ClosingHistoryClient } from "./ClosingHistoryClient";

export const dynamic = "force-dynamic";

export default async function FechamentosPage() {
  const closings = await getDailyClosings();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 uppercase">Histórico de Fechamentos</h1>
          <p className="text-sm text-muted">Consulte, visualize relatórios e audite os fechamentos de caixa anteriores.</p>
        </div>
        <ClosingHistoryClient initialClosings={closings as any} />
      </main>
    </div>
  );
}
