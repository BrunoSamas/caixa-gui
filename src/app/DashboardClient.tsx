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
  ChevronRight
} from "lucide-react";
import { 
  createOrder, 
  addItemToOrder, 
  closeOrder, 
  deleteOrder,
  updateOrderLineQuantity,
  deleteOrderLine
} from "@/actions/orders";

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

interface DashboardClientProps {
  initialProducts: Product[];
  initialOrders: any[]; // Typing dynamically based on Prisma output
}

export function DashboardClient({ initialProducts, initialOrders }: DashboardClientProps) {
  const router = useRouter();
  
  // Local lists
  const [orders, setOrders] = useState<CustomerOrder[]>(initialOrders);
  const [products] = useState<Product[]>(initialProducts);

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

  // Action states
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState("");

  // Sync initialOrders from Server Component
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  // Open a new comanda
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
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
    setCheckoutOrderId(orderId);
    setPaymentMethod("PIX");
    setGlobalError("");
    setIsCheckoutModalOpen(true);
  };

  // Confirm Checkout and close comanda
  const handleConfirmCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutOrderId) return;

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

  // Delete comanda registry
  const handleDeleteOrder = async (id: string) => {
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

  // Update item quantity in an active order
  const handleUpdateItemQuantity = async (lineId: string, newQty: number) => {
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

  // Delete item from an active order
  const handleDeleteItem = async (lineId: string) => {
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

  // Open Modal to add item
  const openConsumptionModal = (orderId: string) => {
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

  // Filter orders by status and search query
  const openOrdersFiltered = orders.filter(
    (o) => o.status === "OPEN" && o.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const closedOrdersFiltered = orders.filter(
    (o) => o.status === "CLOSED" && o.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const currentOrdersList = activeTab === "open" ? openOrdersFiltered : closedOrdersFiltered;

  // Unfiltered orders for statistics calculations
  const openOrdersStats = orders.filter((o) => o.status === "OPEN");
  const closedOrdersStats = orders.filter((o) => o.status === "CLOSED");

  // Statistics calculation for daily dashboard
  const openSubtotalSum = openOrdersStats.reduce((acc, order) => {
    const orderSum = order.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
    return acc + orderSum;
  }, 0);

  const closedBilledSum = closedOrdersStats.reduce((acc, order) => {
    const orderSum = order.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
    return acc + orderSum;
  }, 0);

  // Selected checkout order for modal display
  const selectedCheckoutOrder = orders.find(o => o.id === checkoutOrderId);
  const selectedCheckoutTotal = selectedCheckoutOrder
    ? selectedCheckoutOrder.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    : 0;

  const paymentMethodsList = [
    { value: "PIX", label: "Pix", color: "text-teal-400 border-teal-950 bg-teal-950/20 active:bg-teal-900/40" },
    { value: "DINHEIRO", label: "Dinheiro", color: "text-green-400 border-green-950 bg-green-950/20 active:bg-green-900/40" },
    { value: "DEBITO", label: "Cartão Débito", color: "text-blue-400 border-blue-950 bg-blue-950/20 active:bg-blue-900/40" },
    { value: "CREDITO", label: "Cartão Crédito", color: "text-purple-400 border-purple-950 bg-purple-950/20 active:bg-purple-900/40" },
  ];

  return (
    <div className="space-y-8">
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

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Total Recebido (Hoje)</span>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-black text-green-400">
              R$ {closedBilledSum.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Ação Rápida: Abertura de Comanda e Controle de Abas */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        
        {/* Abertura de Comanda */}
        <div className="flex-1 rounded-lg border border-border bg-card p-6 lg:max-w-md">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-100 flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span>Abrir Nova Comanda</span>
          </h2>
          <form onSubmit={handleCreateOrder} className="flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nome do Cliente (Mesa / Cartão)"
                className="w-full rounded border border-border bg-zinc-950 px-3 py-2 text-sm text-foreground focus:border-zinc-500 focus:outline-none placeholder:text-zinc-700"
                disabled={createLoading}
              />
            </div>
            <button
              type="submit"
              disabled={createLoading}
              className="flex items-center justify-center gap-1.5 rounded bg-zinc-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-200 focus:outline-none disabled:opacity-50 transition-colors shrink-0"
            >
              {createLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              <span>Abrir</span>
            </button>
          </form>
          {createError && (
            <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-red-500">
              {createError}
            </p>
          )}
        </div>

        {/* Barra de Busca + Abas */}
        <div className="flex flex-col sm:flex-row gap-4 items-center shrink-0 w-full lg:w-auto">
          {/* Input de Busca de Comanda */}
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-zinc-600" />
            </span>
            <input
              type="text"
              placeholder="Buscar comanda por nome..."
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

          {/* Seleção de Abas */}
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
              Histórico ({closedOrdersFiltered.length})
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

      {/* Grade de Comandas */}
      <div>
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-500">
          {activeTab === "open" ? "Comandas em Andamento" : "Comandas Fechadas / Faturadas hoje"}
        </h2>

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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {currentOrdersList.map((order) => {
              // Calculate Subtotal for this order
              const subtotal = order.items.reduce(
                (sum, item) => sum + item.quantity * item.unitPrice, 
                0
              );
              
              // Formatting time
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
                              
                              {/* Controles de quantidade e exclusão direta no card para comandas abertas */}
                              {order.status === "OPEN" && (
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
                            disabled={products.length === 0}
                            className="flex-1 flex items-center justify-center gap-1 rounded border border-border hover:border-zinc-500 bg-zinc-950 py-2 text-xs font-bold uppercase tracking-wider text-zinc-200 hover:text-foreground transition-all focus:outline-none disabled:opacity-50"
                            title={products.length === 0 ? "Cadastre produtos primeiro" : "Adicionar Consumo"}
                          >
                            <UtensilsCrossed className="h-3.5 w-3.5 text-zinc-400" />
                            <span>Consumo</span>
                          </button>
                          
                          <button
                            onClick={() => openCheckoutModal(order.id)}
                            className="flex-1 flex items-center justify-center gap-1 rounded bg-zinc-100 hover:bg-zinc-200 py-2 text-xs font-black uppercase tracking-wider text-zinc-950 transition-all focus:outline-none"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Cobrar</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          disabled={deleteLoadingId !== null}
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
      {isCheckoutModalOpen && selectedCheckoutOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100 flex items-center gap-1.5">
                <Receipt className="h-4 w-4" />
                <span>Fechar Comanda - {selectedCheckoutOrder.clientName}</span>
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
                  {selectedCheckoutOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span className="text-zinc-400">{item.quantity}x {item.product?.name}</span>
                      <span className="font-mono text-zinc-300">R$ {(item.quantity * item.unitPrice).toFixed(2)}</span>
                    </div>
                  ))}
                  {selectedCheckoutOrder.items.length === 0 && (
                    <div className="text-xs italic text-zinc-600 py-1">Nenhum consumo lançado.</div>
                  )}
                </div>
                <div className="border-t border-border/40 pt-2 flex justify-between items-baseline">
                  <span className="text-xs font-bold text-zinc-400 uppercase">Total a Pagar</span>
                  <span className="font-mono text-lg font-black text-zinc-100">R$ {selectedCheckoutTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Seleção do método de pagamento */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted">
                  Método de Pagamento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {paymentMethodsList.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPaymentMethod(m.value)}
                      className={`flex items-center justify-center p-3.5 rounded border text-xs font-black uppercase tracking-wider transition-all select-none ${
                        paymentMethod === m.value
                          ? `${m.color} border-zinc-200 ring-1 ring-zinc-200 font-extrabold text-zinc-100`
                          : "border-border bg-zinc-950/60 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200"
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
    </div>
  );
}
