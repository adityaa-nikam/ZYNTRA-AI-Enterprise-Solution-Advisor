import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ZyntraLogo from "../components/ZyntraLogo";
import { User, Mail, Lock, Building2, AlertCircle, Loader2, ArrowRight } from "lucide-react";

function Register() {
  const navigate = useNavigate();
  const { register, error, setError } = useAuth();

  const [formData, setFormData] = useState({
    name: "", email: "", password: "", role: "Client", company: "", rememberMe: true
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await register(
      { name: formData.name, email: formData.email, password: formData.password, role: formData.role, company: formData.company },
      formData.rememberMe
    );
    setSubmitting(false);
    if (res?.success) navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg animate-fadeInUp">
          {/* Brand mark */}
          <div className="flex flex-col items-center mb-8 text-center space-y-1">
            <ZyntraLogo size={36} variant="dark" />
            <p className="text-[12px] text-[#64748B] font-semibold mt-1">Enterprise Intelligence. Engineered.</p>
          </div>

          <div className="card p-8 shadow-md">
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight font-heading">Create ZYNTRA AI Account</h1>
              <p className="text-[13px] text-[#64748B] mt-1.5">Join as a Client, Consultant, or Administrator.</p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-lg text-[13px] mb-5">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label flex items-center gap-1.5"><User size={12} className="text-[#64748B]" /> Full Name</label>
                <input type="text" name="name" placeholder="Aditya Nikam" value={formData.name} onChange={handleChange} required className="form-input" />
              </div>
              <div>
                <label className="form-label flex items-center gap-1.5"><Mail size={12} className="text-[#64748B]" /> Work Email</label>
                <input type="email" name="email" placeholder="name@company.com" value={formData.email} onChange={handleChange} required className="form-input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label flex items-center gap-1.5"><Building2 size={12} className="text-[#64748B]" /> Company</label>
                  <input type="text" name="company" placeholder="Acme Corp" value={formData.company} onChange={handleChange} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Account Role</label>
                  <select name="role" value={formData.role} onChange={handleChange}
                    className="form-input bg-white">
                    <option value="Client">Client</option>
                    <option value="Consultant">Consultant</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label flex items-center gap-1.5"><Lock size={12} className="text-[#64748B]" /> Password</label>
                <input type="password" name="password" placeholder="Minimum 6 characters" value={formData.password} onChange={handleChange} required minLength={6} className="form-input" />
              </div>

              <button
                type="submit" disabled={submitting}
                className="btn btn-primary btn-lg w-full justify-center mt-2 shadow-md shadow-blue-600/20"
              >
                {submitting ? (
                  <><Loader2 size={15} className="animate-spin" /> Creating Account...</>
                ) : (
                  <>Create ZYNTRA AI Account <ArrowRight size={15} /></>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-[#E2E8F0] text-center text-[13px] text-[#64748B]">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-600 font-semibold hover:underline">Sign In</Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Register;
