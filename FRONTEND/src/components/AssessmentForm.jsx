import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  Building2, Factory, Users, DollarSign, MessageSquare,
  ArrowRight, CheckCircle2, Circle, Loader2, AlertCircle
} from "lucide-react";
import { ZyntraIcon } from "./ZyntraLogo";

const BACKEND_URL = "http://localhost:5000";

function AssessmentForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    companyName: "",
    industry: "",
    employees: "",
    revenue: "",
    challenges: ""
  });

  const [loading, setLoading]                     = useState(false);
  const [error, setError]                         = useState("");
  const [progressMessages, setProgressMessages]   = useState([]);
  const [currentStage, setCurrentStage]           = useState("");
  const [progressPercent, setProgressPercent]     = useState(0);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    setProgressMessages([]);
    setCurrentStage("");
    setProgressPercent(0);

    try {
      const token =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken");

      let analysisResult = null;

      await new Promise((resolve, reject) => {
        fetch(`${BACKEND_URL}/analyze/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(formData)
        })
          .then((response) => {
            if (!response.ok || !response.body) {
              throw new Error("SSE stream could not be opened.");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let progressCount = 0;
            const TOTAL_STAGES = 13;

            const pump = () => {
              reader.read().then(({ done, value }) => {
                if (done) { resolve(); return; }

                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split("\n\n");
                buffer = parts.pop();

                for (const part of parts) {
                  const lines = part.split("\n");
                  let eventType = "message";
                  let dataStr = "";

                  for (const line of lines) {
                    if (line.startsWith("event: ")) eventType = line.slice(7).trim();
                    else if (line.startsWith("data: ")) dataStr = line.slice(6).trim();
                  }

                  if (!dataStr) continue;
                  try {
                    const payload = JSON.parse(dataStr);
                    if (eventType === "progress") {
                      progressCount++;
                      const pct = Math.min(Math.round((progressCount / TOTAL_STAGES) * 95), 95);
                      setProgressMessages((prev) => [...prev, payload.message]);
                      setCurrentStage(payload.message);
                      setProgressPercent(pct);
                    } else if (eventType === "done") {
                      analysisResult = payload;
                      setProgressPercent(100);
                      setCurrentStage("Report ready!");
                    } else if (eventType === "error") {
                      reject(new Error(payload.message || "Analysis failed"));
                      return;
                    }
                  } catch { /* skip malformed */ }
                }
                pump();
              }).catch(reject);
            };
            pump();
          })
          .catch(reject);
      });

      if (!analysisResult) throw new Error("No analysis result received.");

      let savedData = analysisResult;
      try {
        const saveRes = await api.post("/reports/save", analysisResult);
        if (saveRes.data?.report) savedData = saveRes.data.report;
      } catch (saveErr) {
        console.error("Failed to save report:", saveErr);
      }

      navigate("/report", { state: { reportData: savedData } });
    } catch (err) {
      console.error(err);
      try {
        setCurrentStage("Falling back to standard analysis...");
        const response = await api.post("/analyze", formData);
        let savedData = response.data;
        try {
          const saveRes = await api.post("/reports/save", response.data);
          if (saveRes.data?.report) savedData = saveRes.data.report;
        } catch {}
        navigate("/report", { state: { reportData: savedData } });
        return;
      } catch (fallbackErr) {
        setError(fallbackErr.response?.data?.message || err.message || "Unable to connect to backend service.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="assessment" className="max-w-4xl mx-auto px-4 py-10 animate-fadeInUp">
      <div className="card overflow-hidden shadow-md">
        {/* Card Header */}
        <div className="px-8 py-6 border-b border-[#E2E8F0] bg-white">
          <div className="flex items-start justify-between">
            <div>
              <span className="badge badge-blue mb-3">ZYNTRA AI Intelligence Engine</span>
              <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight font-heading">
                Business Transformation Profiler
              </h2>
              <p className="text-[#64748B] text-sm mt-1.5 font-medium">
                From Business Problems to AI Solutions. Provide parameters to receive an executive strategy deliverable.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <span className="text-xs font-semibold text-[#64748B]">ZYNTRA RAG Active</span>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-8 mt-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-medium">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Pipeline */}
        {loading ? (
          <div className="px-8 py-10">
            <div className="max-w-lg mx-auto space-y-6">
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <ZyntraIcon size={22} className="text-blue-600 animate-spin" />
                  <h4 className="text-base font-bold text-[#0F172A] font-heading">Generating ZYNTRA Executive Deliverable</h4>
                </div>
                <p className="text-[13px] text-[#64748B] font-medium">{currentStage || "Initializing ZYNTRA multi-stage pipeline..."}</p>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="bg-[#E2E8F0] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-700"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-[#94A3B8]">
                  <span>Processing</span>
                  <span className="font-semibold text-[#64748B]">{progressPercent}%</span>
                </div>
              </div>

              {/* Stage list */}
              <div className="space-y-1">
                {progressMessages.map((msg, i) => (
                  <div
                    key={i}
                    className="pipeline-step done animate-fadeIn"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="pipeline-step-icon">
                      <CheckCircle2 size={12} />
                    </div>
                    <span className="text-[13px] text-[#334155] font-medium">{msg}</span>
                  </div>
                ))}
                {progressPercent < 100 && (
                  <div className="pipeline-step active">
                    <div className="pipeline-step-icon">
                      <Loader2 size={12} className="animate-spin" />
                    </div>
                    <span className="text-[13px] text-blue-600 font-medium">Processing...</span>
                  </div>
                )}
                {[...Array(Math.max(0, 4 - progressMessages.length))].map((_, i) => (
                  <div key={`wait-${i}`} className="pipeline-step waiting">
                    <div className="pipeline-step-icon">
                      <Circle size={10} />
                    </div>
                    <div className="h-3 skeleton w-36 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <FormField
                label="Company Name"
                icon={<Building2 size={14} />}
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="e.g. Acme Corporation"
                required
              />
              <FormField
                label="Industry Sector"
                icon={<Factory size={14} />}
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                placeholder="e.g. Healthcare · FinTech · Manufacturing"
                required
              />
              <FormField
                label="Headcount (Employees)"
                icon={<Users size={14} />}
                name="employees"
                value={formData.employees}
                onChange={handleChange}
                placeholder="e.g. 2500"
                type="number"
                required
              />
              <FormField
                label="Annual Revenue (USD)"
                icon={<DollarSign size={14} />}
                name="revenue"
                value={formData.revenue}
                onChange={handleChange}
                placeholder="e.g. 50000000"
                type="number"
                required
              />
            </div>

            <div className="mb-8">
              <label className="form-label flex items-center gap-1.5">
                <MessageSquare size={13} className="text-[#64748B]" />
                Primary Business Challenge or Operational Goal
              </label>
              <textarea
                name="challenges"
                rows={5}
                placeholder="Describe primary operational bottlenecks, data silos, manual processes, or target efficiency gains..."
                value={formData.challenges}
                onChange={handleChange}
                required
                className="form-input resize-none"
              />
              <p className="text-[12px] text-[#94A3B8] mt-1.5 font-medium">
                Detailed input allows ZYNTRA AI to retrieve precise knowledge base evidence.
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 pt-2 border-t border-[#E2E8F0]">
              <div className="flex items-center gap-1.5 text-[12px] text-[#94A3B8] font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span>ZYNTRA AI Engine · MongoDB Atlas Vector Search + Groq LLaMA</span>
              </div>
              <button type="submit" className="btn btn-primary btn-lg shadow-md shadow-blue-600/20 font-heading">
                Generate ZYNTRA Report
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function FormField({ label, icon, name, value, onChange, placeholder, type = "text", required }) {
  return (
    <div>
      <label className="form-label flex items-center gap-1.5">
        <span className="text-[#64748B]">{icon}</span>
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="form-input"
      />
    </div>
  );
}

export default AssessmentForm;