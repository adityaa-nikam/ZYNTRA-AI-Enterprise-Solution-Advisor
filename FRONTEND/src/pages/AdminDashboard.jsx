import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function AdminDashboard() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, usersRes] = await Promise.all([
        api.get("/api/admin/analytics"),
        api.get("/api/admin/users")
      ]);

      if (analyticsRes.data.success) {
        setAnalytics(analyticsRes.data.analytics);
      }
      if (usersRes.data.success) {
        setUsers(usersRes.data.users);
      }
    } catch (err) {
      console.error("Admin Dashboard Fetch Error:", err);
      setError(err.response?.data?.message || "Failed to load admin dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await api.put(`/api/admin/users/${userId}/role`, { role: newRole });
      if (res.data.success) {
        setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      }
    } catch (err) {
      alert("Failed to update user role: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`Are you sure you want to delete user '${email}'?`)) return;
    try {
      const res = await api.delete(`/api/admin/users/${userId}`);
      if (res.data.success) {
        setUsers(users.filter(u => u._id !== userId));
      }
    } catch (err) {
      alert("Failed to delete user: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between">
        <Navbar />
        <div className="flex flex-col items-center justify-center my-20">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-300 font-medium text-sm">Loading ZYNTRA AI Admin Metrics...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col justify-between">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-grow space-y-8">
        
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold px-3 py-1 rounded uppercase tracking-wider">
              ZYNTRA AI System Administrator
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-2 font-heading">
              ZYNTRA Control Center & Analytics
            </h1>
          </div>
          <button
            onClick={() => navigate("/")}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-lg text-xs font-semibold transition"
          >
            ← Return to App Home
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* Global KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700/80 shadow-md">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Registered Users</span>
            <div className="text-3xl font-extrabold text-white mt-2">{analytics?.totalUsers || 0}</div>
            <span className="text-[11px] text-slate-400 mt-1 block">Active SaaS Platform Accounts</span>
          </div>

          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700/80 shadow-md">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Reports Generated</span>
            <div className="text-3xl font-extrabold text-blue-400 mt-2">{analytics?.totalReports || 0}</div>
            <span className="text-[11px] text-slate-400 mt-1 block">ZYNTRA AI Deliverables</span>
          </div>

          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700/80 shadow-md">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Reports Today</span>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2">+{analytics?.reportsToday || 0}</div>
            <span className="text-[11px] text-slate-400 mt-1 block">Generated in the last 24h</span>
          </div>

          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700/80 shadow-md">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Projected ROI</span>
            <div className="text-3xl font-extrabold text-amber-400 mt-2">+{analytics?.averageROI || 25}%</div>
            <span className="text-[11px] text-slate-400 mt-1 block">Cross-client average return</span>
          </div>
        </section>

        {/* Charts & System Logs */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Industry Distribution BarChart */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700/80 shadow-md flex flex-col">
            <h3 className="text-base font-bold text-white mb-2">Industry Sector Distribution</h3>
            <p className="text-xs text-slate-400 mb-4">Most common business sectors requesting AI transformation reports.</p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.industryDistribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} />
                  <Tooltip
                    content={({ payload }) => {
                      if (payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-2 rounded text-xs border border-slate-700">
                            <p className="font-bold">{d.name}</p>
                            <p className="text-blue-400">{d.count} Reports</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                    {(analytics?.industryDistribution || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#3B82F6" : "#6366F1"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Audit Logs Feed */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700/80 shadow-md flex flex-col">
            <h3 className="text-base font-bold text-white mb-2">System Audit Logs</h3>
            <p className="text-xs text-slate-400 mb-4">Real-time security and operational events feed.</p>

            <div className="space-y-3 overflow-y-auto max-h-64 pr-2">
              {(analytics?.recentAuditLogs || []).map((log) => (
                <div key={log._id} className="p-3 bg-slate-900/70 border border-slate-700/50 rounded-lg text-xs flex justify-between items-start">
                  <div>
                    <span className="font-bold text-blue-400 block">{log.action}</span>
                    <p className="text-slate-300 text-[11px] mt-0.5">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* User Management Table */}
        <section className="bg-slate-800 rounded-xl border border-slate-700/80 shadow-md p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white">User Accounts & Roles</h3>
              <p className="text-xs text-slate-400">Manage user access permissions and assignments.</p>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-900 px-3 py-1 rounded border border-slate-700">
              {users.length} Users Listed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-bold text-[10px] border-b border-slate-700">
                <tr>
                  <th className="p-3">User Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Company</th>
                  <th className="p-3">Assigned Role</th>
                  <th className="p-3">Joined Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-700/30 transition">
                    <td className="p-3 font-bold text-white">{u.name}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3 text-slate-400">{u.company || "N/A"}</td>
                    <td className="p-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-xs text-white rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Client">Client</option>
                        <option value="Consultant">Consultant</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-3 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteUser(u._id, u.email)}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-2.5 py-1 rounded text-[11px] font-semibold transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}

export default AdminDashboard;
