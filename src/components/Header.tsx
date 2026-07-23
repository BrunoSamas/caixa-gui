import Link from "next/link";
import { LayoutDashboard, Package, FileText } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-border bg-card py-4 px-6 no-print">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link 
          href="/" 
          className="flex items-center gap-2 font-sans text-xl font-bold tracking-wider uppercase text-foreground"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded border border-border bg-zinc-950 font-mono text-lg font-black text-zinc-100">
            CG
          </div>
          <span>Caixa do Gui</span>
        </Link>
        <nav className="flex gap-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted hover:text-foreground transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Caixa</span>
          </Link>
          <Link
            href="/produtos"
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted hover:text-foreground transition-colors"
          >
            <Package className="h-4 w-4" />
            <span>Produtos</span>
          </Link>
          <Link
            href="/fechamentos"
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted hover:text-foreground transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span>Fechamentos</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
