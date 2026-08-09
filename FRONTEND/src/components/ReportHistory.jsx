import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ReportHistory({ onClose }) {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Sorting state
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sort, setSort] = useState("desc");
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);

  // Edit Title Modal state
  const [editingReport, setEditingReport] = useState(null);
  const [newTitle, setNewTitle] = useState("");

  // Delete Confirmation state
  const [deletingReport, setDeletingReport] = useState(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (sort) params.append("sort", sort);
      if (bookmarkedOnly) params.append("bookmarkedOnly", "true");

      const response = await api.get(`/reports?${params.toString()}`);
      setReports(response.data.reports || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Unable to load reports archive.");
    } finally {
      setLoading(false);
    }
  }, [search, startDate, endDate, sort, bookmarkedOnly]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleViewReport = (reportId) => {
    navigate(`/report/${reportId}`);
  };

  const handleToggleBookmark = async (e, reportId) => {
    e.stopPropagation();
    try {
      const res = await api.patch(`/reports/${reportId}/bookmark`);
      if (res.data.success) {
        setReports(reports.map(r => r._id === reportId ? { ...r, isBookmarked: res.data.isBookmarked } : r));
      }
    } catch (err) {
      console.error("Failed to toggle bookmark:", err);
    }
  };

  const handleDuplicate = async (e, reportId) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/reports/${reportId}/duplicate`);
      if (res.data.success) {
        fetchReports();
      }
    } catch (err) {
      console.error("Failed to duplicate report:", err);
    }
  };

  const handleOpenRenameModal = (e, report) => {
    e.stopPropagation();
    setEditingReport(report);
    setNewTitle(report.title || report.company);
  };

  const handleSaveRename = async () => {
    if (!editingReport || !newTitle.trim()) return;
    try {
      const res = await api.put(`/reports/${editingReport._id}/title`, { title: newTitle });
      if (res.data.success) {
        setReports(reports.map(r => r._id === editingReport._id ? { ...r, title: res.data.report.title } : r));
        setEditingReport(null);
      }
    } catch (err) {
      console.error("Failed to rename report:", err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingReport) return;
    try {
      const res = await api.delete(`/reports/${deletingReport._id}`);
      if (res.data.success) {
        setReports(reports.filter(r => r._id !== deletingReport._id));
        setDeletingReport(null);
      }
    } catch (err) {
      console.error("Failed to delete report:", err);
    }
  };

  return (
    <section className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-8 md:p-10 -mt-14 relative z-10 border border-slate-200">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-6 mb-6 gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded border border-blue-100">
            ZYNTRA AI Report Management
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2 font-heading">
            ZYNTRA Report Archive
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-lg transition self-start md:self-auto"
          >
            ← Back to Assessment Form
          </button>
        )}
      </div>

      {/* Filter Toolbar (Search, Dates, Sort, Bookmarks) */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="lg:col-span-2">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Search Reports
          </label>
          <input
            type="text"
            placeholder="Search company, title, industry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            From Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            To Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Sort & Bookmarks */}
        <div className="flex items-end gap-2">
          <div className="flex-grow">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Sort
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>

          <button
            onClick={() => setBookmarkedOnly(!bookmarkedOnly)}
            title="Filter Favorites"
            className={`p-2 rounded-lg border text-xs font-bold transition flex items-center justify-center ${
              bookmarkedOnly
                ? "bg-amber-100 text-amber-800 border-amber-300"
                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
            }`}
          >
            ★
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-sm font-medium text-slate-600">Loading reports archive...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {!loading && !error && reports.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-slate-500 font-medium text-sm">
            No matching consulting reports found. Try adjusting your search query or filters.
          </p>
        </div>
      )}

      {/* Reports List */}
      <div className="space-y-4">
        {reports.map((report) => (
          <div
            key={report._id}
            onClick={() => handleViewReport(report._id)}
            className="bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition group"
          >
            <div className="space-y-1 flex-grow">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleToggleBookmark(e, report._id)}
                  className={`text-base hover:scale-125 transition ${
                    report.isBookmarked ? "text-amber-500" : "text-slate-300 hover:text-amber-400"
                  }`}
                  title={report.isBookmarked ? "Bookmarked" : "Bookmark Report"}
                >
                  ★
                </button>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                  {report.title || `${report.company} AI Strategy Deliverable`}
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Company: <span className="font-semibold text-slate-700">{report.company}</span>
                {report.industry && <> &nbsp;|&nbsp; Industry: <span className="font-semibold text-slate-700">{report.industry}</span></>}
                &nbsp;|&nbsp; Created: <span className="font-medium">{new Date(report.createdAt).toLocaleDateString()}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
              <div className="bg-slate-50 px-2.5 py-1 rounded border border-slate-200 text-center">
                <span className="block text-slate-400 font-bold uppercase text-[9px]">Timeline</span>
                <span className="font-bold text-blue-600">{report.analysis?.implementationTime || "N/A"}</span>
              </div>
              <div className="bg-slate-50 px-2.5 py-1 rounded border border-slate-200 text-center">
                <span className="block text-slate-400 font-bold uppercase text-[9px]">Priority</span>
                <span className="font-bold text-amber-600">{report.analysis?.priority || "N/A"}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  onClick={(e) => handleOpenRenameModal(e, report)}
                  title="Edit Title"
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-[11px] transition"
                >
                  Rename
                </button>
                <button
                  onClick={(e) => handleDuplicate(e, report._id)}
                  title="Duplicate Report"
                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-semibold text-[11px] transition"
                >
                  Duplicate
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingReport(report);
                  }}
                  title="Delete Report"
                  className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md font-semibold text-[11px] transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rename Modal */}
      {editingReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Rename Report</h3>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Report Title
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setEditingReport(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRename}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition shadow-sm"
              >
                Save Title
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-xl font-bold">
              ⚠
            </div>
            <h3 className="text-lg font-bold text-slate-900">Delete Report?</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete <strong className="text-slate-800">"{deletingReport.title}"</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingReport(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition shadow-sm"
              >
                Yes, Delete Report
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}

export default ReportHistory;