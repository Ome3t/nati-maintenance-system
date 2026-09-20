"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, Loader2, Tag, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Option { id: string; name: string }

const NEW_VALUE = "__new";

const selectClasses =
  "flex h-9 w-full rounded-md border border-border/50 bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Option[]>([]);
  const [suppliers, setSuppliers] = useState<Option[]>([]);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [newSupplierName, setNewSupplierName] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [currentStock, setCurrentStock] = useState("");
  const [minimumStock, setMinimumStock] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(setCategories).catch(() => {});
    fetch("/api/suppliers").then(r => r.json()).then(setSuppliers).catch(() => {});
  }, []);

  // Creates a new category on the fly (or reuses an existing one)
  const ensureCategory = async (): Promise<string | null> => {
    if (categoryId !== NEW_VALUE) return categoryId || null;
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      toast.error("Please enter a name for the new category");
      return null;
    }
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      toast.success(`Category "${created.name}" created`);
      return created.id;
    } catch {
      toast.error("Failed to create category");
      return null;
    }
  };

  // Creates a new supplier on the fly (or reuses an existing one)
  const ensureSupplier = async (): Promise<string | null> => {
    if (supplierId !== NEW_VALUE) return supplierId || null;
    const trimmed = newSupplierName.trim();
    if (!trimmed) {
      toast.error("Please enter a name for the new supplier");
      return null;
    }
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      toast.success(`Supplier "${created.name}" created`);
      return created.id;
    } catch {
      toast.error("Failed to create supplier");
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku || !sellingPrice) {
      toast.error("Please fill in Name, SKU, and Selling Price");
      return;
    }

    setLoading(true);
    try {
      const resolvedCategoryId = await ensureCategory();
      if (categoryId === NEW_VALUE && !resolvedCategoryId) { setLoading(false); return; }

      const resolvedSupplierId = await ensureSupplier();
      if (supplierId === NEW_VALUE && !resolvedSupplierId) { setLoading(false); return; }

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sku,
          barcode,
          categoryId: resolvedCategoryId,
          supplierId: resolvedSupplierId,
          purchasePrice: parseFloat(purchasePrice) || 0,
          sellingPrice: parseFloat(sellingPrice),
          currentStock: parseInt(currentStock) || 0,
          minimumStock: parseInt(minimumStock) || 0,
          unit,
          description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add product");
      }

      toast.success("Product added successfully!");
      setTimeout(() => router.push("/inventory"), 900);
    } catch (error: any) {
      toast.error(error.message || "Failed to add product");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-page-enter">
      {/* Dynamic Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/manager" className="hover:text-foreground transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href="/inventory" className="hover:text-foreground transition-colors">Inventory</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Add Product</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Add New Product</h1>
        <p className="text-xs text-muted-foreground mt-1">Enter the details of the new inventory item.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-border/50 shadow-sm rounded-xl p-6 space-y-6 transition-all duration-300 ease-out hover:border-white/10 dark:hover:border-zinc-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Product Name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., iPhone 14 Screen" className="bg-background/50 border-border/50" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">SKU *</label>
            <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g., SCR-IP14-001" className="bg-background/50 border-border/50" required />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Purchase Price (ETB)</label>
            <Input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="0.00" className="bg-background/50 border-border/50" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Selling Price (ETB) *</label>
            <Input type="number" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} placeholder="0.00" className="bg-background/50 border-border/50" required />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Current Stock</label>
            <Input type="number" value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} placeholder="0" className="bg-background/50 border-border/50" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Minimum Stock</label>
            <Input type="number" value={minimumStock} onChange={(e) => setMinimumStock(e.target.value)} placeholder="0" className="bg-background/50 border-border/50" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Unit</label>
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="pcs" className="bg-background/50 border-border/50" />
          </div>
        </div>

        {/* FLEXIBLE CATEGORY SELECTOR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" /> Category
            </label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={selectClasses}>
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
              <option value={NEW_VALUE}>+ Add new category…</option>
            </select>
            {categoryId === NEW_VALUE && (
              <Input
                autoFocus
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Type new category name (e.g., Screens)"
                className="bg-background/50 border-border/50 animate-page-enter"
              />
            )}
          </div>

          {/* FLEXIBLE SUPPLIER SELECTOR */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Truck className="h-3.5 w-3.5 text-muted-foreground" /> Supplier
            </label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className={selectClasses}>
              <option value="">No supplier</option>
              {suppliers.map((sup) => (
                <option key={sup.id} value={sup.id}>{sup.name}</option>
              ))}
              <option value={NEW_VALUE}>+ Add new supplier…</option>
            </select>
            {supplierId === NEW_VALUE && (
              <Input
                autoFocus
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                placeholder="Type new supplier name (e.g., Bole Parts Ltd)"
                className="bg-background/50 border-border/50 animate-page-enter"
              />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Barcode (Optional)</label>
          <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Scan or type barcode" className="bg-background/50 border-border/50 font-mono" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional product details..."
            className="flex min-h-[80px] w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.push("/inventory")} className="flex-1 transition-all hover:scale-[1.02] active:scale-[0.98] border-border/50">
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="flex-1 gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding Product...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Add Product
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}