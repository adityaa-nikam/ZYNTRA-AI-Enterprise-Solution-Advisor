import { useEffect } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

function Toast({ message, type = "info", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: { bg: "bg-white border-green-300",    icon: <CheckCircle size={15} className="text-green-600" />,  text: "text-green-800" },
    error:   { bg: "bg-white border-red-300",      icon: <AlertCircle size={15}  className="text-red-600" />,    text: "text-red-800" },
    info:    { bg: "bg-white border-blue-200",     icon: <Info size={15}          className="text-blue-600" />,   text: "text-slate-700" },
  };
  const s = styles[type] || styles.info;

  return (
    <div className={`fixed bottom-6 left-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-slideIn ${s.bg}`}
      style={{ minWidth: 260, maxWidth: 380 }}>
      <span className="shrink-0">{s.icon}</span>
      <span className={`text-[13px] font-medium flex-1 ${s.text}`}>{message}</span>
      <button onClick={onClose} className="text-[#94A3B8] hover:text-[#64748B] transition-colors shrink-0 ml-1">
        <X size={14} />
      </button>
    </div>
  );
}

export default Toast;
