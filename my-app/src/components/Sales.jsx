import { useEffect, useState, useRef } from "react";
import { 
  Plus, 
  ShoppingCart, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Trash2, 
  FileText, 
  Printer, 
  Package,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import StatCard from "./StatCard.jsx";

const API_BASE = "http://localhost:5001/api";

export default function Sales() {
  const [products, setProducts] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [invoiceId, setInvoiceId] = useState("");
  
  // New state to hold the confirmed order data for printing
  const [lastOrder, setLastOrder] = useState(null);

  // Form State for the "Current Item" being added
  const [currentItem, setCurrentItem] = useState({
    productId: "",
    quantity: 1,
    price: "",
  });

  // Generate a random Invoice ID on mount
  useEffect(() => {
    generateInvoiceId();
    loadData();
  }, []);

  const generateInvoiceId = () => {
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const random = Math.floor(1000 + Math.random() * 9000);
    setInvoiceId(`INV-${dateStr}-${random}`);
  };

  const loadData = async () => {
    try {
      const [salesRes, prodRes] = await Promise.all([
        fetch(`${API_BASE}/sales`),
        fetch(`${API_BASE}/products`)
      ]);
      
      if (salesRes.ok) setSalesHistory(await salesRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
    } catch (e) {
      console.error("Error loading data:", e);
    }
  };

  // Auto-fill price when product is selected
  useEffect(() => {
    if (currentItem.productId) {
      const prod = products.find(p => p.product_id === Number(currentItem.productId));
      if (prod) {
        setCurrentItem(prev => ({ 
            ...prev, 
            price: prod.price || "",
            // Reset quantity to 1 to avoid stale high numbers
            quantity: 1
        }));
      }
    }
  }, [currentItem.productId, products]);

  // --- Cart Actions ---

  const addToCart = (e) => {
    e.preventDefault();
    const { productId, quantity, price } = currentItem;
    
    if (!productId || !quantity || !price) return alert("Please fill all fields");
    
    const product = products.find(p => p.product_id === Number(productId));
    if (!product) return;

    // Stock Validation
    const currentStock = product.stocks?.reduce((s, i) => s + i.quantity, 0) || 0;
    // Check if item is already in cart to count total requested qty
    const existingInCart = cart.find(item => item.productId === Number(productId));
    const cartQty = existingInCart ? existingInCart.quantity : 0;

    if (Number(quantity) + cartQty > currentStock) {
      return alert(`Insufficient Stock! Only ${currentStock} available.`);
    }

    if (existingInCart) {
      // Update existing
      setCart(cart.map(item => 
        item.productId === Number(productId)
          ? { ...item, quantity: item.quantity + Number(quantity) }
          : item
      ));
    } else {
      // Add new
      setCart([...cart, {
        productId: Number(productId),
        productName: product.product_name,
        category: product.category?.category_name,
        quantity: Number(quantity),
        price: Number(price),
        total: Number(quantity) * Number(price)
      }]);
    }

    // Reset form but keep price/product for easy re-entry if needed, or clear? Let's clear qty
    setCurrentItem({ ...currentItem, quantity: 1 });
  };

  const removeFromCart = (idx) => {
    setCart(cart.filter((_, i) => i !== idx));
  };

  // --- Calculations ---

  const cartTotal = cart.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  const totalRevenue = salesHistory.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

  // --- Checkout ---

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Cart is empty!");
    if (!window.confirm(`Confirm transaction of ₹${cartTotal.toLocaleString()}?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/sales/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId,
          items: cart,
          date: new Date()
        }),
      });

      if (res.ok) {
        // 1. FREEZE Data for Printing BEFORE clearing cart
        setLastOrder({
          invoiceId: invoiceId, // Capture the CURRENT invoice ID
          items: [...cart],     // Capture the items
          total: cartTotal,
          date: new Date()
        });

        alert("Transaction Successful!");
        
        // 2. Clear Live State
        setCart([]);
        generateInvoiceId(); // New ID for NEXT customer
        loadData();

        // 3. Print the FROZEN data (lastOrder)
        setTimeout(() => window.print(), 500);
      } else {
        const err = await res.json();
        alert(err.error || "Transaction failed");
      }
    } catch (error) {
      console.error(error);
      alert("Network Error");
    } finally {
      setLoading(false);
    }
  };

  // --- Print Data Logic ---
  // If we just finished an order, print that (lastOrder). 
  // If not, print the current cart (Draft).
  const printData = lastOrder || {
    invoiceId: invoiceId,
    items: cart,
    total: cartTotal,
    date: new Date()
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sales & Billing</h1>
          <p className="text-gray-500 text-sm">Create invoices and track revenue.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm"
            >
                <Printer size={18} /> Print Last Bill
            </button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`₹${totalRevenue.toLocaleString()}`} 
          icon={DollarSign} 
          color="green" 
          trend="up"
        />
        <StatCard 
          title="Transactions Today" 
          value={salesHistory.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).length} 
          icon={FileText} 
          color="blue" 
        />
      </div>

      {/* Main Billing Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT: Product Selector (Cart Builder) */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <ShoppingCart className="text-blue-600" size={20} /> Add Item
                </h2>
                <form onSubmit={addToCart} className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Product</label>
                        <select
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={currentItem.productId}
                            onChange={(e) => setCurrentItem({ ...currentItem, productId: e.target.value })}
                            required
                        >
                            <option value="">Select Product...</option>
                            {products.map((p) => {
                                const stock = p.stocks?.reduce((s,i)=>s+i.quantity,0) || 0;
                                return (
                                    <option key={p.product_id} value={p.product_id} disabled={stock <= 0}>
                                        {p.product_name} ({stock} in stock)
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Qty</label>
                            <input
                                type="number"
                                min="1"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={currentItem.quantity}
                                onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Price</label>
                            <input
                                type="number"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={currentItem.price}
                                onChange={(e) => setCurrentItem({ ...currentItem, price: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-50 text-blue-600 font-medium py-2 rounded-lg hover:bg-blue-100 transition flex items-center justify-center gap-2 border border-blue-100"
                    >
                        <Plus size={18} /> Add to Bill
                    </button>
                </form>
            </div>
        </div>

        {/* RIGHT: Invoice Preview */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full min-h-[500px]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                    <h2 className="text-lg font-bold text-gray-800">Current Invoice</h2>
                    <p className="text-xs text-gray-500 font-mono mt-1">ID: {invoiceId}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase">Date</p>
                    <p className="font-medium text-gray-700">{new Date().toLocaleDateString()}</p>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="p-4 pl-6">Product</th>
                            <th className="p-4 text-center">Qty</th>
                            <th className="p-4 text-right">Price</th>
                            <th className="p-4 text-right">Total</th>
                            <th className="p-4 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {cart.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="p-12 text-center text-gray-400">
                                    <ShoppingCart size={40} className="mx-auto mb-3 opacity-20" />
                                    No items in bill yet.
                                </td>
                            </tr>
                        ) : (
                            cart.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 group">
                                    <td className="p-4 pl-6 font-medium text-gray-800">
                                        {item.productName}
                                        <div className="text-xs text-gray-400 font-normal">{item.category}</div>
                                    </td>
                                    <td className="p-4 text-center">{item.quantity}</td>
                                    <td className="p-4 text-right">₹{item.price}</td>
                                    <td className="p-4 text-right font-semibold">₹{(item.quantity * item.price).toLocaleString()}</td>
                                    <td className="p-4 text-center">
                                        <button 
                                            onClick={() => removeFromCart(idx)}
                                            className="text-gray-300 hover:text-red-500 transition"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-xl font-bold text-gray-800">₹{cartTotal.toLocaleString()}</span>
                </div>
                <button
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || loading}
                    className={`w-full py-3 rounded-xl font-semibold text-white shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2
                        ${cart.length === 0 ? 'bg-gray-300 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.01]'}
                    `}
                >
                    {loading ? "Processing..." : (
                        <>
                           <CheckCircle size={20} /> Complete Transaction & Print
                        </>
                    )}
                </button>
            </div>
        </div>
      </div>

      {/* --- HIDDEN PRINT TEMPLATE --- */}
      <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:z-50 print:p-8">
        <div className="max-w-3xl mx-auto border border-gray-200 rounded-lg p-8">
            <div className="text-center mb-8 border-b border-gray-200 pb-4">
                <h1 className="text-3xl font-bold text-gray-800">INVOICE</h1>
                <p className="text-gray-500">Smart Inventory Management System</p>
            </div>
            
            <div className="flex justify-between mb-8">
                <div>
                    <p className="text-gray-500 text-sm uppercase">Billed To:</p>
                    <p className="font-semibold">Walk-in Customer</p>
                </div>
                <div className="text-right">
                    <p className="text-gray-500 text-sm uppercase">Invoice Info:</p>
                    <p className="font-mono text-sm">#{printData.invoiceId}</p>
                    <p className="text-sm">{new Date(printData.date).toLocaleDateString()}</p>
                </div>
            </div>

            <table className="w-full mb-8 text-sm">
                <thead>
                    <tr className="border-b-2 border-gray-800">
                        <th className="text-left py-2">Item</th>
                        <th className="text-center py-2">Qty</th>
                        <th className="text-right py-2">Price</th>
                        <th className="text-right py-2">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {printData.items.map((item, i) => (
                        <tr key={i} className="border-b border-gray-100">
                            <td className="py-2">{item.productName}</td>
                            <td className="text-center py-2">{item.quantity}</td>
                            <td className="text-right py-2">₹{item.price}</td>
                            <td className="text-right py-2">₹{(item.quantity * item.price).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-end border-t border-gray-200 pt-4">
                <div className="w-48">
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>₹{printData.total.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className="mt-12 text-center text-xs text-gray-400">
                <p>Thank you for your business!</p>
            </div>
        </div>
      </div>
    </div>
  );
}
