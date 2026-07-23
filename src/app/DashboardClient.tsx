"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Trash2, 
  CheckCircle, 
  UserPlus, 
  Clock, 
  X, 
  Loader2, 
  UtensilsCrossed, 
  DollarSign,
  TrendingUp,
  Receipt,
  Search,
  Lock,
  Unlock,
  AlertCircle,
  Printer,
  FileText
} from "lucide-react";
import { 
  createOrder, 
  addItemToOrder, 
  closeOrder, 
  deleteOrder,
  updateOrderLineQuantity,
  deleteOrderLine,
  cancelOrder
} from "@/actions/orders";
import { 
  openCaixa, 
  createCashTransaction, 
  closeCaixa, 
  reopenCaixa,
  logReportAction
} from "@/actions/closing";

interface Product {
  id: string;
  name: string;
  price: number;
}

interface OrderLine {
  id: string;
  quantity: number;
  unitPrice: number;
  productId: string;
  product: Product;
}

interface CustomerOrder {
  id: string;
  clientName: string;
  status: string;
  paymentMethod?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  items: OrderLine[];
}

interface CashTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: Date | string;
}

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

interface DashboardClientProps {
  initialProducts: Product[];
  initialOrders: any[];
  initialClosing: DailyClosing | null;
  initialTransactions: CashTransaction[];
}

export function DashboardClient({ 
  initialProducts, 
  initialOrders, 
  initialClosing, 
  initialTransactions 
}: DashboardClientProps) {
  const router = useRouter();
  
  // States
  const [orders, setOrders] = useState<CustomerOrder[]>(initialOrders);
  const [products] = useState<Product[]>(initialProducts);
  const [closing, setClosing] = useState<DailyClosing | null>(initialClosing);
  const [transactions, setTransactions] = useState<CashTransaction[]>(initialTransactions);

  // Search input query
  const [searchQuery, setSearchQuery] = useState("");

  // Tab: "open" (Active) or "closed" (History)
  const [activeTab, setActiveTab] = useState<"open" | "closed">("open");

  // Abertura Form State
  const [openSaldoInicial, setOpenSaldoInicial] = useState("");
  const [openOperatorName, setOpenOperatorName] = useState("Operador Padrão");
  const [openRegisterName, setOpenRegisterName] = useState("Principal");
  const [openLoading, setOpenLoading] = useState(false);
  const [openError, setOpenError] = useState("");

  // New Order Form State
  const [clientName, setClientName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Consumption Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // Checkout Modal State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutOrderId, setCheckoutOrderId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Transaction Form State
  const [txType, setTxType] = useState("SANGRIA");
  const [txAmount, setTxAmount] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState("");

  // Close Caixa Conference Modal State
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [countedCash, setCountedCash] = useState("");
  const [closeRemarks, setCloseRemarks] = useState("");
  const [closeLoading, setCloseLoading] = useState(false);
  const [closeError, setCloseError] = useState("");

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportClosing, setReportClosing] = useState<DailyClosing | null>(null);

  // Reopen Modal State
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [reopenLoading, setReopenLoading] = useState(false);
  const [reopenError, setReopenError] = useState("");

  // Action states
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState("");

  // Sync state from server
  useEffect(() => {
    setOrders(initialOrders);
    setClosing(initialClosing);
    setTransactions(initialTransactions);
  }, [initialOrders, initialClosing, initialTransactions]);

  const isReadOnly = closing?.status === "CLOSED";

  // Handle Abertura
  const handleOpenCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    const saldo = parseFloat(openSaldoInicial) || 0;
    if (saldo < 0) {
      setOpenError("O saldo inicial não pode ser negativo.");
      return;
    }
    if (!openOperatorName.trim()) {
      setOpenError("O operador é obrigatório.");
      return;
    }

    setOpenLoading(true);
    setOpenError("");
    try {
      await openCaixa(saldo, openOperatorName, openRegisterName);
      router.refresh();
    } catch (err: any) {
      setOpenError(err.message || "Erro ao abrir o caixa.");
    } finally {
      setOpenLoading(false);
    }
  };

  // Open a new comanda
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!clientName.trim()) {
      setCreateError("O nome do cliente é obrigatório.");
      return;
    }

    setCreateLoading(true);
    setCreateError("");
    setGlobalError("");

    try {
      await createOrder(clientName);
      setClientName("");
      router.refresh();
    } catch (err: any) {
      setCreateError(err.message || "Erro ao abrir comanda.");
    } finally {
      setCreateLoading(false);
    }
  };

  // Open Checkout Modal
  const openCheckoutModal = (orderId: string) => {
    if (isReadOnly) return;
    setCheckoutOrderId(orderId);
    setPaymentMethod("PIX");
    setGlobalError("");
    setIsCheckoutModalOpen(true);
  };

  // Confirm Checkout
  const handleConfirmCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || !checkoutOrderId) return;

    setCheckoutLoading(true);
    setGlobalError("");

    try {
      await closeOrder(checkoutOrderId, paymentMethod);
      setIsCheckoutModalOpen(false);
      setCheckoutOrderId(null);
      router.refresh();
    } catch (err: any) {
      setGlobalError(err.message || "Erro ao fechar comanda.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Cancel order (open comanda) instead of delete
  const handleCancelOrder = async (id: string) => {
    if (isReadOnly) return;
    if (!confirm("Tem certeza que deseja CANCELAR esta comanda? Os itens e o valor acumulado serão arquivados como cancelamento.")) {
      return;
    }

    setGlobalError("");
    try {
      await cancelOrder(id);
      router.refresh();
    } catch (err: any) {
      setGlobalError(err.message || "Erro ao cancelar comanda.");
    }
  };

  // Delete comanda registry (from history)
  const handleDeleteOrder = async (id: string) => {
    if (isReadOnly) return;
    if (!confirm("Excluir definitivamente esta comanda do histórico?")) {
      return;
    }

    setDeleteLoadingId(id);
    setGlobalError("");

    try {
      await deleteOrder(id);
      router.refresh();
    } catch (err: any) {
      setGlobalError(err.message || "Erro ao excluir comanda.");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  // Update item quantity
  const handleUpdateItemQuantity = async (lineId: string, newQty: number) => {
    if (isReadOnly) return;
    if (newQty <= 0) {
      handleDeleteItem(lineId);
      return;
    }

    setGlobalError("");
    try {
      await updateOrderLineQuantity(lineId, newQty);
      router.refresh();
    } catch (err: any) {
      setGlobalError(err.message || "Erro ao atualizar quantidade.");
    }
  };

  // Delete item from comanda
  const handleDeleteItem = async (lineId: string) => {
    if (isReadOnly) return;
    if (!confirm("Remover este item da comanda?")) {
      return;
    }

    setGlobalError("");
    try {
      await deleteOrderLine(lineId);
      router.refresh();
    } catch (err: any) {
      setGlobalError(err.message || "Erro ao remover item.");
    }
  };

  // Register Sangria / Suprimento / Saída
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    const amount = parseFloat(txAmount);
    if (amount <= 0 || isNaN(amount)) {
      setTxError("Insira um valor maior que zero.");
      return;
    }
    if (!txDescription.trim()) {
      setTxError("A descrição/motivo é obrigatória.");
      return;
    }

    setTxLoading(true);
    setTxError("");
    try {
      await createCashTransaction(txType, amount, txDescription);
      setTxAmount("");
      setTxDescription("");
      router.refresh();
    } catch (err: any) {
      setTxError(err.message || "Erro ao registrar transação.");
    } finally {
      setTxLoading(false);
    }
  };

  // Open Close Caixa Conference Modal
  const handleOpenCloseModal = () => {
    if (isReadOnly) return;
    setCountedCash("");
    setCloseRemarks("");
    setCloseError("");
    setIsCloseModalOpen(true);
  };

  // Confirm Close Caixa
  const handleConfirmClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || !closing) return;

    const cash = parseFloat(countedCash);
    if (isNaN(cash) || cash < 0) {
      setCloseError("Informe um valor contado em dinheiro válido.");
      return;
    }

    setCloseLoading(true);
    setCloseError("");
    try {
      await closeCaixa(closing.id, cash, closeRemarks);
      setIsCloseModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setCloseError(err.message || "Erro ao fechar o caixa.");
    } finally {
      setCloseLoading(false);
    }
  };

  // Open Reopen Modal
  const handleOpenReopenModal = () => {
    setReopenReason("");
    setReopenError("");
    setIsReopenModalOpen(true);
  };

  // Confirm Reopen Caixa
  const handleConfirmReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closing || !reopenReason.trim()) {
      setReopenError("O motivo é obrigatório.");
      return;
    }

    setReopenLoading(true);
    setReopenError("");
    try {
      await reopenCaixa(closing.id, reopenReason);
      setIsReopenModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setReopenError(err.message || "Erro ao reabrir o caixa.");
    } finally {
      setReopenLoading(false);
    }
  };

  // Open Modal to add item
  const openConsumptionModal = (orderId: string) => {
    if (isReadOnly) return;
    setSelectedOrderId(orderId);
    if (products.length > 0) {
      setSelectedProductId(products[0].id);
    } else {
      setSelectedProductId("");
    }
    setQuantity(1);
    setModalError("");
    setIsModalOpen(true);
  };

  // Submit consumption item to comanda
  const handleAddConsumption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!selectedOrderId) return;
    if (!selectedProductId) {
      setModalError("Selecione um produto.");
      return;
    }
    if (quantity <= 0) {
      setModalError("Quantidade inválida.");
      return;
    }

    setModalLoading(true);
    setModalError("");

    try {
      await addItemToOrder(selectedOrderId, selectedProductId, quantity);
      setIsModalOpen(false);
      setSelectedOrderId(null);
      router.refresh();
    } catch (err: any) {
      setModalError(err.message || "Erro ao adicionar item.");
    } finally {
      setModalLoading(false);
    }
  };

  // Visualizar relatório fechado
  const openReport = (c: DailyClosing) => {
    setReportClosing(c);
    setIsReportModalOpen(true);
    logReportAction("IMPRESSAO", `Visualizou relatório de fechamento do dia ${new Date(c.data).toLocaleDateString()}`);
  };

  // Imprimir relatório
  const handlePrintReport = () => {
    window.print();
  };

  // Filter orders by status and search query
  const openOrdersFiltered = orders.filter(
    (o) => o.status === "OPEN" && o.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Closed today
  const closedOrdersFiltered = orders.filter(
    (o) => o.status === "CLOSED" && o.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Cancelled today
  const cancelledOrdersFiltered = orders.filter(
    (o) => o.status === "CANCELLED" && o.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentOrdersList = activeTab === "open" ? openOrdersFiltered : closedOrdersFiltered;

  // Unfiltered lists for statistics calculations
  const openOrdersStats = orders.filter((o) => o.status === "OPEN");
  const closedOrdersStats = orders.filter((o) => o.status === "CLOSED");
  const cancelledOrdersStats = orders.filter((o) => o.status === "CANCELLED");

  // Sum of all entries today
  let totalDinheiro = 0;
  let totalPix = 0;
  let totalDebito = 0;
  let totalCredito = 0;
  let totalVale = 0;
  let totalOutros = 0;
  let totalEntradas = 0;

  closedOrdersStats.forEach((order) => {
    const orderSum = order.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
    totalEntradas += orderSum;
    const method = (order.paymentMethod || "OUTROS").toUpperCase();
    if (method === "DINHEIRO") totalDinheiro += orderSum;
    else if (method === "PIX") totalPix += orderSum;
    else if (method === "DEBITO") totalDebito += orderSum;
    else if (method === "CREDITO") totalCredito += orderSum;
    else if (method === "VALE") totalVale += orderSum;
    else totalOutros += orderSum;
  });

  // Today's open subtotal
  const openSubtotalSum = openOrdersStats.reduce((acc, order) => {
    const orderSum = order.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
    return acc + orderSum;
  }, 0);

  // Today's cancelled total
  const cancelledTotalSum = cancelledOrdersStats.reduce((acc, order) => {
    const orderSum = order.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
    return acc + orderSum;
  }, 0);

  // Sum today's cash transactions
  let totalSuprimentos = 0;
  let totalSangrias = 0;
  let totalSaidas = 0;

  transactions.forEach((tx) => {
    if (tx.type === "SUPRIMENTO") totalSuprimentos += tx.amount;
    else if (tx.type === "SANGRIA") totalSangrias += tx.amount;
    else if (tx.type === "SAIDA") totalSaidas += tx.amount;
  });

  const saldoInicial = closing?.saldoInicial || 0;
  // Saldo Esperado em Dinheiro = Inicial + Dinheiro + Suprimentos - Sangrias - Saídas
  const expectedCashBalance = saldoInicial + totalDinheiro + totalSuprimentos - totalSangrias - totalSaidas;

  // Live conference difference
  const diffVal = (parseFloat(countedCash) || 0) - expectedCashBalance;

  // View: Abertura de Caixa
  if (!closing) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2 border-b border-border/60 pb-4">
            <Lock className="h-10 w-10 text-yellow-500 mx-auto" />
            <h1 className="text-xl font-bold tracking-tight text-zinc-100 uppercase">Caixa Fechado</h1>
            <p className="text-xs text-muted">Abra o movimento financeiro do dia para iniciar as operações.</p>
          </div>

          <form onSubmit={handleOpenCaixa} className="space-y-4">
            <div>
              <label htmlFor="openOperator" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                Nome do Operador
              </label>
              <input
                id="openOperator"
                type="text"
                value={openOperatorName}
                onChange={(e) => setOpenOperatorName(e.target.value)}
                placeholder="Nome do Operador"
                className="w-full rounded border border-border bg-zinc-950 px-3 py-2 text-sm text-foreground focus:border-zinc-500 focus:outline-none"
                disabled={openLoading}
              />
            </div>

            <div>
              <label htmlFor="openRegister" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                Identificação do Caixa
              </label>
              <input
                id="openRegister"
                type="text"
                value={openRegisterName}
                onChange={(e) => setOpenRegisterName(e.target.value)}
                placeholder="Ex: Caixa 1, Principal"
                className="w-full rounded border border-border bg-zinc-950 px-3 py-2 text-sm text-foreground focus:border-zinc-500 focus:outline-none"
                disabled={openLoading}
              />
            </div>

            <div>
              <label htmlFor="openSaldo" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                Saldo Inicial / Fundo de Troco (R$)
              </label>
              <input
                id="openSaldo"
                type="number"
                step="0.01"
                min="0"
                value={openSaldoInicial}
                onChange={(e) => setOpenSaldoInicial(e.target.value)}
                placeholder="0.00"
                className="w-full rounded border border-border bg-zinc-950 px-3 py-2 font-mono text-sm text-foreground focus:border-zinc-500 focus:outline-none placeholder:text-zinc-700"
                disabled={openLoading}
              />
            </div>

            {openError && (
              <p className="text-xs font-semibold uppercase tracking-wider text-red-500">
                {openError}
              </p>
            )}

            <button
              type="submit"
              disabled={openLoading}
              className="flex w-full items-center justify-center gap-2 rounded bg-zinc-100 px-4 py-3 text-xs font-black uppercase tracking-wider text-zinc-950 hover:bg-zinc-200 focus:outline-none disabled:opacity-50 transition-colors"
            >
              {openLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
              <span>Abrir Caixa do Dia</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Banner de Caixa Fechado */}
      {isReadOnly && (
        <div className="rounded-lg border border-red-950 bg-red-950/20 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex gap-3">
            <Lock className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">Caixa Encerrado</h3>
              <p className="text-xs text-red-400 mt-1">
                Este caixa foi fechado por <strong>{closing.usuarioId}</strong> em {new Date(closing.fechamento!).toLocaleString()}. Novas movimentações estão bloqueadas.
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => openReport(closing)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded border border-border hover:border-zinc-500 bg-zinc-950 px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-200"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Ver Relatório</span>
            </button>
            <button
              onClick={handleOpenReopenModal}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded border border-red-900 bg-red-950/10 hover:bg-red-950/30 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-500"
            >
              <Unlock className="h-3.5 w-3.5" />
              <span>Reabrir Caixa</span>
            </button>
          </div>
        </div>
      )}

      {/* Indicadores do Caixa (Painel de Status) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Comandas Abertas</span>
            <Receipt className="h-4 w-4 text-yellow-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-black text-zinc-100">{openOrdersStats.length}</span>
            <span className="font-mono text-xs text-muted">ativas</span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted font-sans">Total em Aberto</span>
            <DollarSign className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-black text-zinc-100">
              R$ {openSubtotalSum.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Total Recebido (Hoje)</span>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="font-mono text-2xl font-black text-green-400">
              R$ {totalEntradas.toFixed(2)}
            </span>
            {!isReadOnly && (
              <button 
                onClick={handleOpenCloseModal}
                className="rounded bg-red-600 hover:bg-red-700 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white transition-all active:scale-[0.98] shadow-md flex items-center gap-1"
              >
                <Lock className="h-3 w-3" />
                <span>Fechar Caixa</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Coluna Lateral de Controles: Nova Comanda + Fluxo de Caixa */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Abertura de Comanda */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-100 flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span>Abrir Nova Comanda</span>
            </h2>
            <form onSubmit={handleCreateOrder} className="space-y-3">
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nome do Cliente (Mesa / Cartão)"
                className="w-full rounded border border-border bg-zinc-950 px-3 py-2 text-sm text-foreground focus:border-zinc-500 focus:outline-none placeholder:text-zinc-700"
                disabled={createLoading || isReadOnly}
              />
              <button
                type="submit"
                disabled={createLoading || isReadOnly}
                className="flex w-full items-center justify-center gap-1.5 rounded bg-zinc-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-200 focus:outline-none disabled:opacity-50 transition-colors"
              >
                {createLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                <span>Abrir Comanda</span>
              </button>
            </form>
            {createError && (
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-red-500">
                {createError}
              </p>
            )}
          </div>

          {/* Fluxo de Caixa (Lançamentos de Sangria/Suprimento/Saída) */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-100 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>Fluxo de Caixa (Lançamento)</span>
            </h2>
            <form onSubmit={handleCreateTransaction} className="space-y-3">
              <div>
                <label htmlFor="txType" className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">Tipo</label>
                <select
                  id="txType"
                  value={txType}
                  onChange={(e) => setTxType(e.target.value)}
                  className="w-full rounded border border-border bg-zinc-950 px-3 py-1.5 text-xs text-foreground focus:border-zinc-500 focus:outline-none"
                  disabled={txLoading || isReadOnly}
                >
                  <option value="SANGRIA">SANGRIA (Retirada de Dinheiro)</option>
                  <option value="SUPRIMENTO">SUPRIMENTO (Fundo de Troco)</option>
                  <option value="SAIDA">SAÍDA (Pagamento/Despesa)</option>
                </select>
              </div>

              <div>
                <label htmlFor="txAmount" className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">Valor (R$)</label>
                <input
                  id="txAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded border border-border bg-zinc-950 px-3 py-1.5 font-mono text-xs text-foreground focus:border-zinc-500 focus:outline-none placeholder:text-zinc-700"
                  disabled={txLoading || isReadOnly}
                />
              </div>

              <div>
                <label htmlFor="txDesc" className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">Descrição / Motivo</label>
                <input
                  id="txDesc"
                  type="text"
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  placeholder="Ex: Troco inicial, Sangria sangra, etc."
                  className="w-full rounded border border-border bg-zinc-950 px-3 py-1.5 text-xs text-foreground focus:border-zinc-500 focus:outline-none placeholder:text-zinc-700"
                  disabled={txLoading || isReadOnly}
                />
              </div>

              {txError && (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-red-500">
                  {txError}
                </p>
              )}

              <button
                type="submit"
                disabled={txLoading || isReadOnly}
                className="flex w-full items-center justify-center gap-1.5 rounded border border-border hover:border-zinc-500 bg-zinc-950/60 hover:bg-zinc-900 px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-300 disabled:opacity-50 transition-colors"
              >
                {txLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                <span>Lançar</span>
              </button>
            </form>

            {/* Listagem de Lançamentos do Dia */}
            <div className="mt-6 border-t border-border/40 pt-4 space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted">Lançamentos de Hoje</h3>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between border-b border-border/10 pb-1.5">
                    <div>
                      <span className={`font-black mr-1 text-[9px] px-1 py-0.2 rounded border ${
                        tx.type === "SUPRIMENTO" 
                          ? "bg-green-950/20 border-green-900/40 text-green-400" 
                          : tx.type === "SANGRIA" 
                            ? "bg-yellow-950/20 border-yellow-900/40 text-yellow-400" 
                            : "bg-red-950/20 border-red-900/40 text-red-400"
                      }`}>{tx.type}</span>
                      <span className="text-zinc-400 block mt-0.5 text-[10px] font-sans">{tx.description}</span>
                    </div>
                    <span className="font-mono text-zinc-300 font-semibold shrink-0">R$ {tx.amount.toFixed(2)}</span>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <div className="text-[11px] italic text-zinc-600 text-center py-2">Nenhum lançamento hoje.</div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Coluna Principal: Grade de Comandas */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              {activeTab === "open" ? "Comandas em Andamento" : "Comandas Fechadas / Faturadas hoje"}
            </h2>

            {/* Barra de Busca + Abas */}
            <div className="flex flex-col sm:flex-row gap-4 items-center shrink-0 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-zinc-600" />
                </span>
                <input
                  type="text"
                  placeholder="Buscar comanda..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded border border-border bg-zinc-950 py-2 pl-9 pr-3 text-xs text-foreground focus:border-zinc-500 focus:outline-none placeholder:text-zinc-700"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex gap-1 rounded bg-zinc-950 p-1 border border-border w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab("open")}
                  className={`flex-1 sm:flex-initial rounded px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all focus:outline-none ${
                    activeTab === "open"
                      ? "bg-card text-zinc-100 border border-border shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Abertas ({openOrdersFiltered.length})
                </button>
                <button
                  onClick={() => setActiveTab("closed")}
                  className={`flex-1 sm:flex-initial rounded px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all focus:outline-none ${
                    activeTab === "closed"
                      ? "bg-card text-zinc-100 border border-border shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Fechadas ({closedOrdersFiltered.length})
                </button>
              </div>
            </div>
          </div>

          {currentOrdersList.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50">
              <p className="text-sm text-muted">
                {searchQuery 
                  ? "Nenhuma comanda corresponde à busca." 
                  : activeTab === "open"
                    ? "Nenhuma comanda aberta no momento."
                    : "Nenhuma comanda fechada no histórico hoje."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {currentOrdersList.map((order) => {
                const subtotal = order.items.reduce(
                  (sum, item) => sum + item.quantity * item.unitPrice, 
                  0
                );
                const dateObj = new Date(order.createdAt);
                const formattedTime = isNaN(dateObj.getTime())
                  ? "Recente"
                  : dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                return (
                  <div 
                    key={order.id} 
                    className={`flex flex-col rounded-lg border bg-card transition-all ${
                      order.status === "OPEN" 
                        ? "border-border hover:border-zinc-700" 
                        : "border-border/40 opacity-80"
                    }`}
                  >
                    {/* Cabeçalho do Card */}
                    <div className="border-b border-border/60 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-tight">
                            {order.clientName}
                          </h3>
                          <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-muted uppercase">
                            <Clock className="h-3 w-3" />
                            <span>Abertura: {formattedTime}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`rounded border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                            order.status === "OPEN"
                              ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
                              : "bg-zinc-950 border-zinc-800 text-zinc-500"
                          }`}>
                            {order.status === "OPEN" ? "Aberta" : "Fechada"}
                          </span>
                          {order.status === "CLOSED" && order.paymentMethod && (
                            <span className="rounded border border-zinc-800 bg-zinc-900/50 px-2 py-0.2 text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">
                              {order.paymentMethod}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Consumo interno do Card */}
                    <div className="flex-1 p-4">
                      <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        Consumo
                      </h4>
                      {order.items.length === 0 ? (
                        <p className="text-xs italic text-zinc-600 py-2">
                          Nenhum consumo registrado.
                        </p>
                      ) : (
                        <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {order.items.map((item) => (
                            <li 
                              key={item.id} 
                              className="flex items-center justify-between text-xs border-b border-border/10 pb-1.5"
                            >
                              <span className="text-zinc-300 font-sans truncate pr-2">
                                {item.quantity}x <span className="font-semibold text-zinc-200">{item.product?.name || "Produto Excluído"}</span>
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-mono text-zinc-400">
                                  R$ {(item.quantity * item.unitPrice).toFixed(2)}
                                </span>
                                
                                {order.status === "OPEN" && !isReadOnly && (
                                  <div className="flex items-center gap-0.5 ml-1 bg-zinc-950 border border-border/50 rounded p-0.5 shadow-sm">
                                    <button
                                      onClick={() => handleUpdateItemQuantity(item.id, item.quantity - 1)}
                                      className="text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded w-4.5 h-4.5 flex items-center justify-center font-bold text-xs"
                                      title="Diminuir"
                                    >
                                      -
                                    </button>
                                    <button
                                      onClick={() => handleUpdateItemQuantity(item.id, item.quantity + 1)}
                                      className="text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded w-4.5 h-4.5 flex items-center justify-center font-bold text-xs"
                                      title="Aumentar"
                                    >
                                      +
                                    </button>
                                    <button
                                      onClick={() => handleDeleteItem(item.id)}
                                      className="text-zinc-600 hover:text-red-500 hover:bg-zinc-800 rounded w-4.5 h-4.5 flex items-center justify-center ml-0.5"
                                      title="Excluir item"
                                    >
                                      <Trash2 className="h-2.5 w-2.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Rodapé / Subtotal / Ações */}
                    <div className="border-t border-border/60 bg-zinc-950/40 p-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted">
                          Total
                        </span>
                        <span className="font-mono text-base font-black text-zinc-100">
                          R$ {subtotal.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {order.status === "OPEN" ? (
                          <>
                            <button
                              onClick={() => openConsumptionModal(order.id)}
                              disabled={products.length === 0 || isReadOnly}
                              className="flex-1 flex items-center justify-center gap-1 rounded border border-border hover:border-zinc-500 bg-zinc-950 py-2 text-xs font-bold uppercase tracking-wider text-zinc-200 hover:text-foreground transition-all focus:outline-none disabled:opacity-50"
                              title={products.length === 0 ? "Cadastre produtos primeiro" : "Adicionar Consumo"}
                            >
                              <UtensilsCrossed className="h-3.5 w-3.5 text-zinc-400" />
                              <span>Consumo</span>
                            </button>
                            
                            <button
                              onClick={() => openCheckoutModal(order.id)}
                              disabled={isReadOnly}
                              className="flex-1 flex items-center justify-center gap-1 rounded bg-zinc-100 hover:bg-zinc-200 py-2 text-xs font-black uppercase tracking-wider text-zinc-950 transition-all focus:outline-none disabled:opacity-50"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              <span>Cobrar</span>
                            </button>
                            
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              disabled={isReadOnly}
                              className="rounded border border-red-900 bg-red-950/10 hover:bg-red-950/30 p-2 text-red-500 transition-all focus:outline-none disabled:opacity-50"
                              title="Cancelar Comanda"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            disabled={deleteLoadingId !== null || isReadOnly}
                            className="w-full flex items-center justify-center gap-1.5 rounded border border-red-900 bg-red-950/10 hover:bg-red-950/30 py-2 text-xs font-bold uppercase tracking-wider text-red-500 transition-all focus:outline-none disabled:opacity-50"
                          >
                            {deleteLoadingId === order.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            <span>Excluir Histórico</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Consumo (Lançamento de item) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100 flex items-center gap-1.5">
                <UtensilsCrossed className="h-4 w-4" />
                <span>Adicionar Consumo</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="rounded text-muted hover:text-foreground hover:bg-zinc-900 p-1 focus:outline-none transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {products.length === 0 ? (
              <div className="space-y-4">
                <p className="text-xs text-muted">
                  Nenhum produto cadastrado. É necessário cadastrar produtos na página de produtos antes de lançar consumo.
                </p>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    router.push("/produtos");
                  }}
                  className="w-full rounded bg-zinc-100 py-2 text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-200 transition-all"
                >
                  Ir para Produtos
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddConsumption} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                    Produto
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full rounded border border-border bg-zinc-950 px-3 py-2 text-sm text-foreground focus:border-zinc-500 focus:outline-none"
                    disabled={modalLoading}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - R$ {p.price.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full rounded border border-border bg-zinc-950 px-3 py-2 font-mono text-sm text-foreground focus:border-zinc-500 focus:outline-none"
                    disabled={modalLoading}
                  />
                </div>

                {modalError && (
                  <p className="text-xs font-semibold uppercase tracking-wider text-red-500">
                    {modalError}
                  </p>
                )}

                <div className="flex gap-2 border-t border-border/60 pt-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 rounded border border-border bg-zinc-950 hover:bg-zinc-900 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-foreground transition-all"
                    disabled={modalLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-1.5 rounded bg-zinc-100 hover:bg-zinc-200 py-2 text-xs font-bold uppercase tracking-wider text-zinc-950 transition-all"
                    disabled={modalLoading}
                  >
                    {modalLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className="h-3.5 w-3.5" />
                    )}
                    <span>Confirmar Inclusão</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal de Checkout (Cobrança) */}
      {isCheckoutModalOpen && selectedOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100 flex items-center gap-1.5">
                <Receipt className="h-4 w-4" />
                <span>Fechar Comanda</span>
              </h3>
              <button 
                onClick={() => setIsCheckoutModalOpen(false)}
                className="rounded text-muted hover:text-foreground hover:bg-zinc-900 p-1 focus:outline-none transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCheckout} className="space-y-6">
              {/* Resumo da conta */}
              <div className="rounded bg-zinc-950 border border-border p-4 space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Resumo do Consumo</h4>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {orders.find(o => o.id === selectedOrderId)?.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span className="text-zinc-400">{item.quantity}x {item.product?.name}</span>
                      <span className="font-mono text-zinc-300">R$ {(item.quantity * item.unitPrice).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border/40 pt-2 flex justify-between items-baseline">
                  <span className="text-xs font-bold text-zinc-400 uppercase">Total a Pagar</span>
                  <span className="font-mono text-lg font-black text-zinc-100">
                    R$ {(orders.find(o => o.id === selectedOrderId)?.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Seleção do método de pagamento */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted font-sans">
                  Método de Pagamento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "DINHEIRO", label: "Dinheiro", color: "text-green-400 border-green-950 bg-green-950/20" },
                    { value: "PIX", label: "Pix", color: "text-teal-400 border-teal-950 bg-teal-950/20" },
                    { value: "DEBITO", label: "Cartão Débito", color: "text-blue-400 border-blue-950 bg-blue-950/20" },
                    { value: "CREDITO", label: "Cartão Crédito", color: "text-purple-400 border-purple-950 bg-purple-950/20" },
                  ].map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPaymentMethod(m.value)}
                      className={`flex items-center justify-center p-3 rounded border text-xs font-black uppercase tracking-wider transition-all select-none ${
                        paymentMethod === m.value
                          ? `${m.color} border-zinc-200 ring-1 ring-zinc-200 text-zinc-100`
                          : "border-border bg-zinc-950/60 hover:bg-zinc-900 text-zinc-400"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-2 border-t border-border/60 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="flex-1 rounded border border-border bg-zinc-950 hover:bg-zinc-900 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-foreground transition-all"
                  disabled={checkoutLoading}
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded bg-green-500 hover:bg-green-600 text-zinc-950 py-2.5 text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98]"
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="h-3.5 w-3.5" />
                  )}
                  <span>Finalizar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Conferência de Fechamento de Caixa */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/85 p-4 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="w-full max-w-xl rounded-lg border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in duration-150 my-8">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100 flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-red-500" />
                <span>Conferência de Fechamento de Caixa</span>
              </h3>
              <button 
                onClick={() => setIsCloseModalOpen(false)}
                className="rounded text-muted hover:text-foreground hover:bg-zinc-900 p-1 focus:outline-none transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmClose} className="space-y-6">
              
              {/* Resumo Financeiro da Conferência */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Entradas */}
                <div className="rounded bg-zinc-950 border border-border p-4 space-y-2 col-span-2 sm:col-span-1">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Entradas por Pagamento</h4>
                  <div className="space-y-1.5 font-sans text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Dinheiro:</span>
                      <span className="font-mono text-zinc-300">R$ {totalDinheiro.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Pix:</span>
                      <span className="font-mono text-zinc-300">R$ {totalPix.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Cartão Débito:</span>
                      <span className="font-mono text-zinc-300">R$ {totalDebito.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Cartão Crédito:</span>
                      <span className="font-mono text-zinc-300">R$ {totalCredito.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-border/30 pt-1.5 font-semibold">
                      <span className="text-zinc-300 uppercase text-[10px]">Total Recebido:</span>
                      <span className="font-mono text-zinc-200">R$ {totalEntradas.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Movimentações de Dinheiro e Cancelamentos */}
                <div className="rounded bg-zinc-950 border border-border p-4 space-y-3 col-span-2 sm:col-span-1 text-xs">
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Fluxo Dinheiro</h4>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Saldo Inicial:</span>
                      <span className="font-mono text-zinc-300">R$ {saldoInicial.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">(+) Entradas (Dinheiro):</span>
                      <span className="font-mono text-zinc-300">R$ {totalDinheiro.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">(+) Suprimentos:</span>
                      <span className="font-mono text-zinc-300">R$ {totalSuprimentos.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-yellow-500">
                      <span>(-) Sangrias:</span>
                      <span className="font-mono">R$ {totalSangrias.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-red-500">
                      <span>(-) Saídas/Despesas:</span>
                      <span className="font-mono">R$ {totalSaidas.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-border/30 pt-2 space-y-1 text-xs">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-red-500/80">Cancelamentos</h4>
                    <div className="flex justify-between text-red-400">
                      <span>Qtd Comandas:</span>
                      <span className="font-mono">{cancelledOrdersStats.length}</span>
                    </div>
                    <div className="flex justify-between text-red-400">
                      <span>Valor Total:</span>
                      <span className="font-mono">R$ {cancelledTotalSum.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Saldo Esperado em Dinheiro */}
              <div className="rounded bg-zinc-950 border border-zinc-700/60 p-4 flex flex-col sm:flex-row items-baseline justify-between gap-2 border-dashed">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Saldo Esperado (Somente Dinheiro Físico)</span>
                  <p className="text-[10px] text-muted">Saldo Inicial + Dinheiro + Suprimentos - Sangrias - Saídas</p>
                </div>
                <span className="font-mono text-xl font-black text-zinc-100">R$ {expectedCashBalance.toFixed(2)}</span>
              </div>

              {/* Valor informado em dinheiro e cálculo de diferença */}
              <div className="space-y-4 border-t border-border/60 pt-4">
                <div className="grid grid-cols-2 gap-4 items-center">
                  <div>
                    <label htmlFor="closeCashInput" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-200">
                      Valor Contado em Dinheiro (R$)
                    </label>
                    <input
                      id="closeCashInput"
                      type="number"
                      step="0.01"
                      min="0"
                      value={countedCash}
                      onChange={(e) => setCountedCash(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded border border-border bg-zinc-950 px-3 py-2 font-mono text-sm text-foreground focus:border-zinc-500 focus:outline-none placeholder:text-zinc-700"
                      disabled={closeLoading}
                    />
                  </div>

                  <div className="text-right space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">Diferença Financeira</span>
                    <span className={`font-mono text-lg font-black block ${
                      diffVal > 0 
                        ? "text-green-500" 
                        : diffVal < 0 
                          ? "text-red-500" 
                          : "text-zinc-500"
                    }`}>
                      {diffVal > 0 
                        ? `Sobra: + R$ ${diffVal.toFixed(2)}` 
                        : diffVal < 0 
                          ? `Falta: - R$ ${Math.abs(diffVal).toFixed(2)}` 
                          : "R$ 0.00"
                      }
                    </span>
                  </div>
                </div>

                <div>
                  <label htmlFor="closeObs" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                    Observações / Ocorrências
                  </label>
                  <textarea
                    id="closeObs"
                    rows={2}
                    value={closeRemarks}
                    onChange={(e) => setCloseRemarks(e.target.value)}
                    placeholder="Registre quebras de caixa, justificativas de diferenças, etc."
                    className="w-full rounded border border-border bg-zinc-950 px-3 py-2 text-xs text-foreground focus:border-zinc-500 focus:outline-none placeholder:text-zinc-700 resize-none"
                    disabled={closeLoading}
                  />
                </div>
              </div>

              {closeError && (
                <p className="text-xs font-semibold uppercase tracking-wider text-red-500">
                  {closeError}
                </p>
              )}

              {/* Botões de Ação */}
              <div className="flex gap-2 border-t border-border/60 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="flex-1 rounded border border-border bg-zinc-950 hover:bg-zinc-900 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-foreground transition-all"
                  disabled={closeLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded bg-red-600 hover:bg-red-700 text-white py-2.5 text-xs font-black uppercase tracking-wider transition-all active:scale-[0.98]"
                  disabled={closeLoading}
                >
                  {closeLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                  <span>Confirmar Fechamento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Reabertura de Caixa */}
      {isReopenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-500 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                <span>Reabrir Caixa Fechado</span>
              </h3>
              <button 
                onClick={() => setIsReopenModalOpen(false)}
                className="rounded text-muted hover:text-foreground hover:bg-zinc-900 p-1 focus:outline-none transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReopen} className="space-y-4">
              <p className="text-xs text-muted">
                A reabertura do caixa permitirá a edição e inserção de novas comandas e lançamentos. Esta ação gera um log de auditoria permanente.
              </p>
              
              <div>
                <label htmlFor="reopenReasonInput" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  Motivo da Reabertura
                </label>
                <textarea
                  id="reopenReasonInput"
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="Justifique a reabertura do caixa..."
                  className="w-full rounded border border-border bg-zinc-950 px-3 py-2 text-xs text-foreground focus:border-zinc-500 focus:outline-none placeholder:text-zinc-700 resize-none"
                  disabled={reopenLoading}
                />
              </div>

              {reopenError && (
                <p className="text-xs font-semibold uppercase tracking-wider text-red-500">
                  {reopenError}
                </p>
              )}

              <div className="flex gap-2 border-t border-border/60 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsReopenModalOpen(false)}
                  className="flex-1 rounded border border-border bg-zinc-950 hover:bg-zinc-900 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-foreground transition-all"
                  disabled={reopenLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded bg-red-600 hover:bg-red-700 text-white py-2 text-xs font-bold uppercase tracking-wider transition-all"
                  disabled={reopenLoading}
                >
                  {reopenLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Unlock className="h-3.5 w-3.5" />
                  )}
                  <span>Reabrir Caixa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Relatório Imprimível / Visualização PDF */}
      {isReportModalOpen && reportClosing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-lg border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in duration-150 my-8">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4 no-print">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100 flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                <span>Relatório Consolidado de Fechamento</span>
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={handlePrintReport}
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

            {/* Corpo Imprimível (Apenas este elemento tem visibilidade print no CSS) */}
            <div id="print-area" className="p-8 bg-white text-zinc-950 rounded shadow-sm font-sans space-y-8 select-all">
              
              {/* Cabeçalho do Relatório */}
              <div className="text-center border-b border-zinc-300 pb-4 space-y-1">
                <h1 className="text-xl font-bold uppercase tracking-wider">Relatório de Fechamento do Caixa</h1>
                <p className="text-xs text-zinc-500 uppercase font-semibold">Caixa: {reportClosing.caixaId} — Operador: {reportClosing.usuarioId}</p>
                <p className="text-xs text-zinc-400 font-mono">ID Fechamento: {reportClosing.id}</p>
              </div>

              {/* Informações Gerais */}
              <div className="grid grid-cols-2 gap-4 text-xs border-b border-zinc-200 pb-4">
                <div>
                  <span className="font-bold uppercase text-zinc-500 block text-[10px]">Data do Movimento</span>
                  <span className="font-semibold text-zinc-800 text-[11px]">{new Date(reportClosing.data).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="font-bold uppercase text-zinc-500 block text-[10px]">Status</span>
                  <span className="font-bold text-zinc-800 text-[11px] uppercase">{reportClosing.status === "CLOSED" ? "Fechado" : "Aberto"}</span>
                </div>
                <div>
                  <span className="font-bold uppercase text-zinc-500 block text-[10px]">Horário de Abertura</span>
                  <span className="font-mono text-zinc-800 text-[11px]">{new Date(reportClosing.abertura).toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-bold uppercase text-zinc-500 block text-[10px]">Horário de Fechamento</span>
                  <span className="font-mono text-zinc-800 text-[11px]">
                    {reportClosing.fechamento ? new Date(reportClosing.fechamento).toLocaleString() : "—"}
                  </span>
                </div>
              </div>

              {/* Entradas */}
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
                      <td className="py-1.5 text-right font-mono text-zinc-800">R$ {reportClosing.totalDinheiro.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-semibold text-zinc-700">Pix</td>
                      <td className="py-1.5 text-right font-mono text-zinc-800">R$ {reportClosing.totalPix.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-semibold text-zinc-700">Cartão Débito</td>
                      <td className="py-1.5 text-right font-mono text-zinc-800">R$ {reportClosing.totalDebito.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-semibold text-zinc-700">Cartão Crédito</td>
                      <td className="py-1.5 text-right font-mono text-zinc-800">R$ {reportClosing.totalCredito.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-semibold text-zinc-700">Vale Alimentação / Refeição</td>
                      <td className="py-1.5 text-right font-mono text-zinc-800">R$ {reportClosing.totalVale.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-semibold text-zinc-700">Outros / Convênio</td>
                      <td className="py-1.5 text-right font-mono text-zinc-800">R$ {reportClosing.totalOutros.toFixed(2)}</td>
                    </tr>
                    <tr className="font-bold border-t border-zinc-300">
                      <td className="py-2 text-zinc-800 uppercase">Total das Entradas</td>
                      <td className="py-2 text-right font-mono text-zinc-950">R$ {reportClosing.totalEntradas.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Movimentações Internas (Saídas / Sangrias / Suprimentos) */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-zinc-600 border-b border-zinc-200 pb-1">2. Fluxo de Caixa Local (Fundo de Troco / Dinheiro)</h3>
                <div className="grid grid-cols-2 gap-6 text-xs font-sans">
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Saldo de Abertura (Fundo):</span>
                      <span className="font-mono text-zinc-800">R$ {reportClosing.saldoInicial.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600">(+) Total Dinheiro (Entrada):</span>
                      <span className="font-mono text-zinc-800">R$ {reportClosing.totalDinheiro.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600">(+) Total Suprimentos (Aportes):</span>
                      <span className="font-mono text-zinc-800">R$ {reportClosing.totalSuprimentos.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-yellow-600">
                      <span>(-) Total Sangrias (Retiradas):</span>
                      <span className="font-mono">R$ {reportClosing.totalSangrias.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>(-) Total Saídas (Despesas):</span>
                      <span className="font-mono">R$ {reportClosing.totalSaidas.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="border-l border-zinc-200 pl-6 space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Resumo Cancelamentos</span>
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Total Cancelado hoje:</span>
                      <span className="font-mono text-red-600">R$ {reportClosing.totalCancelamentos.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conciliação e Conferência Física */}
              <div className="rounded border border-zinc-300 p-4 space-y-2 bg-zinc-50 font-sans text-xs">
                <h3 className="text-xs font-black uppercase text-zinc-800">3. Conciliação de Caixa (Dinheiro Contado)</h3>
                <div className="grid grid-cols-3 gap-2 py-2">
                  <div>
                    <span className="text-zinc-500 uppercase text-[9px] block">Saldo Esperado em Caixa</span>
                    <span className="font-mono font-bold text-zinc-800 text-[13px]">R$ {reportClosing.saldoEsperado.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 uppercase text-[9px] block">Saldo Contado em Dinheiro</span>
                    <span className="font-mono font-bold text-zinc-800 text-[13px]">R$ {reportClosing.saldoInformado.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 uppercase text-[9px] block">Diferença</span>
                    <span className={`font-mono font-black text-[13px] ${
                      reportClosing.diferenca > 0 
                        ? "text-green-600" 
                        : reportClosing.diferenca < 0 
                          ? "text-red-600" 
                          : "text-zinc-500"
                    }`}>
                      {reportClosing.diferenca > 0 
                        ? `Sobra: + R$ ${reportClosing.diferenca.toFixed(2)}` 
                        : reportClosing.diferenca < 0 
                          ? `Falta: - R$ ${Math.abs(reportClosing.diferenca).toFixed(2)}` 
                          : "R$ 0.00"
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {reportClosing.observacoes && (
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-zinc-500 uppercase text-[10px]">Observações / Justificativas</span>
                  <p className="text-zinc-700 bg-zinc-50 border border-zinc-200 rounded p-3 font-sans italic">{reportClosing.observacoes}</p>
                </div>
              )}

              {/* Assinaturas */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                <div className="space-y-4">
                  <div className="border-t border-zinc-400 mx-auto w-3/4 pt-2"></div>
                  <span className="font-bold text-zinc-500 uppercase text-[9px]">Operador do Caixa</span>
                  <p className="font-semibold text-zinc-800 mt-1">{reportClosing.usuarioId}</p>
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
