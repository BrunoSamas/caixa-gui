"use client";

import { useState } from "react";
import { 
  Search, 
  X, 
  FileText, 
  Printer, 
  Calendar,
  User
} from "lucide-react";

interface DailyClosing {
  id: string;
  data: Date | string;
  fechamento: Date | string;
  usuarioId: string;
  totalComandas: number;
  totalVendido: number;
  totalPendente: number;
  totalDinheiro: number;
  totalPix: number;
  totalDebito: number;
  totalCredito: number;
  totalOutros: number;
  unpaidClientsJson: string;
}

interface ClosingHistoryClientProps {
  initialClosings: DailyClosing[];
}

export function ClosingHistoryClient({ initialClosings }: ClosingHistoryClientProps) {
  const [closings] = useState<DailyClosing[]>(initialClosings);

  // Filters state
  const [searchOperator, setSearchOperator] = useState("");
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
  };

  const handlePrint = () => {
    window.print();
  };

  // Parse unpaid clients for the modal display
  let unpaidClientsList: { name: string; id: string; amount: number }[] = [];
  if (selectedClosing) {
    try {
      unpaidClientsList = JSON.parse(selectedClosing.unpaidClientsJson);
    } catch (e) {
      unpaidClientsList = [];
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Painel de Filtros */}
      <div className="rounded-lg border border-border bg-card p-6 no-print">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-100">Filtros de Busca</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          
          <div>
            <label htmlFor="filterOperator" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted">Responsável</label>
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
        {(searchOperator || startDate || endDate) && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setSearchOperator("");
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
          Fechamentos de Dia ({filteredClosings.length})
        </h2>

        {filteredClosings.length === 0 ? (
          <div className="flex h-36 flex-col items-center justify-center rounded border border-dashed border-border bg-zinc-950/50">
            <p className="text-sm text-muted">Nenhum fechamento encontrado com os filtros atuais.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border font-bold uppercase tracking-wider text-zinc-500">
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Responsável</th>
                  <th className="py-3 px-4 text-center">Qtd Comandas</th>
                  <th className="py-3 px-4 text-right">Total Vendido</th>
                  <th className="py-3 px-4 text-right">Total Pendente</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
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
                      <td className="py-3.5 px-4 text-zinc-300 font-semibold">{c.usuarioId}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-zinc-300">{c.totalComandas}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-zinc-200 font-bold">R$ {c.totalVendido.toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-red-400 font-semibold">R$ {c.totalPendente.toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex rounded-full border bg-zinc-950 border-zinc-800 px-2 py-0.5 text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                          Fechado
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
                <h1 className="text-xl font-bold uppercase tracking-wider text-zinc-900">Relatório de Fechamento do Dia</h1>
                <p className="text-xs text-zinc-500 uppercase font-semibold">Operador Responsável: {selectedClosing.usuarioId}</p>
                <p className="text-xs text-zinc-400 font-mono">ID Fechamento: {selectedClosing.id}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs border-b border-zinc-200 pb-4">
                <div>
                  <span className="font-bold uppercase text-zinc-400 block text-[10px]">Data do Movimento</span>
                  <span className="font-bold text-zinc-800 text-[11px]">{new Date(selectedClosing.data).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="font-bold uppercase text-zinc-400 block text-[10px]">Horário do Fechamento</span>
                  <span className="font-mono text-zinc-800 text-[11px]">{new Date(selectedClosing.fechamento).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <h3 className="text-xs font-black uppercase text-zinc-500 border-b border-zinc-200 pb-1">Resumo do Movimento</h3>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-600">Quantidade de Comandas:</span>
                  <span className="font-bold text-zinc-800">{selectedClosing.totalComandas}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-600">Valor Bruto Total Vendido:</span>
                  <span className="font-bold font-mono text-zinc-900">R$ {selectedClosing.totalVendido.toFixed(2)}</span>
                </div>
              </div>

              {/* Clientes que ainda não pagaram */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase text-red-500 border-b border-zinc-200 pb-1">Clientes que ainda não pagaram</h3>
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-zinc-200 font-bold text-zinc-500 text-[10px]">
                      <th className="pb-1 uppercase">Nome do Cliente</th>
                      <th className="pb-1 uppercase">Comanda ID</th>
                      <th className="pb-1 text-right uppercase">Valor Pendente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-700">
                    {unpaidClientsList.map((client) => (
                      <tr key={client.id}>
                        <td className="py-1.5 font-semibold">{client.name}</td>
                        <td className="py-1.5 font-mono text-[10px] text-zinc-500">{client.id.substring(0, 8)}...</td>
                        <td className="py-1.5 text-right font-mono text-zinc-800">R$ {client.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                    {unpaidClientsList.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-3 text-center text-zinc-400 italic">Todos os clientes pagaram. Nenhum pendente.</td>
                      </tr>
                    )}
                    <tr className="font-bold border-t border-zinc-300">
                      <td colSpan={2} className="py-2 text-zinc-800 uppercase">Total Pendente a Receber</td>
                      <td className="py-2 text-right font-mono text-red-600">R$ {selectedClosing.totalPendente.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Formas de pagamento */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase text-zinc-600 border-b border-zinc-200 pb-1">Formas de Pagamento (Recebido)</h3>
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-zinc-200 font-bold text-zinc-500 text-[10px]">
                      <th className="pb-1 uppercase">Forma de Pagamento</th>
                      <th className="pb-1 text-right uppercase">Valor Recebido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-700">
                    <tr>
                      <td className="py-1.5">Dinheiro</td>
                      <td className="py-1.5 text-right font-mono">R$ {selectedClosing.totalDinheiro.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5">PIX</td>
                      <td className="py-1.5 text-right font-mono">R$ {selectedClosing.totalPix.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5">Cartão de Débito</td>
                      <td className="py-1.5 text-right font-mono">R$ {selectedClosing.totalDebito.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5">Cartão de Crédito</td>
                      <td className="py-1.5 text-right font-mono">R$ {selectedClosing.totalCredito.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5">Outros</td>
                      <td className="py-1.5 text-right font-mono">R$ {selectedClosing.totalOutros.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-12 text-center text-xs">
                <div className="space-y-4">
                  <div className="border-t border-zinc-400 mx-auto w-3/4 pt-2"></div>
                  <span className="font-bold text-zinc-400 uppercase text-[9px]">Operador do Caixa</span>
                  <p className="font-semibold text-zinc-800 mt-1">{selectedClosing.usuarioId}</p>
                </div>
                <div className="space-y-4">
                  <div className="border-t border-zinc-400 mx-auto w-3/4 pt-2"></div>
                  <span className="font-bold text-zinc-400 uppercase text-[9px]">Responsável</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
