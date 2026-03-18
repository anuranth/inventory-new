import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Moon,
  LayoutDashboard, 
  ShoppingCart, 
  Sun,
  Tags, 
  BrainCircuit,
  LogOut, 
  Menu, 
  X, 
  UserCircle 
} from "lucide-react";

export default function Sidebar({ role, user, theme, onToggleTheme }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  const NavItem = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        onClick={() => setIsOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
          isActive
            ? "bg-blue-600 text-white shadow-md"
            : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
        }`}
      >
        <Icon size={20} className={isActive ? "text-white" : "text-gray-500 group-hover:text-blue-600"} />
        <span className="font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="theme-mobile-toggle md:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-lg shadow-md text-gray-700"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`theme-sidebar fixed md:relative inset-y-0 left-0 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-40 flex flex-col
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-blue-200">
            SI
          </div>
          <div>
            <h1 className="font-bold text-gray-800 text-lg leading-tight">Smart Inv</h1>
            <p className="text-xs text-gray-500">Management System</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/sales" icon={ShoppingCart} label="Sales" />
          <NavItem to="/ai-insights" icon={BrainCircuit} label="AI Insights" />
          {role === "admin" && (
            <NavItem to="/categories" icon={Tags} label="Categories" />
          )}
           {role === "admin" && (
            <NavItem to="/report" icon={Tags} label="Report" />
          )}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onToggleTheme}
            className="theme-toggle-button mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors"
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </button>
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="bg-blue-100 p-2 rounded-full text-blue-600">
              <UserCircle size={24} />
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-sm text-gray-900 truncate capitalize">{user?.username || "User"}</p>
              <p className="text-xs text-gray-500 capitalize">{role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}
