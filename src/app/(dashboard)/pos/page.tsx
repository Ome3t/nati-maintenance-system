"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Search, Plus, Minus, Trash2, X, Banknote, CreditCard, Smartphone, CheckCircle } from "lucide-react";

export default function POSPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then(setCustomers)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 1) {
      setSearching(true);
      const timer = setTimeout(() => {
        fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}`)
          .then((res) => res.json())
          .then((data) => {
            setProducts(data);
            setSearching(false);
          })
          .catch(() => setSearching(false));
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setProducts([]);
      setSearching(false);
    }
  }, [searchQuery]);

  const addToCart = (product: any) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.currentStock) {
        setError("Insufficient stock");
        setTimeout(() => setError(""), 2000);
        return;
      }
      setCart(
        cart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: Number(product.sellingPrice),
          quantity: 1,
          stock: product.currentStock,
        },
      ]);
    }
    setSearchQuery("");
    setProducts([]);
  };

  const removeFromCart = (id: string) => setCart(cart.filter((i) => i.id !== id));

  const updateQuantity = (id: string, delta: number) => {
    setCart(
      cart.map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return item;
          if (newQty > item.stock) {
            setError("Insufficient stock");
            setTimeout(() => setError(""), 2000);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal;

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      setError("Cart is empty");
      return;
    }
    setProcessing(true);
    setError("");
    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer || null,
          cashierId: session?.user?.id,
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            unitPrice: item.price,
            total: item.price * item.quantity,
          })),
          paymentMethod,
          subtotal,
          total,
          paidAmount: total,
          remainingAmount: 0,
          status: "PAID",
        }),
      });
      if (!response.ok) throw new Error("Failed");
      const sale = await response.json();
      setSuccess("Sale completed! Invoice: " + sale.invoiceNumber);
      setCart([]);
      setSelectedCustomer("");
      setPaymentMethod("CASH");
      setShowPayment(false);
      setTimeout(() => {
        router.push(`/receipts/${sale.id}`);
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to complete sale");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Left: Product Search */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-slate-900 mb-4">Point of Sale</h1>

          {/* Customer Select */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Customer
            </label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">Walk-in Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `— ${c.phone}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {searching && (
            <p className="text-sm text-slate-500 text-center py-4">Searching...</p>
          )}

          {!searching && searchQuery.length > 0 && products.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm">
              No products found for "{searchQuery}"
            </div>
          )}

          {!searching && products.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.currentStock === 0}
                  className="bg-white border border-slate-200 rounded-md p-3 text-left hover:border-slate-900 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <p className="text-sm font-medium text-slate-900 line-clamp-2">
                    {product.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{product.sku}</p>
                  <p className="text-sm font-bold text-slate-900 mt-2">
                    {Number(product.sellingPrice).toLocaleString()} ETB
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {product.currentStock > 0
                      ? `${product.currentStock} in stock`
                      : "Out of stock"}
                  </p>
                </button>
              ))}
            </div>
          )}

          {!searching && searchQuery.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Start typing to search products</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-96 bg-white border border-slate-200 rounded-lg flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">
            Cart ({cart.length} {cart.length === 1 ? "item" : "items"})
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">Cart is empty</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="border border-slate-100 rounded-md p-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.price.toLocaleString()} ETB
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-400 hover:text-red-500 p-0.5 ml-2"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-slate-200 rounded-md">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="px-2 py-1 hover:bg-slate-50"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-3 py-1 text-sm font-medium border-x border-slate-200 min-w-[2.5rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="px-2 py-1 hover:bg-slate-50"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {(item.price * item.quantity).toLocaleString()} ETB
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-4">
          <div className="flex justify-between mb-4">
            <span className="text-sm text-slate-600">Total</span>
            <span className="text-xl font-bold text-slate-900">
              {total.toLocaleString()} ETB
            </span>
          </div>
          <button
            onClick={() => setShowPayment(true)}
            disabled={cart.length === 0}
            className="w-full py-2.5 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Proceed to Payment
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Payment</h3>
              <button
                onClick={() => setShowPayment(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              <div className="text-center mb-6 pb-5 border-b border-slate-100">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                  Total amount
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {total.toLocaleString()} ETB
                </p>
              </div>

              <p className="text-xs font-medium text-slate-600 mb-3">
                Payment method
              </p>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {[
                  { key: "CASH", label: "Cash", Icon: Banknote },
                  { key: "BANK_TRANSFER", label: "Bank", Icon: CreditCard },
                  { key: "MOBILE_MONEY", label: "Mobile", Icon: Smartphone },
                ].map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    onClick={() => setPaymentMethod(key)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-md border text-xs font-medium transition-colors ${
                      paymentMethod === key
                        ? "bg-slate-900 text-white border-slate-900"
                        : "border-slate-200 text-slate-700 hover:border-slate-900"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </button>
                ))}
              </div>

              {error && (
                <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setShowPayment(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteSale}
                  disabled={processing}
                  className="flex-1 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 disabled:opacity-50"
                >
                  {processing ? "Processing..." : "Complete Sale"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {success && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-5 py-3 rounded-md shadow-lg z-50 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          <span className="text-sm font-medium">{success}</span>
        </div>
      )}
    </div>
  );
}