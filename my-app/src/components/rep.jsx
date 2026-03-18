import { useState, useEffect } from "react";
import { 
  Package, 
  Plus, 
  Trash2, 
  AlertCircle, 
  RefreshCw, 
  Archive, 
  Search, 
  TrendingUp,
  DollarSign
} from "lucide-react";
import StatCard from "./StatCard.jsx";

const API_BASE = "http://localhost:5001/api";

export default function Report() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // State for row-specific inputs (managed by product ID)
  const [stockInputs, setStockInputs] = useState({});

  // Stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    totalValue: 0,
  });

  const [form, setForm] = useState({
    product_name: "",
    expiry_date: "",
    categoryId: "",
    price: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch(`${API_BASE}/products`),
        fetch(`${API_BASE}/categories`),
      ]);

      const prods = await prodRes.json();
      const cats = await catRes.json();

      setProducts(prods);
      setCategories(cats);
      
      // --- BUG FIX & CALCULATION ---
      let lowStockCount = 0;
      let inventoryValue = 0;

      prods.forEach(p => {
        // Calculate total stock for this product
        const currentStock = p.stocks?.reduce((sum, s) => sum + s.quantity, 0) || 0;
        
        // Count low stock
        if (currentStock < 10) lowStockCount++;

        // Fix: Value = Price * Quantity (handled safe parsing)
        inventoryValue += (Number(p.price) || 0) * currentStock;
      });

      setStats({
        totalProducts: prods.length,
        lowStock: lowStockCount,
        totalValue: inventoryValue
      });
      
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    await fetch(`${API_BASE}/products/${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleStockInputChange = (id, value) => {
    setStockInputs(prev => ({ ...prev, [id]: value }));
  };

  const handleAddStock = async (productId) => {
    const qtyStr = stockInputs[productId];
    const qty = Number(qtyStr);

    if (!qty || qty <= 0) return alert("Invalid quantity");

    const res = await fetch(`${API_BASE}/stock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: qty }),
    });

    if (res.ok) {
      fetchData();
      // Clear specific input
      setStockInputs(prev => ({ ...prev, [productId]: "" }));
    }
  };

  const handleFilterSales = async () => {
  if (!fromDate || !toDate) {
    alert("Please select both From and To dates");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/sales/filter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from_date: fromDate,
        to_date: toDate
      })
    });

    if (!res.ok) {
      return alert("Error fetching filtered sales");
    }

    const data = await res.json();
    setSales(data); // Update the UI with filtered results
  } catch (error) {
    console.error("Filter Error:", error);
    alert("Something went wrong!");
  }
};



  // Filter products for search
  const filteredProducts = products.filter(p => 
    p.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Report</h1>
          <p className="text-gray-500 mt-1">Inventory Report</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchData} 
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm font-medium"
          >
            <RefreshCw size={18} className={loading ? "animate-spin text-blue-600" : "text-gray-500"} /> 
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
 

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Product List */}
        <div className="xl:col-span-3 space-y--6">
             <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Archive className="text-blue-600" size={20} /> Current Inventory
              </h2>
              </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            
            {/* Table Header / Search */}
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
            <form className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 " onSubmit={handleFilterSales} >
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">From</label>
                <div className="relative">
                  <input
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    type="date"
                    placeholder="To Date"
                                    //onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                  />
                </div>
              </div>
                <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">To</label>
                <div className="relative">
                  <input
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    type="date"
                    placeholder="From Date"
                                   
                    required
                  />
                </div>
              </div>
                <button
                                onClick={() => handleFilterSales(p.product_id)}
                                className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700 transition shadow-sm"
                                title="Filter"
                              >
                                <Search size={18} />
                              </button>
       
            </form>
                   <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full sm:w-64 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                  <tr>
                     <th className="p-4 w-[25%]">Sl No</th>
                    <th className="p-4 w-[25%]">Product</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Value</th>
                   
                   
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center p-12 text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <Package size={40} className="text-gray-300" />
                          <p>No products found matching your search.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p,index) => {
                      const totalStock = p.stocks?.reduce((sum, s) => sum + s.quantity, 0) || 0;
                      const stockValue = (p.price || 0) * totalStock;
                      const isLowStock = totalStock < 10;

                      return (
                        <tr key={p.product_id} className="hover:bg-blue-50/30 transition-colors group">
                             <td className="p-4">
                            <div className="font-medium text-gray-900">{index + 1}</div>
            
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-gray-900">{p.product_name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {p.category?.category_name || "Uncategorized"}
                            </div>
                          </td>
                          <td className="p-4 text-gray-700 font-medium">₹{p.price}</td>
                          <td className="p-4">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              isLowStock 
                                ? "bg-red-50 text-red-700 border-red-100" 
                                : "bg-green-50 text-green-700 border-green-100"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isLowStock ? 'bg-red-500' : 'bg-green-500'}`}></span>
                              {totalStock}
                            </div>
                          </td>
                          <td className="p-4 text-gray-600">
                             ₹{stockValue.toLocaleString()}
                          </td>
                        
                         
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      

      </div>
    </div>
  );
}
