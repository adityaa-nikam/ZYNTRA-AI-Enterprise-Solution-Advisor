import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ZyntraLogo from "./ZyntraLogo";
import {
  Home, FlaskConical, ShieldAlert,
  LogOut, ChevronDown, Settings
} from "lucide-react";
import { useState } from "react";

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 w-full bg-[#0F172A] border-b border-[#1E293B]">
      <div className="max-w-screen-xl mx-auto px-5 h-14 flex items-center justify-between gap-4">

        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <ZyntraLogo size={24} variant="light" />
        </Link>

        {/* Center Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink to="/" active={isActive("/")}>
            <Home size={13} />
            Home
          </NavLink>
          <NavLink to="/rag-test" active={isActive("/rag-test")}>
            <FlaskConical size={13} />
            RAG Tester
          </NavLink>
          {user?.role === "Admin" && (
            <NavLink to="/admin" active={isActive("/admin")} danger>
              <ShieldAlert size={13} />
              Admin
            </NavLink>
          )}
        </div>

        {/* Right Auth Menu */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                  <span className="text-blue-300 text-xs font-bold">
                    {user?.name ? user.name[0].toUpperCase() : "U"}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-[13px] font-semibold text-slate-200 leading-none">{user?.name}</p>
                  <span className={`text-[10px] font-semibold mt-0.5 inline-block px-1.5 py-px rounded leading-none
                    ${user?.role === "Admin" ? "text-red-400" : user?.role === "Consultant" ? "text-amber-400" : "text-blue-400"}`}>
                    {user?.role || "Client"}
                  </span>
                </div>
                <ChevronDown size={13} className="text-slate-500" />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-1 w-44 bg-[#1E293B] border border-[#334155] rounded-xl shadow-2xl overflow-hidden py-1 animate-fadeIn"
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                  <Link
                    to="/"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Settings size={13} /> Settings
                  </Link>
                  <div className="h-px bg-[#334155] my-1" />
                  <button
                    onClick={() => { logout(); setUserMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
                  >
                    <LogOut size={13} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn btn-ghost text-slate-300 hover:text-white text-[13px] px-3 py-1.5">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary text-[13px] py-1.5">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, active, danger, children }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors
        ${active
          ? "bg-white/10 text-white"
          : danger
            ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
            : "text-slate-400 hover:text-white hover:bg-white/5"
        }`}
    >
      {children}
    </Link>
  );
}

export default Navbar;