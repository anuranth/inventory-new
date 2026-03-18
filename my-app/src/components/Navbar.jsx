// src/components/Navbar.jsx
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center">
      <h1 className="text-xl font-semibold">Smart Inventory</h1>
      <div className="space-x-4">
        <Link
          to="/"
          className={`hover:underline ${pathname === "/" ? "font-bold underline" : ""}`}
        >
          Dashboard
        </Link>
        <Link
          to="/sales"
          className={`hover:underline ${pathname === "/sales" ? "font-bold underline" : ""}`}
        >
          Sales
        </Link>
         <Link
          to="/report"
          className={`hover:underline ${pathname === "/report" ? "font-bold underline" : ""}`}
        >
          Report
        </Link>
      </div>
    </nav>
  );
}
