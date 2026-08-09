import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ZyntraLogo from "../components/ZyntraLogo";
import { Mail, Lock, AlertCircle, Loader2, ArrowRight } from "lucide-react";

function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login, error, setError } = useAuth();

  const [formData, setFormData]   = useState({ email: "", password: "", rememberMe: true });
  const [submitting, setSubmitting] = useState(false);
  const from = location.state?.from?.pathname || "/";

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await login(formData.email, formData.password, formData.rememberMe);
    setSubmitting(false);
    if (res?.success) navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md animate-fadeInUp">
          {/* Brand mark */}
          <div className="flex flex-col items-center mb-8 text-center space-y-1">
            <ZyntraLogo size={36} variant="dark" />
            <p className="text-[12px] text-[#64748B] font-semibold mt-1">Enterprise Intelligence. Engineered.</p>
          </div>

          <div className="card p-8 shadow-md">
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight font-heading">Sign in to ZYNTRA AI</h1>
              <p className="text-[13px] text-[#64748B] mt-1.5">Access your AI strategy reports, roadmaps, and analytics.</p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-lg text-[13px] mb-5">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <Mail size={12} className="text-[#64748B]" /> Work Email
                </label>
                <input
                  type="email" name="email" placeholder="name@company.com"
                  value={formData.email} onChange={handleChange} required
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <Lock size={12} className="text-[#64748B]" /> Password
                </label>
                <input
                  type="password" name="password" placeholder="••••••••"
                  value={formData.password} onChange={handleChange} required
                  className="form-input"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox" id="rememberMe" name="rememberMe"
                  checked={formData.rememberMe} onChange={handleChange}
                  className="w-4 h-4 rounded border-[#CBD5E1] text-blue-600 accent-blue-600"
                />
                <label htmlFor="rememberMe" className="text-[13px] text-[#64748B] cursor-pointer">
                  Remember me for 7 days
                </label>
              </div>

              <button
                type="submit" disabled={submitting}
                className="btn btn-primary btn-lg w-full justify-center mt-2 shadow-md shadow-blue-600/20"
              >
                {submitting ? (
                  <><Loader2 size={15} className="animate-spin" /> Authenticating...</>
                ) : (
                  <>Sign In to Platform <ArrowRight size={15} /></>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-[#E2E8F0] text-center text-[13px] text-[#64748B]">
              Don't have an enterprise account?{" "}
              <Link to="/register" className="text-blue-600 font-semibold hover:underline">
                Create account
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Login;
