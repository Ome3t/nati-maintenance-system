"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Plus, Package, Copy, Check, TrendingDown, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/shared/stat-card";

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  sellingPrice: number;
  purchasePrice: number;
  currentStock: number;
  minimumStock: number;
  unit: string;
  category?: { name: string };
  supplier?: { name: string };
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockUpdateProduct, setStockUpdateProduct] = useState<Product | null>(null);
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockAction, setStockAction] = useState<"sold" | "restock" | "out">("sold");

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      toast.error("Failed to load inventory");
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStockUpdate = async () => {
    if (!stockUpdateProduct) return;
    if (stockAction !== "out" && (!stockQuantity || parseInt(stockQuantity) <= 0)) {
      toast.error("Please enter a valid quantity");
      return;
    }

    try {
      let newStock = stockUpdateProduct.currentStock;
      if (stockAction === "sold") newStock = Math.max(0, stockUpdateProduct.currentStock - parseInt(stockQuantity));
      else if (stockAction === "restock") newStock = stockUpdateProduct.currentStock + parseInt(stockQuantity);
      else if (stockAction === "out") newStock = 0;

      const response = await fetch(`/api/products/${stockUpdateProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentStock: newStock }),
      });

      if (!response.ok) throw new Error("Failed to update stock");

      toast.success(`${stockUpdateProduct.name} updated to ${newStock} ${stockUpdateProduct.unit}`);
      setShowStockModal(false);
      setStockQuantity("");
      fetchProducts();
    } catch (error) {
      toast.error("Failed to update stock");
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "ALL" ||
      (filter === "LOW" && p.currentStock <= p.minimumStock && p.currentStock > 0) ||
      (filter === "OUT" && p.currentStock === 0) ||
      (filter === "IN" && p.currentStock > p.minimumStock);
    return matchesSearch && matchesFilter;
  });

  const lowStockCount = products.filter((p) => p.currentStock <= p.minimumStock && p.currentStock > 0).length;
  const outOfStockCount = products.filter((p) => p.currentStock === 0).length;

  const statusOf = (p: Product) => {
    if (p.currentStock === 0) return { dot: "bg-red-500", label: "Out of stock", color: "text-red-500" };
    if (p.currentStock <= p.minimumStock) return { dot: "bg-amber-500", label: "Low stock", color: "text-amber-500" };
    return { dot: "bg-emerald-500", label: "In stock", color: "text-emerald-500" };
  };

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Dynamic Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/manager" className="hover:text-foreground transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Inventory</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-xs text-muted-foreground mt-1">Manage your products, stock levels, and pricing.</p>
        </div>
        <Link href="/inventory/new">
          <Button className="gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </Link>
      </div>

      {/* KPI Strip (Matches Dashboard StatCard exactly) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Products" value={products.length} hint="In catalog" />
        <StatCard label="Low Stock" value={lowStockCount} hint="Needs reorder" trend="down" />
        <StatCard label="Out of Stock" value={outOfStockCount} hint="Action required" trend="down" />
      </div>

      {/* Filter Bar (Matches Dashboard Panel styling) */}
      <div className="bg-card border border-border/50 shadow-sm rounded-xl p-4 transition-all duration-300 ease-out hover:border-white/10 dark:hover:border-zinc-700">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-background/50 border-border/50" />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-9 rounded-lg border border-border/50 bg-background/50 px-3 py-1 text-sm shadow-sm transition-all hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="ALL">All Products</option>
            <option value="IN">In Stock</option>
            <option value="LOW">Low Stock</option>
            <option value="OUT">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Table (Matches Dashboard Table styling) */}
      <div className="bg-card border border-border/50 shadow-sm rounded-xl overflow-hidden transition-all duration-300 ease-out hover:border-white/10 dark:hover:border-zinc-700">
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton />
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No products found matching your criteria.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 hover:bg-transparent">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Product</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">SKU</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Category</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Price</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stock</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const s = statusOf(product);
                  return (
                    <tr
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className="border-b border-border/50 last:border-0 cursor-pointer transition-colors hover:bg-accent/50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium text-foreground">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground font-mono">{product.sku}</span>
                          <button onClick={(e) => { e.stopPropagation(); copyToClipboard(product.sku, product.id); }} className="text-muted-foreground hover:text-foreground transition-colors">
                            {copiedId === product.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground hidden md:table-cell">{product.category?.name || "—"}</td>
                      <td className="px-5 py-4 text-sm text-foreground text-right font-medium">{Number(product.sellingPrice).toLocaleString()} ETB</td>
                      <td className="px-5 py-4 text-sm text-foreground text-right font-medium">{product.currentStock} <span className="text-xs text-muted-foreground">{product.unit}</span></td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-2 text-xs">
                          <span className="relative flex h-2 w-2">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${s.dot}`}></span>
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${s.dot}`}></span>
                          </span>
                          <span className={`font-medium ${s.color}`}>{s.label}</span>
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); setStockUpdateProduct(product); setShowStockModal(true); }}
                          className="gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] border-border/50"
                        >
                          <TrendingDown className="h-3 w-3" /> Update Stock
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Product Detail Drawer (Matches CustomerDetailDrawer animation exactly) */}
      <Sheet open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <SheetContent side="right" className="w-full sm:w-[480px] border-l border-border bg-background text-foreground h-full p-0 flex flex-col">
          {selectedProduct && (
            <div className="animate-page-enter flex-1 flex flex-col overflow-hidden">
              <SheetHeader className="px-6 py-5 border-b border-border/50 space-y-1">
                <SheetTitle className="text-2xl font-bold text-foreground">{selectedProduct.name}</SheetTitle>
                <SheetDescription className="text-muted-foreground text-base flex items-center gap-2">
                  <span className="font-mono text-sm">{selectedProduct.sku}</span>
                  <button onClick={() => copyToClipboard(selectedProduct.sku, 'drawer')} className="hover:text-foreground transition-colors">
                     {copiedId === 'drawer' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </SheetDescription>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-muted/50 p-5">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Stock</div>
                    <div className="text-2xl font-bold text-foreground mt-1">{selectedProduct.currentStock}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{selectedProduct.unit}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Min. Stock</div>
                    <div className="text-2xl font-bold text-foreground mt-1">{selectedProduct.minimumStock}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{selectedProduct.unit}</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Pricing</h3>
                  <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-5 transition-colors hover:bg-muted/60">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Purchase price</span>
                      <span className="text-sm font-medium text-foreground">{Number(selectedProduct.purchasePrice).toLocaleString()} ETB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Selling price</span>
                      <span className="text-sm font-bold text-foreground">{Number(selectedProduct.sellingPrice).toLocaleString()} ETB</span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <span className="text-sm text-muted-foreground">Profit margin</span>
                      <span className="text-sm font-medium text-emerald-500">
                        {(Number(selectedProduct.sellingPrice) - Number(selectedProduct.purchasePrice)).toLocaleString()} ETB
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Details</h3>
                  <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-5 transition-colors hover:bg-muted/60">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Category</span>
                      <span className="text-sm text-foreground">{selectedProduct.category?.name || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Barcode</span>
                      <span className="text-sm text-foreground font-mono">{selectedProduct.barcode || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Supplier</span>
                      <span className="text-sm text-foreground">{selectedProduct.supplier?.name || "—"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Stock Update Modal (Smooth slide-up animation) */}
      <Sheet open={showStockModal} onOpenChange={setShowStockModal}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh] border-t border-border bg-background text-foreground p-6 rounded-t-2xl">
          <div className="animate-page-enter">
            <SheetHeader className="mb-6 space-y-1">
              <SheetTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-foreground" />
                Update Stock: {stockUpdateProduct?.name}
              </SheetTitle>
              <SheetDescription className="text-muted-foreground text-base">
                Current stock: <span className="font-bold text-foreground">{stockUpdateProduct?.currentStock} {stockUpdateProduct?.unit}</span>
              </SheetDescription>
            </SheetHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <Button variant={stockAction === "sold" ? "default" : "outline"} onClick={() => setStockAction("sold")} className="transition-all hover:scale-[1.02] active:scale-[0.98] border-border/50">Mark as Sold</Button>
                <Button variant={stockAction === "restock" ? "default" : "outline"} onClick={() => setStockAction("restock")} className="transition-all hover:scale-[1.02] active:scale-[0.98] border-border/50">Restock</Button>
                <Button variant={stockAction === "out" ? "destructive" : "outline"} onClick={() => setStockAction("out")} className="transition-all hover:scale-[1.02] active:scale-[0.98] border-border/50">Out of Stock</Button>
              </div>
              
              {stockAction !== "out" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{stockAction === "sold" ? "Quantity Sold" : "Quantity Added"}</label>
                  <Input type="number" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} placeholder="Enter quantity..." className="bg-background/50 border-border/50" />
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowStockModal(false)} className="flex-1 transition-all hover:scale-[1.02] active:scale-[0.98] border-border/50">Cancel</Button>
                <Button onClick={handleStockUpdate} className="flex-1 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  {stockAction === "out" ? "Mark Out of Stock" : "Update Stock"}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="p-5 space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          <div className="h-4 w-4 bg-muted/50 rounded" />
          <div className="h-4 w-32 bg-muted/50 rounded" />
          <div className="h-4 w-20 bg-muted/50 rounded ml-auto" />
          <div className="h-4 w-16 bg-muted/50 rounded" />
        </div>
      ))}
    </div>
  );
}