import { useState, useEffect } from "react";
import { Plus, Tag, Layers } from "lucide-react";

const CATEGORY_API = "http://localhost:5001/api/categories";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  const loadCategories = async () => {
    try {
      const res = await fetch(CATEGORY_API);
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const addCategory = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const res = await fetch(CATEGORY_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category_name: name }),
    });

    if (res.ok) {
      setName("");
      loadCategories();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Layers className="text-blue-600" /> Categories
          </h1>
          <p className="text-gray-500 text-sm">Organize your products into categories.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-center">
        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Tag size={24} />
        </div>
        <form onSubmit={addCategory} className="flex-1 flex gap-3">
            <input
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="New Category Name (e.g., Electronics, Food)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            />
            <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
            >
            <Plus size={18} /> Add
            </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
             <p className="text-gray-400 col-span-full text-center py-10">Loading...</p>
        ) : categories.length === 0 ? (
            <p className="text-gray-400 col-span-full text-center py-10">No categories found.</p>
        ) : (
            categories.map((c) => (
            <div key={c.category_id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition">
                <span className="font-medium text-gray-700">{c.category_name}</span>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">ID: {c.category_id}</span>
            </div>
            ))
        )}
      </div>
    </div>
  );
}
