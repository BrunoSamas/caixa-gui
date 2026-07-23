"use client";

import { useState } from "react";
import { 
  Search, 
  X, 
  FileText, 
  Printer, 
  Clock, 
  Lock, 
  Unlock, 
  Calendar,
  AlertCircle
} from "lucide-react";
import { logReportAction } from "@/actions/closing";

interface DailyClosing {
  id: string;
  caixaId: string;
  usuarioId: string;
  data: Date | string;
  abertura: Date | string;
  fechamento?: Date | string | null;
  saldoInicial: number;
  totalEntradas: number;
  totalSaidas: number;
  totalSangrias: number;
  totalSuprimentos: number;
  totalCancelamentos: number;
  totalDinheiro: number;
  totalPix: number;
  totalDebito: number;
  totalCredito: number;
  totalVale: number;
  totalOutros: number;
  saldoEsperado: number;
  saldoInformado: number;
  diferenca: number;
  observacoes?: string | null;
  status: string;
}

interface ClosingHistoryClientProps {
  initialClosings: DailyClosing[];
}

export function ClosingHistoryClient({ initialClosings }: ClosingHistoryClientProps) {
  const [closings] = useState<DailyClosing[]>(initialClosings);

  // Filters state
  const [searchOperator, setSearchOperator] = useState("");
  const [searchRegister, setSearchRegister] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedClosing, setSelectedClosing] = useState<DailyClosing | null>(null);

  // Filter logic
  const filteredClosings = closings.filter((c) => {
    // Filter by Operator
    if (searchOperator && !c.usuarioId.toLowerCase().includes(searchOperator.toLowerCase())) {
      return false;
    }
    // Filter by Caixa / Register
    if (searchRegister && !c.caixaId.toLowerCase().includes(searchRegister.toLowerCase())) {
      return false;
    }
    // Filter by date range
    const cDate = new Date(c.data);
    cDate.setHours(0,0,0,0);

    if (startDate) {
      const sDate = new Date(startDate);
      sDate.setHours(0,0,0,0);
      if (cDate < sDate) return false;
    }
    if (endDate) {
      const eDate = new Date(endDate);
      eDate.setHours(23,59,59,999);
      if (cDate > eDate) return false;
    }

    return true;
  });

  // Open detailed report modal
  const openReport = (c: DailyClosing) => {
    setSelectedClosing(c);
    setIsReportModalOpen(true);
    logReportAction("IMPRESSAO", `Visualizou relatório de fechamento do dia ${new Date(c.data).toLocaleDateString()}`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Painel de Filtros */}
      <div className="rounded-lg border border-border bg-card p-6 no-print">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-100">Filtros de Busca</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          
          <div>
            <label htmlFor="filterOperator" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted">Operador</label>
            <input
              id="filterOperator"
              type="text"
              placeholder="Nome do operador..."
              value={searchOperator}
              onChange={(e) => setSearchOperator(e.target.value)}
              className="w-full rounded border border-border bg-zinc-950 px-3 py-1.5 text-xs text-foreground focus:border-zinc-500 focus:outline-none placeholder:text-zinc-700"
            />
          </div>

          <div>
            <label htmlFor="filterRegister" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted">Caixa</label>
            <input
              id="filterRegister"
              type="text"
              placeholder="Identificação do caixa..."
              value={searchRegister}
              onChange={(e) => setSearchRegister(e.target.value)}
              className="w-full rounded border border-border bg-zinc-950 px-3 py-1.5 text-xs text-foreground focus:border-zinc-500 focus:outline-none placeholder:text-zinc-700"
            />
          </div>

          <div>
            <label htmlFor="filterStartDate" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted">Data Inicial</label>
            <input
              id="filterStartDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded border border-border bg-zinc-950 px-3 py-1.5 text-xs text-foreground focus:border-zinc-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="filterEndDate" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted">Data Final</label>
            <input
              id="filterEndDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded border border-border bg-zinc-950 px-3 py-1.5 text-xs text-foreground focus:border-zinc-500 focus:outline-none"
            />
          </div>

        </div>

        {/* Limpar Filtros */}
        {(searchOperator || searchRegister || startDate || endDate) && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setSearchOperator("");
                setSearchRegister("");
                setStartDate("");
                setEndDate("");
              }}
              className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-red-500 hover:text-red-400"
            >
              <X className="h-3.5 w-3.5" />
              <span>Limpar Filtros</span>
            </button>
          </div>
        )}
      </div>

      {/* Lista de Fechamentos */}
      <div className="rounded-lg border border-border bg-card p-6 no-print">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-500">
          Resultados ({filteredClosings.length})
        </h2>

        {filteredClosings.length === 0 ? (
          <div className="flex h-36 flex-col items-center justify-center rounded border border-dashed border-border bg-zinc-950/50">
            <p className="text-sm text-muted">Nenhum fechamento de caixa encontrado com os filtros atuais.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border font-bold uppercase tracking-wider text-zinc-500">
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Caixa</th>
                  <th className="py-3 px-4">Operador</th>
                  <th className="py-3 px-4 text-right">Inicial</th>
                  <th className="py-3 px-4 text-right">Entradas</th>
                  <th className="py-3 px-4 text-right">Dinheiro Contado</th>
                  <th className="py-3 px-4 text-right">Diferença</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Relatório</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredClosings.map((c) => {
                  const closingDate = new Date(c.data).toLocaleDateString();
                  
                  return (
                    <tr key={c.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-zinc-100 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                        <span>{closingDate}</span>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-300 font-semibold">{c.caixaId}</td>
                      <td className="py-3.5 px-4 text-zinc-300">{c.usuarioId}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-zinc-400">R$ {c.saldoInicial.toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-zinc-300 font-semibold">R$ {c.totalEntradas.toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-zinc-200">
                        {c.status === "CLOSED" ? `R$ ${c.saldoInformado.toFixed(2)}` : "—"}
                      </td>
                      <td className={`py-3.5 px-4 text-right font-mono font-bold ${
                        c.status !== "CLOSED" 
                          ? "text-zinc-500" 
                          : c.diferenca > 0 
                            ? "text-green-500" 
                            : c.diferenca < 0 
                              ? "text-red-500" 
                              : "text-zinc-400"
                      }`}>
                        {c.status !== "CLOSED" 
                          ? "—" 
                          : c.diferenca > 0 
                            ? `+ R$ ${c.diferenca.toFixed(2)}` 
                            : c.diferenca < 0 
                              ? `- R$ ${Math.abs(c.diferenca).toFixed(2)}` 
                              : "R$ 0.00"
                        }
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          c.status === "OPEN" 
                            ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" 
                            : "bg-zinc-950 border-zinc-800 text-zinc-500"
                        }`}>
                          {c.status === "OPEN" ? "Aberto" : "Fechado"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openReport(c)}
                          className="rounded border border-border p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-foreground transition-all"
                          title="Visualizar Relatório de Fechamento"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal do Relatório Imprimível */}
      {isReportModalOpen && selectedClosing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-lg border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in duration-150 my-8">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4 no-print">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100 flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                <span>Relatório Consolidado de Fechamento</span>
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={handlePrint}
                  className="rounded border border-border hover:border-zinc-500 bg-zinc-950 hover:bg-zinc-900 px-3 py-1.5 text-xs font-bold uppercase text-zinc-200 transition-all flex items-center gap-1"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Imprimir / PDF</span>
                </button>
                <button 
                  onClick={() => setIsReportModalOpen(false)}
                  className="rounded text-muted hover:text-foreground hover:bg-zinc-900 p-1.5 focus:outline-none transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Relatório Imprimível */}
            <div id="print-area" className="p-8 bg-white text-zinc-950 rounded shadow-sm font-sans space-y-8 select-all">
              
              <div className="text-center border-b border-zinc-300 pb-4 space-y-1">
                <h1 className="text-xl font-bold uppercase tracking-wider">Relatório de Fechamento do Caixa</h1>
                <p className="text-xs text-zinc-500 uppercase font-semibold">Caixa: {selectedClosing.caixaId} — Operador: {selectedClosing.usuarioId}</p>
                <p className="text-xs text-zinc-400 font-mono">ID Fechamento: {selectedClosing.id}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs border-b border-zinc-200 pb-4">
                <div>
                  <span className="font-bold uppercase text-zinc-500 block text-[10px]">Data do Movimento</span>
                  <span className="font-semibold text-zinc-800 text-[11px]">{new Date(selectedClosing.data).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="font-bold uppercase text-zinc-500 block text-[10px]">Status</span>
                  <span className="font-bold text-zinc-800 text-[11px] uppercase">{selectedClosing.status === "CLOSED" ? "Fechado" : "Aberto"}</span>
                </div>
                <div>
                  <span className="font-bold uppercase text-zinc-500 block text-[10px]">Horário de Abertura</span>
                  <span className="font-mono text-zinc-800 text-[11px]">{new Date(selectedClosing.abertura).toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-bold uppercase text-zinc-500 block text-[10px]">Horário de Fechamento</span>
                  <span className="font-mono text-zinc-800 text-[11px]">
                    {selectedClosing.fechamento ? new Date(selectedClosing.fechamento).toLocaleString() : "—"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase text-zinc-600 border-b border-zinc-200 pb-1">1. Entradas Consolidadas (Vendas)</h3>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 font-bold text-zinc-500 text-[10px]">
                      <th className="pb-1 uppercase">Forma de Pagamento</th>
                      <th className="pb-1 text-right uppercase">Total Recebido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-sans">
                    <tr>
                      <td className="py-1.5 font-semibold text-zinc-700">Dinheiro</td>
                      <td className="py-1.5 text-right font-mono text-zinc-800">R$ {selectedClosing.totalDinheiro.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-semibold text-zinc-700">Pix</td>
                      <td className="py-1.5 text-right font-mono text-zinc-800">R$ {selectedClosing.totalPix.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-semibold text-zinc-700">Cartão Débito</td>
                      <td className="py-1.5 text-right font-mono text-zinc-800">R$ {selectedClosing.totalDebito.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-semibold text-zinc-700">Cartão Crédito</td>
                      <td className="py-1.5 text-right font-mono text-zinc-800">R$ {selectedClosing.totalCredito.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-semibold text-zinc-700">Vale Alimentação / Refeição</td>
                      <td className="py-1.5 text-right font-mono text-zinc-800">R$ {selectedClosing.totalVale.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-semibold text-zinc-700">Outros / Convênio</td>
                      <td className="py-1.5 text-right font-mono text-zinc-800">R$ {selectedClosing.totalOutros.toFixed(2)}</td>
                    </tr>
                    <tr className="font-bold border-t border-zinc-300">
                      <td className="py-2 text-zinc-800 uppercase">Total das Entradas</td>
                      <td className="py-2 text-right font-mono text-zinc-950">R$ {selectedClosing.totalEntradas.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-zinc-600 border-b border-zinc-200 pb-1">2. Fluxo de Caixa Local (Fundo de Troco / Dinheiro)</h3>
                <div className="grid grid-cols-2 gap-6 text-xs font-sans">
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Saldo de Abertura (Fundo):</span>
                      <span className="font-mono text-zinc-800">R$ {selectedClosing.saldoInicial.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600">(+) Total Dinheiro (Entrada):</span>
                      <span className="font-mono text-zinc-800">R$ {selectedClosing.totalDinheiro.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600">(+) Total Suprimentos (Aportes):</span>
                      <span className="font-mono text-zinc-800">R$ {selectedClosing.totalSuprimentos.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-yellow-600">
                      <span>(-) Total Sangrias (Retiradas):</span>
                      <span className="font-mono">R$ {selectedClosing.totalSangrias.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>(-) Total Saídas (Despesas):</span>
                      <span className="font-mono">R$ {selectedClosing.totalSaidas.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="border-l border-zinc-200 pl-6 space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Resumo Cancelamentos</span>
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Total Cancelado hoje:</span>
                      <span className="font-mono text-red-600">R$ {selectedClosing.totalCancelamentos.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded border border-zinc-300 p-4 space-y-2 bg-zinc-50 font-sans text-xs">
                <h3 className="text-xs font-black uppercase text-zinc-800">3. Conciliação de Caixa (Dinheiro Contado)</h3>
                <div className="grid grid-cols-3 gap-2 py-2">
                  <div>
                    <span className="text-zinc-500 uppercase text-[9px] block">Saldo Esperado em Caixa</span>
                    <span className="font-mono font-bold text-zinc-800 text-[13px]">R$ {selectedClosing.saldoEsperado.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 uppercase text-[9px] block">Saldo Contado em Dinheiro</span>
                    <span className="font-mono font-bold text-zinc-800 text-[13px]">R$ {selectedClosing.saldoInformado.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 uppercase text-[9px] block">Diferença</span>
                    <span className={`font-mono font-black text-[13px] ${
                      selectedClosing.diferenca > 0 
                        ? "text-green-600" 
                        : selectedClosing.diferenca < 0 
                          ? "text-red-600" 
                          : "text-zinc-500"
                    }`}>
                      {selectedClosing.diferenca > 0 
                        ? `Sobra: + R$ ${selectedClosing.diferenca.toFixed(2)}` 
                        : selectedClosing.diferenca < 0 
                          ? `Falta: - R$ ${Math.abs(selectedClosing.diferenca).toFixed(2)}` 
                          : "R$ 0.00"
                      }
                    </span>
                  </div>
                </div>
              </div>

              {selectedClosing.observacoes && (
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-zinc-500 uppercase text-[10px]">Observações / Justificativas</span>
                  <p className="text-zinc-700 bg-zinc-50 border border-zinc-200 rounded p-3 font-sans italic">{selectedClosing.observacoes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                <div className="space-y-4">
                  <div className="border-t border-zinc-400 mx-auto w-3/4 pt-2"></div>
                  <span className="font-bold text-zinc-500 uppercase text-[9px]">Operador do Caixa</span>
                  <p className="font-semibold text-zinc-800 mt-1">{selectedClosing.usuarioId}</p>
                </div>
                <div className="space-y-4">
                  <div className="border-t border-zinc-400 mx-auto w-3/4 pt-2"></div>
                  <span className="font-bold text-zinc-500 uppercase text-[9px]">Gerência / Responsável</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
