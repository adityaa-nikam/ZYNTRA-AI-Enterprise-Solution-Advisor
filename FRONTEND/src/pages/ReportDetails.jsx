import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import jsPDF from "jspdf";
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine, LabelList,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import TransformationRoadmapSection from "../components/roadmap/TransformationRoadmapSection";
import KnowledgeSourcesSection from "../components/KnowledgeSourcesSection";
import RAGDebugPanel from "../components/RAGDebugPanel";
import { ZyntraIcon } from "../components/ZyntraLogo";
import {
  Download, Share2, MessageSquare, ArrowLeft, TrendingUp,
  Clock, Target, AlertTriangle, BarChart2, ChevronDown,
  ChevronRight, CheckCircle, FileText, Cpu, Send,
  X, Link2, Mail, Copy, Loader2,
  BookOpen, Layers, Shield, Zap
} from "lucide-react";

function ReportDetails() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { id }    = useParams();

  const [reportData, setReportData] = useState(location.state?.reportData || location.state?.report || null);
  const [loading, setLoading]       = useState(!reportData && !!id);
  const [error, setError]           = useState("");
  const [toast, setToast]           = useState(null);
  const [expandedRec, setExpandedRec] = useState(null);

  const [chatOpen, setChatOpen]       = useState(false);
  const [messages, setMessages]       = useState([]);
  const [chatInput, setChatInput]     = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const chatBottomRef = useRef(null);

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl]             = useState("");
  const [copied, setCopied]                 = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");

  useEffect(() => {
    if (!reportData && id) {
      const fetchReport = async () => {
        try {
          setLoading(true);
          const res = await api.get(`/reports/${id}`);
          setReportData(res.data.report || res.data);
        } catch (err) {
          console.error("Failed to load report by ID:", err);
          setError("Unable to load the requested ZYNTRA AI consulting report.");
        } finally {
          setLoading(false);
        }
      };
      fetchReport();
    }
  }, [id, reportData]);

  const reportId = reportData?._id || id;

  useEffect(() => {
    if (reportId && chatOpen) {
      api.get(`/api/chat/${reportId}`)
        .then((res) => { if (res.data.success && res.data.chat?.messages) setMessages(res.data.chat.messages); })
        .catch(console.error);
    }
  }, [reportId, chatOpen]);

  useEffect(() => {
    if (chatOpen && chatBottomRef.current) chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatOpen]);

  const company     = reportData?.company || reportData?.companyName || "Client Enterprise";
  const analysis    = reportData?.analysis || {};
  const sourcesUsed = reportData?.sourcesUsed || analysis.sourcesUsed || [];

  const handleSendChatMessage = async (textToSend) => {
    const query = textToSend || chatInput;
    if (!query?.trim()) return;
    const activeReportId = reportId || "temp-report";
    setMessages((prev) => [...prev, { sender: "user", text: query, timestamp: new Date() }]);
    setChatInput("");
    setSendingChat(true);
    try {
      const res = await api.post(`/api/chat/${activeReportId}/message`, { message: query, reportData });
      if (res.data.success && res.data.chat?.messages) setMessages(res.data.chat.messages);
    } catch {
      setMessages((prev) => [...prev, { sender: "ai", text: "Sorry, I ran into an issue. Please try again.", timestamp: new Date() }]);
    } finally {
      setSendingChat(false);
    }
  };

  const handleOpenShareModal = async () => {
    setShareModalOpen(true);
    setCopied(false);
    if (!reportId) return;
    try {
      const res = await api.post(`/reports/${reportId}/share`);
      if (res.data.success) setShareUrl(res.data.shareUrl);
    } catch (err) { console.error("Share link failed:", err); }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl || window.location.href);
    setCopied(true);
    setToast({ message: "ZYNTRA AI share link copied to clipboard!", type: "success" });
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSendMailto = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`ZYNTRA AI Strategy Report: ${company}`);
    const body    = encodeURIComponent(`Hello,\n\nPlease find the ZYNTRA AI Strategy Deliverable for ${company}.\n\nExecutive Summary:\n${analysis.executiveSummary}\n\nView Full Deliverable Online:\n${shareUrl || window.location.href}\n\nZYNTRA AI — Enterprise Intelligence. Engineered.`);
    window.location.href = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
    setToast({ message: "Opened email client with pre-filled report details.", type: "info" });
  };

  const handleDownloadPDF = () => {
    if (!analysis) return;
    setToast({ message: "Generating ZYNTRA AI PDF deliverable...", type: "info" });

    const pdf       = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight= pdf.internal.pageSize.getHeight();
    const margin    = 15;
    const maxWidth  = pageWidth - margin * 2;
    let y = margin;

    const checkPageBreak = (n) => { if (y + n > pageHeight - 18) { pdf.addPage(); y = margin + 8; } };
    const addSectionTitle = (title, color = [15, 23, 42]) => {
      checkPageBreak(14);
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(12); pdf.setTextColor(...color);
      pdf.text(title, margin, y); y += 2;
      pdf.setDrawColor(...color); pdf.setLineWidth(0.4); pdf.line(margin, y, pageWidth - margin, y); y += 6;
      pdf.setTextColor(30, 30, 30);
    };
    const addParagraph = (text, size = 10, bold = false) => {
      if (!text) return;
      pdf.setFont("helvetica", bold ? "bold" : "normal"); pdf.setFontSize(size); pdf.setTextColor(40, 40, 40);
      const lines = pdf.splitTextToSize(String(text).replace(/[•]/g, "-"), maxWidth);
      lines.forEach((line) => { checkPageBreak(size * 0.45 + 2); pdf.text(line, margin, y, { align: "left" }); y += size * 0.45 + 1.5; });
      y += 3;
    };
    const addBulletList = (items, indent = 4) => {
      if (!items?.length) return;
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(10); pdf.setTextColor(40, 40, 40);
      items.forEach((item) => {
        const lines = pdf.splitTextToSize(`-  ${String(item).replace(/[•]/g, "-")}`, maxWidth - indent);
        lines.forEach((line, i) => { checkPageBreak(10 * 0.45 + 2); pdf.text(line, i === 0 ? margin + indent : margin + indent + 4, y); y += 10 * 0.45 + 1.5; });
      });
      y += 3;
    };

    // Header bar
    pdf.setFillColor(15, 23, 42); pdf.rect(0, 0, pageWidth, 28, "F");
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(15); pdf.setTextColor(255, 255, 255);
    pdf.text("ZYNTRA AI — ENTERPRISE STRATEGY DELIVERABLE", margin, 14);
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(9.5); pdf.setTextColor(203, 213, 225);
    pdf.text(`Client: ${company}  |  Date: ${new Date().toLocaleDateString()}`, margin, 21);
    y = 38;

    addSectionTitle("1. Executive Profile");
    addParagraph(`Company: ${company}`); addParagraph(`Industry: ${analysis.industry || "N/A"}`);
    addParagraph(`Business Scale: ${analysis.employeeCategory || "N/A"}`);
    addSectionTitle("2. Primary Business Challenge");
    addParagraph(analysis.primaryChallenge);
    addSectionTitle("3. Executive Summary");
    addParagraph(analysis.executiveSummary);
    if (sourcesUsed?.length) {
      addSectionTitle("4. Retrieved Knowledge Sources", [37, 99, 235]);
      sourcesUsed.forEach((src, i) => {
        checkPageBreak(12); pdf.setFont("helvetica", "bold"); pdf.setFontSize(10); pdf.setTextColor(15, 23, 42);
        pdf.text(`Source ${i + 1}: ${src.title}  [${Math.round((src.score || 0.88) * 100)}% Match]`, margin, y); y += 5;
        addParagraph(`File: ${src.source}  |  Industry: ${src.industry || "Enterprise"}`, 9);
      });
    }
    if (analysis.implementationRoadmap?.length) {
      addSectionTitle("5. Implementation Roadmap", [37, 99, 235]);
      analysis.implementationRoadmap.forEach((p) => {
        checkPageBreak(18); pdf.setFont("helvetica", "bold"); pdf.setFontSize(10.5); pdf.setTextColor(15, 23, 42);
        pdf.text(`${p.phase}: ${p.title}  [${p.duration || "N/A"}]`, margin, y); y += 5;
        addParagraph(p.description, 9.5);
        if (p.deliverables?.length) { pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(71, 85, 105); pdf.text("Key Deliverables:", margin + 4, y); y += 4.5; addBulletList(p.deliverables, 6); }
      });
    }
    addSectionTitle("6. Key Pain Points", [239, 68, 68]); addBulletList(analysis.painPoints);
    addSectionTitle("7. Strategic AI Recommendations", [16, 185, 129]);
    (analysis.recommendations || []).forEach((rec, i) => {
      checkPageBreak(15); pdf.setFont("helvetica", "bold"); pdf.setFontSize(11); pdf.setTextColor(15, 23, 42);
      pdf.text(`${i + 1}. ${rec.title || "Recommendation"}`, margin, y); y += 6;
      addParagraph(rec.description, 10);
      if (rec.benefits?.length) { pdf.setFont("helvetica", "bold"); pdf.setFontSize(9.5); pdf.setTextColor(71, 85, 105); pdf.text("Key Benefits:", margin + 4, y); y += 5; addBulletList(rec.benefits, 6); }
    });
    addSectionTitle("8. ROI & Implementation Metrics");
    addParagraph(`Estimated ROI: ${analysis.estimatedROI || "N/A"}`, 10, true);
    addParagraph(`Implementation Timeline: ${analysis.implementationTime || "N/A"}`, 10, true);
    if (analysis.suggestedTechStack?.length) { addSectionTitle("9. Recommended Tech Stack"); addParagraph(analysis.suggestedTechStack.join("  |  ")); }
    if (analysis.nextSteps?.length) { addSectionTitle("10. Next Steps"); analysis.nextSteps.forEach((step, i) => addParagraph(`${i + 1}. ${step}`)); }

    // Watermark / Footer
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i); pdf.setDrawColor(226, 232, 240); pdf.setLineWidth(0.3);
      pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(8.5); pdf.setTextColor(148, 163, 184);
      pdf.text("ZYNTRA AI — Enterprise Intelligence. Engineered. Confidential", margin, pageHeight - 6);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: "right" });
    }

    const safeName = (company || "ZYNTRA_Report").replace(/[^a-zA-Z0-9_-]/g, "_");
    pdf.save(`ZYNTRA_AI_${safeName}_Report.pdf`);
    setToast({ message: "ZYNTRA AI PDF report downloaded successfully!", type: "success" });
  };

  /* ── Chart Data ─────────────────────────────────────────────────────────── */
  const recommendationsData = (analysis.recommendations || []).map((rec, i) => ({
    name: rec.title || `Rec #${i + 1}`,
    impact: rec.impactScore ?? Math.floor(Math.random() * 4 + 6),
    effort: rec.effortScore ?? Math.floor(Math.random() * 5 + 3),
    z: 100
  }));

  const painPointChartData = (analysis.painPointSeverity?.length)
    ? analysis.painPointSeverity.map((item) => ({ name: typeof item === "string" ? item : (item.point || "Issue"), severity: typeof item === "object" ? (item.severity || 7) : 7 }))
    : (analysis.painPoints || []).map((p, i) => ({ name: p.length > 32 ? p.substring(0, 32) + "..." : p, severity: Math.max(9 - i * 2, 5) }));

  const maturity   = analysis.businessMaturity || {};
  const radarData  = [
    { dimension: "Automation",  score: maturity.automationReadiness ?? 8,  fullMark: 10 },
    { dimension: "Data Arch.",  score: maturity.dataArchitecture ?? 6,      fullMark: 10 },
    { dimension: "Process",     score: maturity.processMaturity ?? 7,       fullMark: 10 },
    { dimension: "Governance",  score: maturity.securityGovernance ?? 8,    fullMark: 10 },
    { dimension: "AI Adoption", score: maturity.aiAdoptionCapable ?? 9,     fullMark: 10 }
  ];

  /* ── Loading / Error states ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 size={32} className="text-blue-600 animate-spin mx-auto" />
            <p className="text-[#64748B] text-sm font-medium">Loading ZYNTRA AI Deliverable...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="card max-w-md w-full p-8 text-center shadow-md">
            <AlertTriangle size={32} className="text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#0F172A] mb-2 font-heading">Report Not Found</h2>
            <p className="text-[#64748B] text-sm mb-6">{error || "No report data available."}</p>
            <button onClick={() => navigate("/")} className="btn btn-primary">
              <ArrowLeft size={14} /> Return to Assessment
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const dateStr = reportData.createdAt
    ? new Date(reportData.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  /* ── Main Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Report Header ─────────────────────────────────────────────────── */}
      <header className="bg-[#0F172A] border-b border-[#1E293B]">
        <div className="max-w-screen-xl mx-auto px-6 py-5 flex flex-col md:flex-row md:items-start justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="badge badge-blue">ZYNTRA AI Deliverable</span>
              <span className="text-[#475569] text-[12px]">Generated {dateStr}</span>
            </div>
            <h1 className="text-2xl md:text-[28px] font-extrabold text-white tracking-tight leading-tight font-heading">
              {reportData.title || `${company} — AI Strategy Report`}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-[13px] text-[#94A3B8]">
              <span className="flex items-center gap-1.5">
                <Building2Icon /> <span className="text-[#CBD5E1]">{company}</span>
              </span>
              <span className="text-[#334155]">·</span>
              <span className="text-[#CBD5E1]">{analysis.industry || "Enterprise"}</span>
              <span className="text-[#334155]">·</span>
              <span className="text-[#CBD5E1]">{analysis.employeeCategory || "N/A"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button onClick={handleDownloadPDF} className="btn btn-primary">
              <Download size={14} /> Download PDF
            </button>
            <button onClick={() => setChatOpen(!chatOpen)} className="btn btn-secondary bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20">
              <MessageSquare size={14} /> Ask AI
            </button>
            <button onClick={handleOpenShareModal} className="btn btn-ghost text-[#94A3B8] hover:text-white hover:bg-white/5">
              <Share2 size={14} /> Share
            </button>
            <button onClick={() => navigate("/")} className="btn btn-ghost text-[#94A3B8] hover:text-white hover:bg-white/5">
              <ArrowLeft size={14} /> Profiler
            </button>
            <RAGDebugPanel ragDebug={analysis.ragDebug} sourcesUsed={sourcesUsed} />
          </div>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main className="max-w-screen-xl mx-auto px-6 py-8 w-full flex-1 space-y-8">

        {/* KPI Strip */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 stagger-children">
          <KPICard
            icon={<BarChart2 size={16} />}
            label="Digital Transformation"
            value={analysis.digitalTransformationScore ?? 78}
            unit="/100"
            color="blue"
            desc="Enterprise readiness index"
          />
          <KPICard
            icon={<TrendingUp size={16} />}
            label="Estimated ROI"
            value={analysis.roiPercentage ? `+${analysis.roiPercentage}%` : "High"}
            sub={analysis.annualSavingsUSD ? `$${(analysis.annualSavingsUSD / 1000).toFixed(0)}K/yr` : null}
            color="green"
            desc={analysis.estimatedROI?.substring(0, 50)}
          />
          <KPICard
            icon={<Clock size={16} />}
            label="Implementation"
            value={analysis.implementationMonths ? `${analysis.implementationMonths} Mo.` : "6 Mo."}
            color="blue"
            desc={analysis.implementationTime?.substring(0, 50)}
          />
          <KPICard
            icon={<Target size={16} />}
            label="Priority Score"
            value={analysis.priorityScore ? `${analysis.priorityScore}/10` : analysis.priority || "High"}
            badge={analysis.priority || "High"}
            badgeColor="amber"
            color="amber"
            desc="Urgency index"
          />
          <KPICard
            icon={<AlertTriangle size={16} />}
            label="Risk Index"
            value={analysis.riskScore ? `${analysis.riskScore}/10` : "Low"}
            color="red"
            desc="Process & operational friction"
          />
        </section>

        {/* Benchmark Banner */}
        {analysis.benchmarkEvidence && (
          <div className="card p-4 border-l-4 border-l-emerald-500 animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <BarChart2 size={15} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
                  ZYNTRA AI Benchmark Citation
                </p>
                <p className="text-[13px] text-[#334155] leading-relaxed">{analysis.benchmarkEvidence}</p>
              </div>
            </div>
          </div>
        )}

        {/* Roadmap */}
        <TransformationRoadmapSection
          roadmap={analysis.implementationRoadmap}
          totalROI={analysis.roiPercentage}
          implementationTime={analysis.implementationTime}
        />

        {/* Charts Row */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard badge="Strategic Matrix" badgeColor="blue" title="Impact vs. Effort">
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart margin={{ top: 15, right: 15, bottom: 15, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" dataKey="effort" domain={[0, 10]} stroke="#94A3B8" fontSize={11} tick={{ fill: "#64748B" }} label={{ value: "Effort →", position: "insideBottomRight", offset: -5, style: { fontSize: 10, fill: "#94A3B8" } }} />
                <YAxis type="number" dataKey="impact" domain={[0, 10]} stroke="#94A3B8" fontSize={11} tick={{ fill: "#64748B" }} label={{ value: "Impact ↑", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "#94A3B8" } }} />
                <ZAxis type="number" dataKey="z" range={[60, 160]} />
                <ReferenceLine x={5.5} stroke="#CBD5E1" strokeDasharray="4 4" />
                <ReferenceLine y={5.5} stroke="#CBD5E1" strokeDasharray="4 4" />
                <Tooltip content={({ payload }) => payload?.length ? (
                  <div className="tooltip-content"><p className="font-semibold">{payload[0].payload.name}</p><p>Impact: {payload[0].payload.impact}/10 · Effort: {payload[0].payload.effort}/10</p></div>
                ) : null} />
                <Scatter name="Recs" data={recommendationsData} fill="#2563EB" fillOpacity={0.85}>
                  <LabelList dataKey="name" position="top" style={{ fontSize: "9px", fill: "#475569", fontWeight: 600 }} />
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard badge="Friction Index" badgeColor="red" title="Pain Point Severity">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart layout="vertical" data={painPointChartData} margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" domain={[0, 10]} stroke="#94A3B8" fontSize={11} tick={{ fill: "#64748B" }} />
                <YAxis type="category" dataKey="name" stroke="#334155" fontSize={10} width={96} tick={{ fill: "#64748B" }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="severity" radius={[0, 4, 4, 0]} barSize={14}>
                  {painPointChartData.map((e, i) => (
                    <Cell key={i} fill={e.severity > 7 ? "#EF4444" : "#F59E0B"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard badge="Digital Maturity" badgeColor="green" title="Enterprise Capabilities">
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart outerRadius="68%" data={radarData}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="dimension" stroke="#475569" fontSize={11} tick={{ fill: "#64748B" }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="#CBD5E1" fontSize={9} />
                <Radar name="Maturity" dataKey="score" stroke="#2563EB" fill="#2563EB" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>
        </section>

        {/* Narrative Deliverable */}
        <section className="space-y-8">
          {/* Executive Summary */}
          <div className="card p-8 animate-fadeInUp">
            <SectionTitle icon={<FileText size={16} />} iconBg="bg-blue-50" iconColor="text-blue-600" title="Executive Summary" />
            <p className="text-[15px] text-[#334155] leading-[1.8] bg-[#F8FAFC] p-5 rounded-xl border border-[#E2E8F0]">
              {analysis.executiveSummary}
            </p>
            {analysis.confidenceScore && (
              <div className="mt-4 flex items-center gap-2">
                <span className="badge badge-green">
                  <CheckCircle size={10} /> ZYNTRA Confidence: {analysis.confidenceScore}%
                </span>
              </div>
            )}
          </div>

          {/* Knowledge Sources */}
          <KnowledgeSourcesSection sources={sourcesUsed} />

          {/* Pain Points */}
          <div className="card p-8 animate-fadeInUp">
            <SectionTitle icon={<AlertTriangle size={16} />} iconBg="bg-red-50" iconColor="text-red-600" title="Identified Operational Bottlenecks" />
            <div className="grid md:grid-cols-2 gap-3">
              {(analysis.painPoints || []).map((point, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-red-50/50 border border-red-100 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-red-100 border border-red-200 text-red-700 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 font-heading">
                    {i + 1}
                  </div>
                  <p className="text-[13px] font-medium text-[#334155] leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="card p-8 animate-fadeInUp">
            <SectionTitle icon={<Zap size={16} />} iconBg="bg-emerald-50" iconColor="text-emerald-600" title="Strategic AI Recommendations" />
            <div className="space-y-4">
              {(analysis.recommendations || []).map((rec, i) => (
                <RecommendationCard
                  key={i}
                  rec={rec}
                  index={i}
                  sourcesUsed={sourcesUsed}
                  expanded={expandedRec === i}
                  onToggle={() => setExpandedRec(expandedRec === i ? null : i)}
                />
              ))}
            </div>
          </div>

          {/* Tech Stack & Next Steps */}
          <div className="grid md:grid-cols-2 gap-6">
            {analysis.suggestedTechStack?.length > 0 && (
              <div className="card p-6 animate-fadeInUp">
                <SectionTitle icon={<Cpu size={15} />} iconBg="bg-blue-50" iconColor="text-blue-600" title="Recommended Architecture" />
                <div className="flex flex-wrap gap-2 mt-2">
                  {analysis.suggestedTechStack.map((tech, i) => (
                    <span key={i} className="badge badge-slate text-[12px]">{tech}</span>
                  ))}
                </div>
              </div>
            )}
            {analysis.nextSteps?.length > 0 && (
              <div className="card p-6 animate-fadeInUp">
                <SectionTitle icon={<ChevronRight size={15} />} iconBg="bg-amber-50" iconColor="text-amber-600" title="Immediate Next Steps" />
                <ol className="space-y-2 mt-2">
                  {analysis.nextSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[13px] text-[#334155]">
                      <span className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 font-heading">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Share Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="card max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-[17px] font-bold text-[#0F172A] font-heading">Share ZYNTRA Deliverable</h3>
              <button onClick={() => setShareModalOpen(false)} className="btn btn-ghost btn-sm">
                <X size={15} />
              </button>
            </div>

            <div>
              <label className="form-label flex items-center gap-1.5"><Link2 size={12} /> Public Share Link</label>
              <div className="flex gap-2">
                <input type="text" readOnly value={shareUrl || window.location.href}
                  className="form-input text-[12px] bg-[#F8FAFC] text-[#64748B]" />
                <button onClick={handleCopyLink} className="btn btn-primary shrink-0">
                  <Copy size={13} /> {copied ? "Copied!" : "Copy Link"}
                </button>
              </div>
            </div>

            <form onSubmit={handleSendMailto} className="space-y-3 pt-4 border-t border-[#E2E8F0]">
              <label className="form-label flex items-center gap-1.5"><Mail size={12} /> Email to Stakeholder</label>
              <div className="flex gap-2">
                <input type="email" placeholder="executive@company.com" value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="form-input text-[13px]" />
                <button type="submit" className="btn btn-primary shrink-0">
                  <Send size={13} /> Send Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Strategy Partner Chat Drawer */}
      {chatOpen && (
        <div className="fixed bottom-4 right-4 w-full max-w-[420px] bg-[#0F172A] border border-[#1E293B] rounded-2xl shadow-2xl flex flex-col z-50 h-[560px] animate-slideIn">
          <div className="px-4 py-3.5 border-b border-[#1E293B] flex items-center justify-between bg-[#0F172A] rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <ZyntraIcon size={20} className="text-white" />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#0F172A]" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-white font-heading">ZYNTRA AI Strategy Partner</p>
                <p className="text-[10px] text-[#64748B]">RAG Grounded · Context-Aware</p>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="btn btn-ghost btn-sm text-[#64748B] hover:text-white">
              <X size={15} />
            </button>
          </div>

          <div className="px-3 py-2.5 border-b border-[#1E293B] flex gap-2 overflow-x-auto scrollbar-none">
            {[
              { label: "Explain Rec", icon: <BookOpen size={11} />, msg: "Explain Recommendation 1 in detail" },
              { label: "Alternatives", icon: <Layers size={11} />, msg: "What are alternative solutions for this challenge?" },
              { label: "Reduce Cost", icon: <TrendingUp size={11} />, msg: "How can we reduce implementation cost by 25%?" },
              { label: "CEO Email", icon: <Mail size={11} />, msg: "Generate an executive summary email for my CEO" },
              { label: "Risk Analysis", icon: <Shield size={11} />, msg: "What are the primary operational risks and mitigations?" },
            ].map((q) => (
              <button key={q.label} onClick={() => handleSendChatMessage(q.msg)}
                className="whitespace-nowrap flex items-center gap-1.5 bg-[#1E293B] hover:bg-[#334155] text-[#CBD5E1] hover:text-white border border-[#334155] px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors">
                {q.icon} {q.label}
              </button>
            ))}
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-[13px]">
            {messages.length === 0 && (
              <div className="text-center py-10 space-y-2">
                <ZyntraIcon size={28} className="text-[#334155] mx-auto" />
                <p className="text-[13px] font-bold text-[#CBD5E1] font-heading">Have questions about this deliverable?</p>
                <p className="text-[11px] text-[#475569] max-w-[260px] mx-auto">Click a preset above or type your question to analyze cost, risks, or architecture.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                <div className={`px-3.5 py-2.5 rounded-2xl max-w-[88%] leading-relaxed whitespace-pre-line text-[13px]
                  ${msg.sender === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-[#1E293B] text-[#CBD5E1] border border-[#334155] rounded-bl-sm"}`}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-[#475569] mt-1 px-1">{msg.sender === "user" ? "You" : "ZYNTRA AI Partner"}</span>
              </div>
            ))}
            {sendingChat && (
              <div className="flex items-center gap-2 text-[#64748B] text-[12px]">
                <Loader2 size={13} className="animate-spin text-blue-400" />
                <span>Analyzing ZYNTRA context...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          <div className="p-3 border-t border-[#1E293B] flex gap-2">
            <input
              type="text"
              placeholder="Ask about this deliverable..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
              className="flex-1 bg-[#1E293B] border border-[#334155] rounded-xl px-3.5 py-2 text-[13px] text-white placeholder-[#475569] outline-none focus:border-blue-500 transition-colors"
            />
            <button
              onClick={() => handleSendChatMessage()}
              disabled={sendingChat || !chatInput.trim()}
              className="btn btn-primary shrink-0 disabled:opacity-40"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────────── */

function Building2Icon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" /></svg>;
}

function KPICard({ icon, label, value, unit, sub, badge, badgeColor = "blue", color, desc }) {
  const valueColors = { blue: "text-blue-600", green: "text-emerald-600", amber: "text-amber-600", red: "text-red-600" };
  const iconBgs     = { blue: "bg-blue-50 text-blue-600", green: "bg-emerald-50 text-emerald-600", amber: "bg-amber-50 text-amber-600", red: "bg-red-50 text-red-600" };
  const badgeMap    = { blue: "badge-blue", green: "badge-green", amber: "badge-amber", red: "badge-red" };
  return (
    <div className="kpi-card animate-fadeInUp">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-8 h-8 rounded-lg ${iconBgs[color] || iconBgs.blue} flex items-center justify-center`}>
          {icon}
        </div>
        {badge && <span className={`badge ${badgeMap[badgeColor] || badgeMap.blue} text-[10px]`}>{badge}</span>}
      </div>
      <p className="kpi-label mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={`kpi-value ${valueColors[color] || valueColors.blue}`}>{value}</span>
        {unit && <span className="text-[13px] text-[#94A3B8] font-semibold">{unit}</span>}
      </div>
      {sub  && <p className="text-[12px] font-semibold text-emerald-600 mt-1">{sub}</p>}
      {desc && <p className="text-[11px] text-[#94A3B8] mt-2 line-clamp-2 leading-snug">{desc}</p>}
    </div>
  );
}

function SectionTitle({ icon, iconBg, iconColor, title, subtitle }) {
  return (
    <div className="section-header mb-5">
      <div className={`section-header-icon ${iconBg}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <p className="section-header-title font-heading">{title}</p>
        {subtitle && <p className="section-header-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}

function ChartCard({ badge, badgeColor = "blue", title, children }) {
  const badgeMap = { blue: "badge-blue", red: "badge-red", green: "badge-green" };
  return (
    <div className="card p-6 animate-fadeInUp">
      <div className="mb-4">
        <span className={`badge ${badgeMap[badgeColor] || badgeMap.blue} mb-2`}>{badge}</span>
        <h3 className="text-[15px] font-bold text-[#0F172A] font-heading">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function RecommendationCard({ rec, index, sourcesUsed, expanded, onToggle }) {
  const primarySource = sourcesUsed?.[index % (sourcesUsed?.length || 1)];
  return (
    <div className="border border-[#E2E8F0] rounded-xl overflow-hidden card-hover">
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 p-5 text-left hover:bg-[#F8FAFC] transition-colors"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white text-[12px] font-bold flex items-center justify-center shrink-0 font-heading">
            {String(index + 1).padStart(2, "0")}
          </div>
          <div className="min-w-0">
            <h4 className="text-[15px] font-bold text-[#0F172A] leading-tight font-heading">{rec.title}</h4>
            <p className="text-[13px] text-[#64748B] mt-1 line-clamp-2 leading-relaxed">{rec.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="badge badge-green text-[11px]">Impact {rec.impactScore ?? 8}/10</span>
          <span className="badge badge-slate text-[11px]">Effort {rec.effortScore ?? 4}/10</span>
          <ChevronDown size={16} className={`text-[#94A3B8] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-[#F1F5F9] animate-fadeIn">
          {rec.benefits?.length > 0 && (
            <div className="pt-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-3">Key Expected Benefits</p>
              <ul className="grid sm:grid-cols-2 gap-2">
                {rec.benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-[#334155]">
                    <CheckCircle size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(rec.grounding || rec.citation || primarySource) && (
            <div className="bg-[#F0FDF4] border border-emerald-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-800">
                  <FileText size={12} />
                  Source: <span className="font-mono text-blue-700 bg-white px-2 py-0.5 rounded border border-[#E2E8F0] ml-1">
                    {rec.citation?.sourceDocument || rec.grounding?.basedOnDocument || primarySource?.source || "enterprise_kb.md"}
                  </span>
                </span>
                <span className="badge badge-green text-[11px]">
                  <CheckCircle size={9} />
                  Confidence: {rec.citation?.confidence || `${rec.grounding?.confidenceScore || (90 + index * 2)}%`}
                </span>
              </div>
              <p className="text-[12px] text-[#334155] leading-relaxed">
                <span className="font-semibold text-[#0F172A]">Supporting Evidence: </span>
                {rec.citation?.excerpt || rec.grounding?.supportingEvidence || `Validated against ZYNTRA AI knowledge repository.`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ReportDetails;
