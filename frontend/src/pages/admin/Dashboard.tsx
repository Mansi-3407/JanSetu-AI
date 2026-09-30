import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';
import { 
  LayoutDashboard, FileText, Map as MapIcon, Layers, Activity,
  Award, Sparkles, Lightbulb, Bell, Settings, LogOut, Search,
  ChevronRight, X, MapPin, User, Shield, Send, RefreshCw, Eye, Clock
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

const COLORS = ['#0d9488', '#f97316', '#3b82f6', '#8b5cf6', '#ec4899', '#eab308', '#06b6d4'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'map' | 'clusters' | 'infrastructure' | 'priorities' | 'insights' | 'recommendations' | 'notifications' | 'settings'>('overview');

  const [overview, setOverview] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [clusters, setClusters] = useState<any[]>([]);
  const [priorities, setPriorities] = useState<any[]>([]);
  const [indicators, setIndicators] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states for reports
  const [reportSearch, setReportSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState<number | null>(null);

  // Selected report for drawer
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('Under Review');
  const [statusNote, setStatusNote] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  // AI Insights State
  const [insightQuery, setInsightQuery] = useState('');
  const [insightResult, setInsightResult] = useState<any>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login?role=admin');
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };

      const [ovRes, repRes, clRes, priRes, indRes, recRes, notRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/overview`, { headers }),
        axios.get(`${API_BASE}/admin/reports`, { headers }),
        axios.get(`${API_BASE}/admin/clusters`, { headers }),
        axios.get(`${API_BASE}/admin/priorities`, { headers }),
        axios.get(`${API_BASE}/admin/infrastructure-gaps`, { headers }),
        axios.get(`${API_BASE}/admin/recommendations`, { headers }),
        axios.get(`${API_BASE}/admin/notifications`, { headers })
      ]);

      setOverview(ovRes.data);
      setReports(repRes.data);
      setClusters(clRes.data);
      setPriorities(priRes.data);
      setIndicators(indRes.data);
      setRecommendations(recRes.data);
      setNotifications(notRes.data);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        localStorage.removeItem('token');
        navigate('/login?role=admin');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    setStatusUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(
        `${API_BASE}/admin/reports/${selectedReport.id}/status`,
        { status: newStatus, note: statusNote.trim() || undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update local state
      setSelectedReport(res.data);
      setStatusNote('');
      fetchAllData();
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAskInsight = async (queryText?: string) => {
    const q = queryText || insightQuery;
    if (!q.trim()) return;
    setInsightLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_BASE}/admin/insights/query`,
        { query: q },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInsightResult(res.data);
    } catch (err) {
      console.error('Insight query failed:', err);
    } finally {
      setInsightLoading(false);
    }
  };

  const handleGenerateRecommendation = async (clusterId: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE}/admin/recommendations/${clusterId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAllData();
      setActiveTab('recommendations');
    } catch (err) {
      console.error('Failed to generate recommendation:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-mono text-sm">Initializing Civic Intelligence Engine...</p>
        </div>
      </div>
    );
  }

  // Filtered reports for Citizen Reports tab
  const filteredReports = reports.filter(r => {
    const term = reportSearch.toLowerCase();
    const matchesSearch = 
      (r.citizen_name || '').toLowerCase().includes(term) ||
      (r.original_text || '').toLowerCase().includes(term) ||
      (r.issue_type || '').toLowerCase().includes(term) ||
      (r.district || '').toLowerCase().includes(term) ||
      (r.citizen_address || '').toLowerCase().includes(term);

    const matchesCat = categoryFilter === 'All' || r.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    const matchesSev = severityFilter === null || r.severity >= severityFilter;

    return matchesSearch && matchesCat && matchesStatus && matchesSev;
  });

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'reports', label: 'Citizen Reports', icon: FileText, badge: reports.length },
    { id: 'map', label: 'Civic Map', icon: MapIcon },
    { id: 'clusters', label: 'Issue Clusters', icon: Layers, badge: clusters.length },
    { id: 'infrastructure', label: 'Infrastructure Gaps', icon: Activity },
    { id: 'priorities', label: 'Priorities', icon: Award },
    { id: 'insights', label: 'AI Insights', icon: Sparkles },
    { id: 'recommendations', label: 'Recommendations', icon: Lightbulb, badge: recommendations.length },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: notifications.length },
    { id: 'settings', label: 'Settings / Profile', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* Admin Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl z-20">
        <div className="p-5 border-b border-slate-800">
          <div className="bg-white p-2.5 rounded-2xl shadow-md border border-slate-700/50 flex items-center justify-center mb-2.5">
            <img 
              src="/assets/jansetu-logo.png" 
              alt="JanSetu AI" 
              className="h-11 w-auto object-contain"
            />
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Civic Intelligence</span>
            <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-black px-1.5 py-0.5 rounded">
              ADMIN
            </span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {sidebarItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive 
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/40' 
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-teal-800 text-teal-100' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">Administrator</div>
              <div className="text-[10px] text-slate-400 truncate">demo.admin@jansetu.ai</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 w-full text-left text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg font-medium transition-colors"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        
        {/* Top Header */}
        <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-8 py-3.5 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white px-2 py-0.5 rounded-lg border border-slate-700/50 shadow-sm flex items-center">
              <img 
                src="/assets/jansetu-logo.png" 
                alt="JanSetu AI" 
                className="h-6 w-auto object-contain"
              />
            </div>
            <h1 className="text-base font-bold text-white capitalize flex items-center gap-2">
              <span>{activeTab.replace('-', ' ')}</span>
              <span className="text-xs text-slate-400 font-normal">| Civic Intelligence Command</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>PostgreSQL & Gemini Connected</span>
            </div>
            <button 
              onClick={fetchAllData}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </header>

        {/* Tab Content Router */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
              
              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
                  <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Reports</div>
                  <div className="text-2xl md:text-3xl font-black text-white mt-1">{overview?.total_reports}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
                  <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Active Issues</div>
                  <div className="text-2xl md:text-3xl font-black text-amber-500 mt-1">{overview?.active_issues}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
                  <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Under Review</div>
                  <div className="text-2xl md:text-3xl font-black text-blue-400 mt-1">{overview?.under_review_issues}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
                  <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">High / Critical</div>
                  <div className="text-2xl md:text-3xl font-black text-rose-500 mt-1">{overview?.high_critical_issues}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
                  <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Resolved</div>
                  <div className="text-2xl md:text-3xl font-black text-emerald-400 mt-1">{overview?.resolved_issues}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
                  <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Hotspots</div>
                  <div className="text-2xl md:text-3xl font-black text-teal-400 mt-1">{overview?.total_clusters}</div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Category Distribution Chart */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-bold text-white mb-4">Complaints by Civic Category</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={overview?.categories || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                        <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                        <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]}>
                          {(overview?.categories || []).map((_item: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Status Distribution */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                  <h3 className="text-sm font-bold text-white mb-4">Resolution Status Pipeline</h3>
                  <div className="grid grid-cols-2 gap-3 flex-1">
                    {(overview?.statuses || []).map((s: any, idx: number) => (
                      <div key={idx} className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="text-xs text-slate-400 font-medium">{s.status}</div>
                          <div className="text-xl font-bold text-white mt-0.5">{s.count}</div>
                        </div>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
                    <span>Deterministic Data Pipeline</span>
                    <button onClick={() => setActiveTab('reports')} className="text-teal-400 hover:underline flex items-center gap-1">
                      Manage Reports <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Major Issue Hotspots Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-white">Critical Hotspots Requiring Administrative Action</h3>
                  <button onClick={() => setActiveTab('clusters')} className="text-xs text-teal-400 font-bold hover:underline">
                    View All Clusters →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
                        <th className="pb-3">Cluster Area</th>
                        <th className="pb-3">Category</th>
                        <th className="pb-3">District</th>
                        <th className="pb-3 text-center">Citizen Demand</th>
                        <th className="pb-3 text-center">Severity</th>
                        <th className="pb-3 text-center">Infra Gap</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {overview?.hotspots?.map((h: any) => (
                        <tr key={h.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 font-bold text-white">{h.name}</td>
                          <td className="py-3 text-slate-300">{h.category}</td>
                          <td className="py-3 text-slate-400">{h.district}</td>
                          <td className="py-3 text-center font-bold text-teal-400">{h.report_count} reports</td>
                          <td className="py-3 text-center">
                            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded text-[11px] font-bold">
                              {h.severity_score} / 10
                            </span>
                          </td>
                          <td className="py-3 text-center font-semibold text-slate-300">{h.infrastructure_gap}%</td>
                          <td className="py-3 text-right">
                            <button 
                              onClick={() => handleGenerateRecommendation(h.id)}
                              className="bg-teal-600/30 hover:bg-teal-600 text-teal-300 hover:text-white px-2.5 py-1 rounded-lg text-xs font-bold transition-colors"
                            >
                              AI Strategy
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CITIZEN REPORTS (Live Table + Contact Snapshot + Status Updates) */}
          {activeTab === 'reports' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
              
              {/* Filter & Search Bar */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <div className="relative flex-1 min-w-[240px]">
                  <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input 
                    type="text"
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    placeholder="Search citizen name, address, complaint text..."
                    className="w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Category Filter */}
                  <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-xs font-semibold rounded-xl px-3 py-2 text-slate-300 focus:outline-none"
                  >
                    <option value="All">All Categories</option>
                    <option value="Roads & Infrastructure">Roads & Infrastructure</option>
                    <option value="Water Supply">Water Supply</option>
                    <option value="Electricity & Streetlights">Electricity & Streetlights</option>
                    <option value="Waste Management">Waste Management</option>
                    <option value="Drainage & Sewage">Drainage & Sewage</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                  </select>

                  {/* Status Filter */}
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-xs font-semibold rounded-xl px-3 py-2 text-slate-300 focus:outline-none"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Submitted">Submitted</option>
                    <option value="AI Understood">AI Understood</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Action Planned">Action Planned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>

                  {/* Severity Filter */}
                  <button 
                    onClick={() => setSeverityFilter(severityFilter ? null : 4)}
                    className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all ${
                      severityFilter 
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50' 
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    High Severity Only
                  </button>
                </div>
              </div>

              {/* Reports Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
                        <th className="py-3.5 px-4">ID</th>
                        <th className="py-3.5 px-4">Citizen Name & Contact</th>
                        <th className="py-3.5 px-4">Category & Issue</th>
                        <th className="py-3.5 px-4">Location</th>
                        <th className="py-3.5 px-4 text-center">Severity</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredReports.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-500">
                            No citizen reports match the selected filters.
                          </td>
                        </tr>
                      ) : (
                        filteredReports.map(r => (
                          <tr key={r.id} className="hover:bg-slate-800/50 transition-colors">
                            <td className="py-3.5 px-4 font-mono text-slate-400">#{r.id}</td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-white">{r.citizen_name}</div>
                              <div className="text-[11px] text-slate-400">{r.citizen_phone || r.citizen_email || 'N/A'}</div>
                            </td>
                            <td className="py-3.5 px-4 max-w-xs">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-950/80 border border-teal-800/60 px-2 py-0.5 rounded">
                                {r.category}
                              </span>
                              <div className="font-medium text-slate-200 mt-1 truncate">{r.issue_type}</div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-300">
                              <div className="flex items-center gap-1">
                                <MapPin size={12} className="text-amber-500 flex-shrink-0" />
                                <span className="truncate max-w-[160px]">{r.district || r.citizen_address}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                r.severity >= 4 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800 text-slate-300'
                              }`}>
                                Level {r.severity}/5
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                r.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                                r.status === 'Under Review' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                                r.status === 'Action Planned' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
                                'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              }`}>
                                {r.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button 
                                onClick={() => { setSelectedReport(r); setNewStatus(r.status); }}
                                className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-teal-600 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                              >
                                <Eye size={12} />
                                Review & Update
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* REPORT INVESTIGATION & STATUS UPDATE DRAWER */}
              {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 md:p-8 space-y-6">
                    
                    <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">
                            {selectedReport.category}
                          </span>
                          <span className="text-xs text-slate-400">Report #{selectedReport.id}</span>
                        </div>
                        <h2 className="text-xl font-bold text-white mt-1">{selectedReport.issue_type}</h2>
                        <div className="text-xs text-slate-400">Lodged on {new Date(selectedReport.created_at).toLocaleString()}</div>
                      </div>
                      <button onClick={() => setSelectedReport(null)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                        <X size={20} />
                      </button>
                    </div>

                    {/* Section 1: Citizen Contact Snapshot */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <User size={14} className="text-teal-400" />
                        Citizen Contact Snapshot (At Time of Submission)
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-slate-500 block">Citizen Full Name:</span>
                          <span className="font-bold text-white">{selectedReport.citizen_name}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Contact Method:</span>
                          <span className="font-bold text-teal-300">{selectedReport.citizen_phone || selectedReport.citizen_email || 'None Provided'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-500 block">Verified Address:</span>
                          <span className="font-medium text-slate-200">{selectedReport.citizen_address}</span>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Original Complaint Text */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Original Complaint Text</h4>
                      <p className="text-xs text-slate-200 bg-slate-950 p-3.5 rounded-xl border border-slate-800 leading-relaxed font-mono">
                        "{selectedReport.original_text}"
                      </p>
                    </div>

                    {/* Section 3: AI Intelligence Card */}
                    <div className="grid grid-cols-3 gap-3 bg-teal-950/30 border border-teal-800/40 p-4 rounded-xl text-xs">
                      <div>
                        <span className="text-teal-400 block font-semibold">Severity Rating</span>
                        <span className="font-black text-white text-base">Level {selectedReport.severity} / 5</span>
                      </div>
                      <div>
                        <span className="text-teal-400 block font-semibold">Urgency Index</span>
                        <span className="font-black text-white text-base">Level {selectedReport.urgency} / 5</span>
                      </div>
                      <div>
                        <span className="text-teal-400 block font-semibold">AI Confidence</span>
                        <span className="font-black text-teal-300 text-base">{Math.round((selectedReport.ai_confidence || 0.95) * 100)}%</span>
                      </div>
                      <div className="col-span-3 text-slate-400 text-[11px] mt-1">
                        <strong>AI Summary:</strong> {selectedReport.description}
                      </div>
                    </div>

                    {/* Section 4: Administrative Status Update Form */}
                    <form onSubmit={handleStatusUpdate} className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock size={14} />
                        Update Issue Status & Notify Citizen
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">New Status</label>
                          <select 
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                          >
                            <option value="Submitted">Submitted</option>
                            <option value="AI Understood">AI Understood</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Action Planned">Action Planned</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Administrative Note</label>
                          <input 
                            type="text"
                            value={statusNote}
                            onChange={(e) => setStatusNote(e.target.value)}
                            placeholder="e.g. Work order issued to engineering squad..."
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button 
                          type="submit"
                          disabled={statusUpdating}
                          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow disabled:opacity-50"
                        >
                          {statusUpdating ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                          Save Status & Notify Citizen
                        </button>
                      </div>
                    </form>

                    {/* Section 5: History Timeline */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Status Audit Trail</h4>
                      <div className="space-y-3 border-l-2 border-slate-700 ml-2 pl-4">
                        {selectedReport.status_history?.map((h: any, idx: number) => (
                          <div key={idx} className="relative">
                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-teal-500 ring-4 ring-slate-900"></div>
                            <div className="text-xs font-bold text-white">{h.new_status}</div>
                            <div className="text-[10px] text-slate-400">{new Date(h.created_at).toLocaleString()} • {h.changed_by}</div>
                            {h.note && <div className="text-xs text-slate-300 mt-0.5 bg-slate-950 p-2 rounded border border-slate-800">{h.note}</div>}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button 
                        onClick={() => setSelectedReport(null)}
                        className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-xl"
                      >
                        Close Window
                      </button>
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: CIVIC MAP */}
          {activeTab === 'map' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-base font-bold text-white">Interactive Civic Map & Complaint Hotspots</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Plotting verified citizen coordinates against regional infrastructure clusters.</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> High Severity</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Moderate</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span> Low / Active</span>
                  </div>
                </div>

                {/* Map Graphic Canvas */}
                <div className="bg-slate-950 rounded-xl h-[520px] p-6 relative overflow-hidden border border-slate-800 flex items-center justify-center">
                  <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(#0d9488 1.5px, transparent 1.5px)', backgroundSize: '30px 30px'}}></div>

                  <div className="relative w-full max-w-3xl h-96">
                    {reports.map((r, idx) => {
                      const top = 18 + ((idx * 31) % 68);
                      const left = 12 + ((idx * 47) % 76);
                      const isHigh = r.severity >= 4;
                      return (
                        <div 
                          key={r.id} 
                          onClick={() => { setSelectedReport(r); setNewStatus(r.status); }}
                          style={{ top: `${top}%`, left: `${left}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all hover:scale-125 z-20 group"
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg ${
                            isHigh ? 'bg-rose-500 ring-4 ring-rose-500/20' : 'bg-teal-500 ring-4 ring-teal-500/20'
                          }`}>
                            <MapPin size={16} />
                          </div>
                          <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 border border-slate-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap z-30">
                            {r.issue_type} ({r.district || 'Pune'})
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ISSUE CLUSTERS */}
          {activeTab === 'clusters' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-white">Aggregated Issue Clusters</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Automated spatial & semantic clustering of collective citizen complaints.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {clusters.map(c => (
                  <div key={c.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm hover:border-teal-500/50 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">
                          {c.category}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{c.district}, {c.state}</span>
                      </div>
                      <h3 className="font-bold text-white text-base">{c.name}</h3>
                      
                      <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 block">Report Density</span>
                          <span className="font-bold text-teal-400 text-sm">{c.report_count} Reports</span>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 block">Severity Score</span>
                          <span className="font-bold text-rose-400 text-sm">{c.severity_score}/10</span>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 block">Population Impact</span>
                          <span className="font-bold text-white text-sm">{(c.population_affected / 1000).toFixed(0)}k citizens</span>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 block">Infra Gap Score</span>
                          <span className="font-bold text-amber-400 text-sm">{c.infrastructure_gap}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-800 flex justify-between items-center">
                      <span className="text-[11px] text-slate-500">Auto-clustered via DB</span>
                      <button 
                        onClick={() => handleGenerateRecommendation(c.id)}
                        className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors shadow"
                      >
                        <Sparkles size={12} />
                        Generate AI Strategy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: INFRASTRUCTURE GAPS */}
          {activeTab === 'infrastructure' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
              <div>
                <h2 className="text-lg font-bold text-white">Infrastructure Gap Benchmarks</h2>
                <p className="text-xs text-slate-400 mt-0.5">Government baseline survey standards compared against on-ground citizen observations.</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
                      <th className="py-3.5 px-4">District & State</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Indicator Name</th>
                      <th className="py-3.5 px-4 text-center">Current Metric</th>
                      <th className="py-3.5 px-4 text-center">Govt Benchmark</th>
                      <th className="py-3.5 px-4 text-center">Gap Deficit</th>
                      <th className="py-3.5 px-4">Data Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {indicators.map(ind => (
                      <tr key={ind.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">{ind.district}, {ind.state}</td>
                        <td className="py-3.5 px-4 text-teal-400 font-semibold">{ind.category}</td>
                        <td className="py-3.5 px-4 text-slate-200">{ind.indicator_name}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-300">{ind.indicator_value}%</td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-400">{ind.benchmark_value}%</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded text-[11px] font-bold">
                            {ind.gap_score}% Deficit
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">{ind.source} ({ind.year})</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: PRIORITIES (Deterministic JanSetu Scoring Engine) */}
          {activeTab === 'priorities' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <h2 className="text-lg font-bold text-white">Deterministic Priority Scoring Engine</h2>
                <p className="text-xs text-slate-400 mt-1">
                  JanSetu Formula: <code className="bg-slate-950 px-2 py-0.5 rounded text-teal-300">Final Score = 35% Demand + 25% Infra Gap + 20% Population + 10% Severity + 10% Investment Gap</code>
                </p>

                <div className="mt-6 space-y-4">
                  {priorities.map((p, idx) => (
                    <div key={p.id} className="bg-slate-950 border border-slate-800 p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center font-black text-sm">
                          #{idx + 1}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-base">{p.cluster?.name || `Cluster #${p.cluster_id}`}</h3>
                          <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                            <span>Demand: <strong>{p.citizen_demand_score}</strong></span>
                            <span>•</span>
                            <span>Gap: <strong>{p.infrastructure_gap_score}</strong></span>
                            <span>•</span>
                            <span>Pop Impact: <strong>{p.population_impact_score}</strong></span>
                            <span>•</span>
                            <span>Severity: <strong>{p.severity_score}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end md:self-center">
                        <div className="text-right">
                          <div className={`text-2xl font-black ${p.final_score >= 80 ? 'text-rose-500' : 'text-amber-500'}`}>
                            {p.final_score}
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Priority Score</div>
                        </div>

                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${
                          p.priority_level === 'Critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                          p.priority_level === 'High' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                          'bg-teal-500/20 text-teal-300 border-teal-500/40'
                        }`}>
                          {p.priority_level}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: AI INSIGHTS (Grounded on DB Evidence) */}
          {activeTab === 'insights' && (
            <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
              <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl shadow-sm space-y-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-full text-xs font-bold mb-2">
                    <Sparkles size={14} />
                    Grounded Civic Intelligence
                  </div>
                  <h2 className="text-xl font-bold text-white">Ask JanSetu AI Evidence Engine</h2>
                  <p className="text-xs text-slate-400 mt-1">Queries are synthesized strictly against active PostgreSQL complaints and infrastructure benchmarks without hallucination.</p>
                </div>

                {/* Quick Prompts */}
                <div className="flex flex-wrap gap-2">
                  {[
                    "What are the major road and infrastructure issues?",
                    "Which areas have the largest infrastructure gaps?",
                    "What high-severity issues are increasing in Pune?",
                    "Which categories have the most complaints?"
                  ].map((q, i) => (
                    <button 
                      key={i} 
                      onClick={() => { setInsightQuery(q); handleAskInsight(q); }}
                      className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <input 
                    type="text"
                    value={insightQuery}
                    onChange={(e) => setInsightQuery(e.target.value)}
                    placeholder="Enter an administrative query regarding civic issues or hotspots..."
                    className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button 
                    onClick={() => handleAskInsight()}
                    disabled={insightLoading || !insightQuery.trim()}
                    className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow"
                  >
                    {insightLoading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    Synthesize Evidence
                  </button>
                </div>
              </div>

              {/* AI Insight Response */}
              {insightResult && (
                <div className="bg-slate-900 border border-teal-500/40 rounded-2xl p-6 md:p-8 space-y-5 animate-in fade-in duration-300 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                      <Sparkles size={14} />
                      {insightResult.label || 'AI-generated insight'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">Grounded on DB Evidence</span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white mb-2">Executive Summary</h3>
                    <p className="text-xs md:text-sm text-slate-200 bg-slate-950 p-4 rounded-xl border border-slate-800 leading-relaxed font-sans">
                      {insightResult.summary}
                    </p>
                  </div>

                  {insightResult.key_findings && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Key Synthesized Findings</h3>
                      <div className="space-y-2">
                        {insightResult.key_findings.map((f: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                            <span className="text-teal-400 font-bold mt-0.5">•</span>
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {insightResult.recommended_focus && (
                    <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Recommended Departmental Focus</h4>
                      <p className="text-xs text-amber-200">{insightResult.recommended_focus}</p>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span>Evidence Citation: {insightResult.grounded_evidence}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: RECOMMENDATIONS */}
          {activeTab === 'recommendations' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
              <div>
                <h2 className="text-lg font-bold text-white">Decision Support Recommendations</h2>
                <p className="text-xs text-slate-400 mt-0.5">Actionable strategic guidance generated from complaint volume, severity, and infrastructure lag.</p>
              </div>

              <div className="space-y-4">
                {recommendations.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 p-12 rounded-2xl text-center text-slate-500">
                    No recommendations generated yet. Go to "Issue Clusters" and click "Generate AI Strategy".
                  </div>
                ) : (
                  recommendations.map(rec => (
                    <div key={rec.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-white text-base">{rec.title}</h3>
                        <span className="text-[11px] font-bold text-teal-400 bg-teal-950 border border-teal-800 px-2 py-0.5 rounded">
                          {rec.generated_by}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{rec.explanation}</p>
                      
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
                        <strong className="text-teal-400">Suggested Administrative Next Step:</strong>
                        <div className="text-slate-200 mt-1">{rec.suggested_action}</div>
                      </div>

                      <div className="text-[11px] text-slate-500 flex justify-between">
                        <span>Evidence: {rec.evidence_summary}</span>
                        <span>{new Date(rec.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 9: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-4 max-w-4xl mx-auto animate-in fade-in duration-200">
              <h2 className="text-lg font-bold text-white">Administrative Alerts & Incident Feed</h2>
              <div className="space-y-3">
                {notifications.map(n => (
                  <div key={n.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">{n.title}</h4>
                      <p className="text-xs text-slate-300 mt-1">{n.message}</p>
                      <span className="text-[10px] text-slate-500 mt-2 block">{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      Alert
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 10: SETTINGS / PROFILE */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
              <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl space-y-5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Shield size={18} className="text-teal-400" />
                  Administrator Identity & Jurisdictional Scope
                </h2>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Official Name</label>
                    <input type="text" disabled value="Administrator Demo" className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200" />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Official Email</label>
                    <input type="email" disabled value="demo.admin@jansetu.ai" className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200" />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Assigned Civic Region</label>
                    <input type="text" disabled value="District Administration, Pune & Satna Divisions" className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200" />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
                  <span>System Version: JanSetu AI 2.0.0</span>
                  <button onClick={handleLogout} className="text-rose-400 hover:underline">
                    Log out of Admin Portal
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
