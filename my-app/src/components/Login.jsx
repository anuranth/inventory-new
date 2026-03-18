import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BarChart3, Lock, LogIn, ShieldCheck, Sparkles, User } from "lucide-react";

export default function Login({ onLogin }) {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:5001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        onLogin(data);
        navigate("/");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Server error. Is the backend running?");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#dbeafe,_#f8fafc_36%,_#e2e8f0_100%)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="motion-float absolute -left-16 top-14 h-56 w-56 rounded-full bg-cyan-300/35 blur-3xl" />
        <div className="motion-float-delayed absolute right-0 top-0 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="motion-float-slow absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="motion-grid absolute inset-0 opacity-40" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-8 md:px-8">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="motion-rise hidden rounded-[2rem] border border-white/60 bg-slate-950/88 p-8 text-white shadow-2xl backdrop-blur lg:block">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm text-blue-100">
                <Sparkles size={16} />
                AI-powered inventory operations
              </div>

              <h1 className="mt-6 text-5xl font-black tracking-tight">
                Smart Inventory
                <span className="block bg-gradient-to-r from-cyan-300 via-blue-300 to-emerald-300 bg-clip-text text-transparent">
                  Built for fast decisions
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
                Manage products, billing, reports, forecasting, and weather-based stock alerts from one motion-rich dashboard.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                  <BarChart3 className="text-cyan-300" size={20} />
                  <p className="mt-3 text-sm font-semibold">Demand Forecasts</p>
                  <p className="mt-1 text-xs text-slate-300">Track future stock demand with AI insights.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                  <ShieldCheck className="text-emerald-300" size={20} />
                  <p className="mt-3 text-sm font-semibold">Secure Access</p>
                  <p className="mt-1 text-xs text-slate-300">Protected login for staff and admin roles.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                  <LogIn className="text-blue-300" size={20} />
                  <p className="mt-3 text-sm font-semibold">Quick Billing</p>
                  <p className="mt-1 text-xs text-slate-300">Move from product search to billing in seconds.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="motion-rise-delayed mx-auto w-full max-w-md rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-[0_25px_80px_rgba(15,23,42,0.16)] backdrop-blur-xl">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-200">
                <LogIn size={32} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Welcome Back</h2>
              <p className="mt-2 text-sm text-slate-500">Sign in to continue managing your smart store</p>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-3 text-center text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-4 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Username"
                  className="w-full rounded-xl border border-slate-200 bg-white/90 py-3 pl-11 pr-4 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-4 text-slate-400" size={18} />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full rounded-xl border border-slate-200 bg-white/90 py-3 pl-11 pr-4 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Sign In
                <ArrowRight size={18} className="transition group-hover:translate-x-1" />
              </button>
            </form>

            <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs text-slate-500">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-bold text-slate-900">24/7</p>
                <p>Access</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-bold text-slate-900">AI</p>
                <p>Insights</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-bold text-slate-900">Live</p>
                <p>Alerts</p>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-slate-600">
              Don't have an account?{" "}
              <Link to="/signup" className="font-semibold text-blue-600 hover:underline">
                Sign up
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
