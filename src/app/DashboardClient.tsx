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
  FileText,
  Printer
} from "lucide-react";
import { 
  createOrder, 
  addItemToOrder, 
  closeOrder, 
  deleteOrder,
  updateOrderLineQuantity,
  deleteOrderLine
} from "@/actions/orders";
import { 
  closeDia 
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

interface DashboardClientProps {
  initialProducts: Product[];
  initialOrders: any[];
  initialClosing: DailyClosing | null;
}

export function DashboardClient({ 
  initialProducts, 
  initialOrders, 
  initialClosing 
}: DashboardClientProps) {
  const router = useRouter();
  
  // Local states
  const [orders, setOrders] = useState<CustomerOrder[]>(initialOrders);
  const [products] = useState<Product[]>(initialProducts);
  const [closing, setClosing] = useState<DailyClosing | null>(initialClosing);

  // Tab: "open" (Active) or "closed" (History)
  const [activeTab, setActiveTab] = useState<"open" | "closed">("open");

  // Search input query
  const [searchQuery, setSearchQuery] = useState("");

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

  // Fechamento Form State
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [operatorName, setOperatorName] = useState("Operador Padrão");
  const [closeLoading, setCloseLoading] = useState(false);
  const [closeError, setCloseError] = useState("");

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Global action loading/error
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState("");

  // Sync state from server component
  useEffect(() => {
    setOrders(initialOrders);
    setClosing(initialClosing);
  }, [initialOrders, initialClosing]);

  const isReadOnly = closing !== null;

  // Handle opening a new comanda
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

  // Delete comanda registry from history
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
      setGlobalError(err.message || "Erro ao atualizar quantidade do item.");
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

  // Open Consumption Modal
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

  // Handle Fechamento do Dia
  const handleCloseDia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!operatorName.trim()) {
      setCloseError("O operador é obrigatório.");
      return;
    }

    setCloseLoading(true);
    setCloseError("");
    try {
      const res = await closeDia(operatorName);
      setIsCloseModalOpen(false);
      setClosing(res as any);
      setIsReportModalOpen(true); // Open report directly upon success
      router.refresh();
    } catch (err: any) {
      setCloseError(err.message || "Erro ao fechar o dia.");
    } finally {
      setCloseLoading(false);
    }
  };

  // Filter orders by status and search query
  const openOrdersFiltered = orders.filter(
    (o) => o.status === "OPEN" && o.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const closedOrdersFiltered = orders.filter(
    (o) => o.status === "CLOSED" && o.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const currentOrdersList = activeTab === "open" ? openOrdersFiltered : closedOrdersFiltered;

  // Unfiltered lists for statistics calculations
  const openOrdersStats = orders.filter((o) => o.status === "OPEN");
  const closedOrdersStats = orders.filter((o) => o.status === "CLOSED");

  // Sum of open comandas (pending values)
  const openSubtotalSum = openOrdersStats.reduce((acc, order) => {
    const orderSum = order.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
    return acc + orderSum;
  }, 0);

  // Sum of closed comandas (billed values)
  const closedBilledSum = closedOrdersStats.reduce((acc, order) => {
    const orderSum = order.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
    return acc + orderSum;
  }, 0);

  // Total Sold Value = Payed + Pending
  const totalSoldSum = openSubtotalSum + closedBilledSum;

  const totalComandas = orders.length;

  // Parse unpaid clients from JSON (if day is closed, load from saved record, else calculate from open orders)
  let unpaidClientsList: { name: string; id: string; amount: number }[] = [];
  if (isReadOnly && closing) {
    try {
      unpaidClientsList = JSON.parse(closing.unpaidClientsJson);
    } catch (e) {
      unpaidClientsList = [];
    }
  } else {
    unpaidClientsList = openOrdersStats.map((o) => {
      const amount = o.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
      return {
        name: o.clientName,
        id: o.id,
        amount,
      };
    });
  }

  // Group payment methods (if day is closed, use from closing record, else calculate from closed orders)
  const paymentMethodsSummary = isReadOnly && closing ? {
    dinheiro: closing.totalDinheiro,
    pix: closing.totalPix,
    debito: closing.totalDebito,
    credito: closing.totalCredito,
    outros: closing.totalOutros
  } : {
    dinheiro: closedOrdersStats.filter(o => (o.paymentMethod || "").toUpperCase() === "DINHEIRO").reduce((s, o) => s + o.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0), 0),
    pix: closedOrdersStats.filter(o => (o.paymentMethod || "").toUpperCase() === "PIX").reduce((s, o) => s + o.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0), 0),
    debito: closedOrdersStats.filter(o => (o.paymentMethod || "").toUpperCase() === "DEBITO").reduce((s, o) => s + o.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0), 0),
    credito: closedOrdersStats.filter(o => (o.paymentMethod || "").toUpperCase() === "CREDITO").reduce((s, o) => s + o.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0), 0),
    outros: closedOrdersStats.filter(o => !["DINHEIRO", "PIX", "DEBITO", "CREDITO"].includes((o.paymentMethod || "").toUpperCase())).reduce((s, o) => s + o.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0), 0)
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* Banner de Dia Fechado */}
      {isReadOnly && closing && (
        <div className="rounded-lg border border-red-950 bg-red-950/20 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex gap-3">
            <Lock className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">Dia Encerrado</h3>
              <p className="text-xs text-red-400 mt-1">
                O movimento de hoje foi fechado por <strong>{closing.usuarioId}</strong> em {new Date(closing.fechamento).toLocaleString()}. Modificações estão bloqueadas.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded border border-border hover:border-zinc-500 bg-zinc-950 px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-200"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Visualizar Relatório do Dia</span>
          </button>
        </div>
      )}

      {/* Indicadores do Caixa (Painel de Status) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Comandas Abertas (Pendentes)</span>
            <Receipt className="h-4 w-4 text-yellow-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-black text-zinc-100">
              {isReadOnly && closing ? unpaidClientsList.length : openOrdersStats.length}
            </span>
            <span className="font-mono text-xs text-muted">clientes</span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Total Pendente (A Receber)</span>
            <DollarSign className="h-4 w-4 text-red-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-black text-red-400">
              R$ {isReadOnly && closing ? closing.totalPendente.toFixed(2) : openSubtotalSum.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Total Vendido (Hoje)</span>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="font-mono text-2xl font-black text-green-400">
              R$ {isReadOnly && closing ? closing.totalVendido.toFixed(2) : totalSoldSum.toFixed(2)}
            </span>
            {!isReadOnly && (
              <button 
                onClick={() => setIsCloseModalOpen(true)}
                className="rounded bg-red-600 hover:bg-red-700 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white transition-all active:scale-[0.98] shadow-md flex items-center gap-1"
              >
                <Lock className="h-3 w-3" />
                <span>Fechar Dia</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Coluna Lateral: Abertura de Comanda */}
        <div className="lg:col-span-1 space-y-6">
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
                className="w-full rounded border border-border bg-zinc-950 px-3 py-2 text-sm text-foreground focus:border-zinc-500 focus:outline-none placeholder:text-zinc-700 font-sans"
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
        </div>

        {/* Coluna Principal: Grade de Comandas */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              {activeTab === "open" ? "Comandas Ativas" : "Comandas Fechadas / Histórico do Dia"}
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

          {globalError && (
            <div className="rounded border border-red-900 bg-red-950/30 p-4 text-xs font-semibold uppercase tracking-wider text-red-500 flex items-center justify-between">
              <span>{globalError}</span>
              <button onClick={() => setGlobalError("")} className="text-red-400 hover:text-red-200">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

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

                    {/* Consumo interno */}
                    <div className="flex-1 p-4">
                      <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        Consumo
                      </h4>
                      {order.items.length === 0 ? (
                        <p className="text-xs italic text-zinc-600 py-2">
                          Nenhum consumo registrado.
                        </p>
                      ) : (
                        <ul className="space-y-2 max-h-48 overflow-y-auto pr-1 font-sans">
                          {order.items.map((item) => (
                            <li 
                              key={item.id} 
                              className="flex items-center justify-between text-xs border-b border-border/10 pb-1.5"
                            >
                              <span className="text-zinc-300 truncate pr-2">
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
                        <span className="text-xs font-bold uppercase tracking-wider text-muted font-sans">
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

      {/* Modal de Consumo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-xs animate-in fade-in zoom-in duration-150">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100 flex items-center gap-1.5">
                <UtensilsCrossed className="h-4 w-4" />
                <span>Adicionar Consumo</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded text-muted hover:text-foreground hover:bg-zinc-900 p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddConsumption} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">Produto</label>
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
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">Quantidade</label>
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
                <p className="text-xs font-semibold uppercase tracking-wider text-red-500">{modalError}</p>
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
                  className="flex-1 flex items-center justify-center gap-1.5 rounded bg-zinc-100 hover:bg-zinc-200 py-2 text-xs font-bold uppercase tracking-wider text-zinc-950"
                  disabled={modalLoading}
                >
                  {modalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                  <span>Confirmar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Checkout */}
      {isCheckoutModalOpen && selectedOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100 flex items-center gap-1.5">
                <Receipt className="h-4 w-4" />
                <span>Fechar Comanda</span>
              </h3>
              <button onClick={() => setIsCheckoutModalOpen(false)} className="rounded text-muted hover:text-foreground hover:bg-zinc-900 p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCheckout} className="space-y-6">
              <div className="rounded bg-zinc-950 border border-border p-4 space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Resumo</h4>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {orders.find(o => o.id === selectedOrderId)?.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span className="text-zinc-400">{item.quantity}x {item.product?.name}</span>
                      <span className="font-mono text-zinc-300">R$ {(item.quantity * item.unitPrice).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border/40 pt-2 flex justify-between items-baseline">
                  <span className="text-xs font-bold text-zinc-400 uppercase font-sans">Total a Pagar</span>
                  <span className="font-mono text-lg font-black text-zinc-100">
                    R$ {(orders.find(o => o.id === selectedOrderId)?.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted font-sans">Forma de Pagamento</label>
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
                  {checkoutLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                  <span>Finalizar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Fechamento do Dia */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/85 p-4 backdrop-blur-xs animate-in fade-in zoom-in duration-150">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100 flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-red-500" />
                <span>Fechar Movimento do Dia</span>
              </h3>
              <button onClick={() => setIsCloseModalOpen(false)} className="rounded text-muted hover:text-foreground hover:bg-zinc-900 p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCloseDia} className="space-y-6">
              <div className="rounded bg-zinc-950 border border-border p-4 space-y-3 text-xs">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Resumo Geral de Hoje</h4>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total de Comandas:</span>
                  <span className="font-mono text-zinc-100 font-bold">{totalComandas}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total Vendido (Bruto):</span>
                  <span className="font-mono text-zinc-100 font-bold">R$ {totalSoldSum.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-yellow-500 font-semibold border-t border-border/20 pt-2">
                  <span>Total Pendente (A Receber):</span>
                  <span className="font-mono">R$ {openSubtotalSum.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label htmlFor="operatorInput" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  Operador Responsável
                </label>
                <input
                  id="operatorInput"
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="Nome do operador"
                  className="w-full rounded border border-border bg-zinc-950 px-3 py-2 text-sm text-foreground focus:border-zinc-500 focus:outline-none"
                  disabled={closeLoading}
                />
              </div>

              {closeError && (
                <p className="text-xs font-semibold uppercase tracking-wider text-red-500">{closeError}</p>
              )}

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
                  {closeLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                  <span>Fechar Dia</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Relatório Simples */}
      {isReportModalOpen && closing && (
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
                <p className="text-xs text-zinc-500 uppercase font-semibold">Operador Responsável: {closing.usuarioId}</p>
                <p className="text-xs text-zinc-400 font-mono">ID Fechamento: {closing.id}</p>
              </div>

              {/* Informações Gerais */}
              <div className="grid grid-cols-2 gap-4 text-xs border-b border-zinc-200 pb-4">
                <div>
                  <span className="font-bold uppercase text-zinc-400 block text-[10px]">Data do Movimento</span>
                  <span className="font-bold text-zinc-800 text-[11px]">{new Date(closing.data).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="font-bold uppercase text-zinc-400 block text-[10px]">Horário do Fechamento</span>
                  <span className="font-mono text-zinc-800 text-[11px]">{new Date(closing.fechamento).toLocaleString()}</span>
                </div>
              </div>

              {/* Resumo */}
              <div className="space-y-1 text-xs">
                <h3 className="text-xs font-black uppercase text-zinc-500 border-b border-zinc-200 pb-1">Resumo do Movimento</h3>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-600">Quantidade de Comandas:</span>
                  <span className="font-bold text-zinc-800">{closing.totalComandas}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-600">Valor Bruto Total Vendido:</span>
                  <span className="font-bold font-mono text-zinc-900">R$ {closing.totalVendido.toFixed(2)}</span>
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
                      <td className="py-2 text-right font-mono text-red-600">R$ {closing.totalPendente.toFixed(2)}</td>
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
                      <td className="py-1.5 text-right font-mono">R$ {paymentMethodsSummary.dinheiro.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5">PIX</td>
                      <td className="py-1.5 text-right font-mono">R$ {paymentMethodsSummary.pix.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5">Cartão de Débito</td>
                      <td className="py-1.5 text-right font-mono">R$ {paymentMethodsSummary.debito.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5">Cartão de Crédito</td>
                      <td className="py-1.5 text-right font-mono">R$ {paymentMethodsSummary.credito.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5">Outros</td>
                      <td className="py-1.5 text-right font-mono">R$ {paymentMethodsSummary.outros.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Assinaturas */}
              <div className="grid grid-cols-2 gap-8 pt-12 text-center text-xs">
                <div className="space-y-4">
                  <div className="border-t border-zinc-400 mx-auto w-3/4 pt-2"></div>
                  <span className="font-bold text-zinc-400 uppercase text-[9px]">Operador do Caixa</span>
                  <p className="font-semibold text-zinc-800 mt-1">{closing.usuarioId}</p>
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
