"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Edit2, Check, X, Loader2, Search } from "lucide-react";
import { createProduct, updateProduct, deleteProduct } from "@/actions/products";

interface Product {
  id: string;
  name: string;
  price: number;
}

interface ProductListClientProps {
  initialProducts: Product[];
}

export function ProductListClient({ initialProducts }: ProductListClientProps) {
  const router = useRouter();
  
  // Local list state synchronized with initialProducts
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");

  // Create Form State
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Edit Inline State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Global actions loading/error
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  // Sync initialProducts from Server
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // Handle new product registration
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setCreateError("O nome do produto é obrigatório.");
      return;
    }
    
    // Normalize price (replace comma with dot)
    const formattedPrice = newPrice.replace(",", ".");
    const priceValue = parseFloat(formattedPrice);
    if (isNaN(priceValue) || priceValue <= 0) {
      setCreateError("Insira um preço válido maior que zero.");
      return;
    }

    setCreateLoading(true);
    setCreateError("");
    setActionError("");

    try {
      await createProduct(newName, priceValue);
      setNewName("");
      setNewPrice("");
      router.refresh();
    } catch (err: any) {
      setCreateError(err.message || "Erro ao criar produto.");
    } finally {
      setCreateLoading(false);
    }
  };

  // Start inline editing
  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditName(product.name);
    setEditPrice(product.price.toString());
    setEditError("");
    setActionError("");
  };

  // Cancel inline editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditPrice("");
    setEditError("");
  };

  // Save inline edit
  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) {
      setEditError("O nome é obrigatório.");
      return;
    }

    const formattedPrice = editPrice.replace(",", ".");
    const priceValue = parseFloat(formattedPrice);
    if (isNaN(priceValue) || priceValue <= 0) {
      setEditError("Preço inválido.");
      return;
    }

    setEditLoading(true);
    setEditError("");

    try {
      await updateProduct(id, editName, priceValue);
      setEditingId(null);
      router.refresh();
    } catch (err: any) {
      setEditError(err.message || "Erro ao salvar.");
    } finally {
      setEditLoading(false);
    }
  };

  // Handle product deletion
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) {
      return;
    }

    setDeleteLoadingId(id);
    setActionError("");

    try {
      await deleteProduct(id);
      router.refresh();
    } catch (err: any) {
      setActionError(err.message || "Erro ao excluir produto.");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  // Filter products by search term
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Coluna de Cadastro */}
      <div className="lg:col-span-1">
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-100">
            Cadastrar Novo Produto
          </h2>
          
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                Nome do Produto
              </label>
              <input
                id="name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Cerveja IPA 500ml"
                className="w-full rounded border border-border bg-zinc-950 px-3 py-2 text-sm text-foreground focus:border-zinc-500 focus:outline-none placeholder:text-zinc-700 font-sans"
                disabled={createLoading}
              />
            </div>

            <div>
              <label htmlFor="price" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                Preço (R$)
              </label>
              <input
                id="price"
                type="text"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="0.00"
                className="w-full rounded border border-border bg-zinc-950 px-3 py-2 font-mono text-sm text-foreground focus:border-zinc-500 focus:outline-none placeholder:text-zinc-700"
                disabled={createLoading}
              />
            </div>

            {createError && (
              <p className="text-xs font-semibold uppercase tracking-wider text-red-500">
                {createError}
              </p>
            )}

            <button
              type="submit"
              disabled={createLoading}
              className="flex w-full items-center justify-center gap-2 rounded bg-zinc-100 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-200 focus:outline-none disabled:opacity-50 transition-colors"
            >
              {createLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              <span>Adicionar Produto</span>
            </button>
          </form>
        </div>
      </div>

      {/* Coluna da Listagem */}
      <div className="lg:col-span-2">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-100">
              Produtos Cadastrados
            </h2>

            {/* Input de Busca */}
            <div className="relative flex-1 sm:max-w-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-zinc-600" />
              </span>
              <input
                type="text"
                placeholder="Buscar por nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded border border-border bg-zinc-950 py-1.5 pl-9 pr-3 text-xs text-foreground focus:border-zinc-500 focus:outline-none placeholder:text-zinc-700"
              />
            </div>
          </div>

          {actionError && (
            <div className="mb-4 rounded border border-red-900 bg-red-950/30 p-3 text-xs font-semibold uppercase tracking-wider text-red-500">
              {actionError}
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <div className="flex h-36 flex-col items-center justify-center rounded border border-dashed border-border bg-zinc-950/50">
              <p className="text-sm text-muted">
                {search ? "Nenhum produto corresponde à busca." : "Nenhum produto cadastrado."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border text-xs font-bold uppercase tracking-wider text-zinc-500">
                    <th className="py-3 px-4 font-semibold">Nome</th>
                    <th className="py-3 px-4 font-semibold w-32">Preço</th>
                    <th className="py-3 px-4 font-semibold w-24 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredProducts.map((product) => {
                    const isEditing = editingId === product.id;
                    const isDeleting = deleteLoadingId === product.id;

                    return (
                      <tr key={product.id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="py-3 px-4 text-sm font-sans text-zinc-100">
                          {isEditing ? (
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full rounded border border-border bg-zinc-950 px-2 py-1 text-xs text-foreground focus:border-zinc-500 focus:outline-none"
                                disabled={editLoading}
                              />
                              {editError && (
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-red-500">
                                  {editError}
                                </p>
                              )}
                            </div>
                          ) : (
                            product.name
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-sm text-zinc-300">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-full rounded border border-border bg-zinc-950 px-2 py-1 text-xs text-foreground focus:border-zinc-500 focus:outline-none"
                              disabled={editLoading}
                            />
                          ) : (
                            `R$ ${product.price.toFixed(2)}`
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleSaveEdit(product.id)}
                                  disabled={editLoading}
                                  title="Salvar"
                                  className="rounded border border-border p-1 text-green-500 hover:bg-zinc-900 focus:outline-none disabled:opacity-50 transition-colors"
                                >
                                  {editLoading ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5" />
                                  )}
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  disabled={editLoading}
                                  title="Cancelar"
                                  className="rounded border border-border p-1 text-zinc-500 hover:bg-zinc-900 focus:outline-none disabled:opacity-50 transition-colors"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEdit(product)}
                                  disabled={deleteLoadingId !== null}
                                  title="Editar"
                                  className="rounded border border-border p-1 text-zinc-400 hover:bg-zinc-900 hover:text-foreground focus:outline-none disabled:opacity-50 transition-colors"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(product.id)}
                                  disabled={isDeleting || deleteLoadingId !== null}
                                  title="Excluir"
                                  className="rounded border border-border p-1 text-zinc-400 hover:bg-zinc-900 hover:text-red-500 focus:outline-none disabled:opacity-50 transition-colors"
                                >
                                  {isDeleting ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
