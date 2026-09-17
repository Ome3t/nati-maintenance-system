"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Plus, AlertTriangle, Package, X } from "lucide-react";

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

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "ALL" ||
      (filter === "LOW" && p.currentStock <= p.minimumStock) ||
      (filter === "OUT" && p.currentStock === 0) ||
      (filter === "IN" && p.currentStock > p.minimumStock);
    return matchesSearch && matchesFilter;
  });

  const lowStockCount = products.filter((p) => p.currentStock <= p.minimumStock && p.currentStock > 0).length;
  const outOfStockCount = products.filter((p) => p.currentStock === 0).length;

  const statusOf = (p: Product) => {
    if (p.currentStock === 0) return { dot: "bg-red-500", label: "Out of stock", color: "text-red-600" };
    if (p.currentStock <= p.minimumStock) return { dot: "bg-amber-500", label: "Low stock", color: "text-amber-600" };
    return { dot: "bg-green-500", label: "In stock", color: "text-green-600" };
  };

  return (
    <div className="flex gap-6">
      {/* Main List */}
      <div className="flex-1 min-w-0">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">Inventory</h1>
          <Link
            href="/inventory/new"
            className="px-4 py-2 bg-slate-900 text-white text-sm rounded-md hover:bg-slate-800 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Total products
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{products.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Low stock
            </p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{lowStockCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Out of stock
            </p>
            <p className="text-2xl font-bold text-red-600 mt-1">{outOfStockCount}</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-lg border border-slate-200 mb-4 p-3 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="ALL">All</option>
            <option value="IN">In stock</option>
            <option value="LOW">Low stock</option>
            <option value="OUT">Out of stock</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-slate-500 text-sm">Loading...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No products found
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Product
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    SKU
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Category
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Price
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Stock
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const s = statusOf(product);
                  return (
                    <tr
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className={`border-b border-slate-50 last:border-0 cursor-pointer transition-colors ${
                        selectedProduct?.id === product.id
                          ? "bg-slate-50"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-slate-900">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {product.sku}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {product.category?.name || "—"}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-900 text-right font-medium">
                        {Number(product.sellingPrice).toLocaleString()} ETB
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-900 text-right font-medium">
                        {product.currentStock}
                      </td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-2 text-xs text-slate-600">
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
                          <span className={s.color + " font-medium"}>{s.label}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Side Panel */}
      {selectedProduct && (
        <div className="w-96 bg-white border-l border-slate-200 fixed right-0 top-0 h-screen overflow-y-auto scrollbar-thin z-20 shadow-lg">
          <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {selectedProduct.name}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {selectedProduct.sku}
              </p>
            </div>
            <button
              onClick={() => setSelectedProduct(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Stock Overview */}
          <div className="px-5 py-4 grid grid-cols-2 gap-3 border-b border-slate-100">
            <div className="bg-slate-50 rounded-md p-3">
              <p className="text-xs text-slate-500 mb-1">Current Stock</p>
              <p className="text-2xl font-bold text-slate-900">
                {selectedProduct.currentStock}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedProduct.unit}
              </p>
            </div>
            <div className="bg-slate-50 rounded-md p-3">
              <p className="text-xs text-slate-500 mb-1">Min. Stock</p>
              <p className="text-2xl font-bold text-slate-900">
                {selectedProduct.minimumStock}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedProduct.unit}
              </p>
            </div>
          </div>

          {/* Pricing */}
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Pricing
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Purchase price</span>
                <span className="text-sm font-medium text-slate-900">
                  {Number(selectedProduct.purchasePrice).toLocaleString()} ETB
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Selling price</span>
                <span className="text-sm font-bold text-slate-900">
                  {Number(selectedProduct.sellingPrice).toLocaleString()} ETB
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-sm text-slate-600">Profit margin</span>
                <span className="text-sm font-medium text-green-600">
                  {Number(selectedProduct.sellingPrice) -
                    Number(selectedProduct.purchasePrice)}{" "}
                  ETB
                </span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Details
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Category</span>
                <span className="text-sm text-slate-900">
                  {selectedProduct.category?.name || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Barcode</span>
                <span className="text-sm text-slate-900">
                  {selectedProduct.barcode || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Unit</span>
                <span className="text-sm text-slate-900">
                  {selectedProduct.unit}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}