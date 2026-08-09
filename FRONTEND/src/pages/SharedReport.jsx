import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import KnowledgeSourcesSection from "../components/KnowledgeSourcesSection";

function SharedReport() {
  const { shareToken } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSharedReport = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/reports/share/${shareToken}`);
        if (res.data.success && res.data.report) {
          setReport(res.data.report);
        } else {
          setError("Shared report not found or link expired.");
        }
      } catch (err) {
        console.error("Fetch Shared Report Error:", err);
        setError("Unable to load shared report deliverable.");
      } finally {
        setLoading(false);
      }
    };

    fetchSharedReport();
  }, [shareToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between">
        <Navbar />
        <div className="flex flex-col items-center justify-center my-20">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-300 font-medium">Loading ZYNTRA AI Shared Report...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <div className="max-w-xl mx-auto my-20 p-8 bg-white rounded-xl shadow-md border border-slate-200 text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Shared Link Expired</h2>
          <p className="text-slate-600 mb-6">{error || "This ZYNTRA AI shared deliverable link is invalid."}</p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition"
          >
            ← Return to Assessment
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const company = report.company || "Enterprise Client";
  const analysis = report.analysis || {};
  const sourcesUsed = report.sourcesUsed || analysis.sourcesUsed || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between">
      <Navbar />

      <header className="bg-slate-900 text-white py-6 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold px-2.5 py-0.5 rounded uppercase tracking-wider">
              ZYNTRA AI Public Deliverable
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1 font-heading">
              {report.title || `${company} ZYNTRA AI Strategy Deliverable`}
            </h1>
          </div>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm"
          >
            Create Your Own ZYNTRA Report →
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-grow space-y-8">
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-8">
          <div>
            <h3 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
              <span className="w-2 h-5 bg-blue-600 rounded-sm"></span>
              Executive Summary
            </h3>
            <p className="text-slate-700 text-base leading-relaxed mt-4 bg-slate-50/70 p-5 rounded-lg border border-slate-200/80">
              {analysis.executiveSummary}
            </p>
          </div>

          {/* Retrieved Knowledge Sources & RAG Citations Section */}
          <KnowledgeSourcesSection sources={sourcesUsed} />

          <div>
            <h3 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
              <span className="w-2 h-5 bg-emerald-600 rounded-sm"></span>
              Strategic AI Recommendations
            </h3>
            <div className="space-y-5 mt-6">
              {(analysis.recommendations || []).map((rec, index) => (
                <div key={index} className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                  <h4 className="text-lg font-bold text-slate-900 mb-2">
                    <span className="text-blue-600">0{index + 1}.</span> {rec.title}
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed">{rec.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default SharedReport;
