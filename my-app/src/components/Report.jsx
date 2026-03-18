import { useState } from "react";
import { Search, Calendar, Loader2 } from "lucide-react";

const API_BASE = "http://localhost:5001/api";

export default function SalesReport() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    if (!fromDate || !toDate) {
      alert("Please select both From Date and To Date");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `${API_BASE}/report?from=${fromDate}&to=${toDate}`
      );

      if (!res.ok) throw new Error("Unable to fetch Sales Report");

      const data = await res.json();
      setReport(data);

    } catch (err) {
      console.error(err);
      alert("Error fetching report");
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = report.reduce((sum, row) => sum + row.total_price, 0);

  return (
    <div className="p-6">
      {/* PAGE TITLE */}
      <h1 className="text-2xl font-semibold mb-6 text-blue-700">
        Sales Report
      </h1>

      {/* FILTER SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

        {/* From Date */}
        <div>
          <label className="block mb-1 font-medium">From Date</label>
          <div className="flex items-center gap-2 border p-2 rounded-md">
            <Calendar size={18} />
            <input
              type="date"
              className="outline-none w-full"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
        </div>

        {/* To Date */}
        <div>
          <label className="block mb-1 font-medium">To Date</label>
          <div className="flex items-center gap-2 border p-2 rounded-md">
            <Calendar size={18} />
            <input
              type="date"
              className="outline-none w-full"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </div>

        {/* Fetch Button */}
        <div className="flex items-end">
          <button
            onClick={fetchReport}
            className="bg-blue-600 text-white flex items-center gap-2 px-4 py-2 rounded-md hover:bg-blue-700 w-full md:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Loading...
              </>
            ) : (
              <>
                <Search size={18} />
                Fetch Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* SUMMARY CARD */}
      {report.length > 0 && (
        <div className="bg-green-100 border border-green-300 p-4 rounded-md mb-4">
          <p className="text-lg font-semibold text-green-800">
            Total Sales Amount: ₹ {totalAmount.toFixed(2)}
          </p>
        </div>
      )}

      {/* TABLE */}
      <div className="overflow-auto mt-4">
        <table className="min-w-full bg-white border border-gray-300 rounded-md">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2 border">#</th>
              <th className="px-4 py-2 border">Date</th>
              <th className="px-4 py-2 border">Product</th>
              <th className="px-4 py-2 border">Category</th>
              <th className="px-4 py-2 border">Qty</th>
              <th className="px-4 py-2 border">Total Price (₹)</th>
            </tr>
          </thead>

          <tbody>
            {report.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-4">
                  No data found
                </td>
              </tr>
            ) : (
              report.map((item, index) => (
                <tr key={index} className="border hover:bg-gray-50">
                  <td className="px-4 py-2 border">{index + 1}</td>
                  <td className="px-4 py-2 border">{new Date(item.date).toLocaleDateString()}</td>
<td className="px-4 py-2 border">{item.product?.product_name}</td>
<td className="px-4 py-2 border">{item.product?.category?.category_name}</td>
                  <td className="px-4 py-2 border">{item.quantity}</td>
                  <td className="px-4 py-2 border">
                    ₹ {item.total_price.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
