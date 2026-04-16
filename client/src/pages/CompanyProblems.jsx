import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, ChevronRight, CheckCircle2, Circle, Clock,
  ExternalLink, ArrowLeft, BarChart2, TrendingUp, Search,
  Filter, RefreshCw, Target, Zap, Award, X
} from 'lucide-react';
import {
  RadialBarChart, RadialBar, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { buildApiUrl } from '../store/StoreContext.jsx';
import { useAuth } from '../store/AuthContext.jsx';

// ── Company branding map ────────────────────────────────────────────────────
const COMPANY_META = {
  Google:     { color: '#4285F4', emoji: '🔵', grad: 'from-blue-600/20 to-blue-500/5' },
  Amazon:     { color: '#FF9900', emoji: '🟠', grad: 'from-amber-500/20 to-amber-400/5' },
  Microsoft:  { color: '#00A4EF', emoji: '🟦', grad: 'from-sky-500/20 to-sky-400/5' },
  Meta:       { color: '#0081FB', emoji: '💙', grad: 'from-blue-500/20 to-indigo-500/5' },
  Apple:      { color: '#A2AAAD', emoji: '🍎', grad: 'from-slate-400/20 to-slate-300/5' },
  Netflix:    { color: '#E50914', emoji: '🔴', grad: 'from-red-600/20 to-red-500/5' },
  Uber:       { color: '#000000', emoji: '⚫', grad: 'from-slate-700/20 to-slate-600/5' },
  Adobe:      { color: '#FF0000', emoji: '🎨', grad: 'from-red-500/20 to-rose-500/5' },
  Bloomberg:  { color: '#B68A5A', emoji: '📊', grad: 'from-amber-700/20 to-amber-600/5' },
  Atlassian:  { color: '#0052CC', emoji: '🔷', grad: 'from-blue-700/20 to-blue-600/5' },
  Salesforce: { color: '#00A1E0', emoji: '☁️', grad: 'from-cyan-500/20 to-cyan-400/5' },
  LinkedIn:   { color: '#0A66C2', emoji: '💼', grad: 'from-blue-700/20 to-blue-600/5' },
  Twitter:    { color: '#1DA1F2', emoji: '🐦', grad: 'from-sky-400/20 to-sky-300/5' },
  Spotify:    { color: '#1DB954', emoji: '🎵', grad: 'from-green-500/20 to-emerald-500/5' },
  Airbnb:     { color: '#FF5A5F', emoji: '🏠', grad: 'from-rose-500/20 to-rose-400/5' },
};

const DIFF_COLORS = { Easy: '#10b981', Medium: '#f59e0b', Hard: '#ef4444' };
const STATUS_CYCLE = { 'Not Started': 'Attempted', 'Attempted': 'Solved', 'Solved': 'Not Started' };
const STATUS_COLORS = { 'Solved': '#10b981', 'Attempted': '#f59e0b', 'Not Started': '#64748b' };

// Custom tooltip for bar chart
const BarTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-xl px-3 py-2 rounded-xl text-sm">
        <p className="text-slate-500 text-xs">{label}</p>
        <p className="text-slate-900 dark:text-white font-bold">{payload[0].value} Solved</p>
      </div>
    );
  }
  return null;
};

export default function CompanyProblems() {
  const { token } = useAuth();
  const [companies, setCompanies]           = useState([]);
  const [loadingList, setLoadingList]       = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [problems, setProblems]             = useState([]);
  const [stats, setStats]                   = useState(null);
  const [loadingProblems, setLoadingProblems] = useState(false);
  const [updatingId, setUpdatingId]         = useState(null);
  const [search, setSearch]                 = useState('');
  const [diffFilter, setDiffFilter]         = useState('All');
  const [statusFilter, setStatusFilter]     = useState('All');
  const [sortBy, setSortBy]                 = useState('frequency');

  // ── Fetch company list on mount ──────────────────────────────────────────
  const fetchCompanies = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch(buildApiUrl('/api/company/list'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setCompanies(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoadingList(false); }
  }, [token]);

  useEffect(() => { if (token) fetchCompanies(); }, [token]);

  // ── Fetch problems + stats when a company is selected ───────────────────
  const fetchCompanyData = useCallback(async (company) => {
    setLoadingProblems(true);
    setProblems([]);
    setStats(null);
    try {
      const [pRes, sRes] = await Promise.all([
        fetch(buildApiUrl(`/api/company/${company}/problems`), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(buildApiUrl(`/api/company/${company}/stats`), {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (pRes.ok) setProblems(await pRes.json());
      if (sRes.ok) setStats(await sRes.json());
    } catch (err) { console.error(err); }
    finally { setLoadingProblems(false); }
  }, [token]);

  const handleSelectCompany = useCallback((company) => {
    setSelectedCompany(company);
    setSearch('');
    setDiffFilter('All');
    setStatusFilter('All');
    fetchCompanyData(company);
  }, [fetchCompanyData]);

  // ── Toggle problem status ────────────────────────────────────────────────
  const handleStatusToggle = useCallback(async (problem) => {
    const nextStatus = STATUS_CYCLE[problem.status];
    setUpdatingId(problem.id);
    try {
      const res = await fetch(buildApiUrl(`/api/company/${selectedCompany}/progress`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ problemId: problem.id, status: nextStatus }),
      });
      if (res.ok) {
        setProblems(prev => prev.map(p => p.id === problem.id ? { ...p, status: nextStatus } : p));
        // Refresh stats
        const sRes = await fetch(buildApiUrl(`/api/company/${selectedCompany}/stats`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (sRes.ok) setStats(await sRes.json());
        // Refresh company list card
        setCompanies(prev => prev.map(c => {
          if (c.company !== selectedCompany) return c;
          const wasSolved   = problem.status === 'Solved';
          const nowSolved   = nextStatus === 'Solved';
          const wasAttempted = problem.status === 'Attempted';
          const nowAttempted = nextStatus === 'Attempted';
          return {
            ...c,
            solved:    c.solved    + (nowSolved   ? 1 : 0) - (wasSolved   ? 1 : 0),
            attempted: c.attempted + (nowAttempted ? 1 : 0) - (wasAttempted ? 1 : 0),
          };
        }));
      }
    } catch (err) { console.error(err); }
    finally { setUpdatingId(null); }
  }, [selectedCompany, token]);

  // ── Derived chart data ───────────────────────────────────────────────────
  const diffChartData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Easy',   solved: stats.easy.solved,   total: stats.easy.total,   fill: DIFF_COLORS.Easy },
      { name: 'Medium', solved: stats.medium.solved, total: stats.medium.total, fill: DIFF_COLORS.Medium },
      { name: 'Hard',   solved: stats.hard.solved,   total: stats.hard.total,   fill: DIFF_COLORS.Hard },
    ];
  }, [stats]);

  const activityData = useMemo(() => {
    if (!stats?.solvedByDate) return [];
    const today = new Date();
    const data = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      data.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: stats.solvedByDate[key] || 0,
      });
    }
    return data;
  }, [stats]);

  // ── Filtered + sorted problems ───────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...problems];
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.topics || []).some(t => t.toLowerCase().includes(search.toLowerCase())));
    if (diffFilter !== 'All') list = list.filter(p => p.difficulty === diffFilter);
    if (statusFilter !== 'All') list = list.filter(p => p.status === statusFilter);
    list.sort((a, b) => {
      if (sortBy === 'frequency') return (b.frequency || 0) - (a.frequency || 0);
      if (sortBy === 'difficulty') {
        const order = { Easy: 0, Medium: 1, Hard: 2 };
        return order[a.difficulty] - order[b.difficulty];
      }
      if (sortBy === 'status') {
        const order = { Solved: 0, Attempted: 1, 'Not Started': 2 };
        return order[a.status] - order[b.status];
      }
      return 0;
    });
    return list;
  }, [problems, search, diffFilter, statusFilter, sortBy]);

  const meta = selectedCompany ? (COMPANY_META[selectedCompany] || { color: '#6366f1', emoji: '🏢', grad: 'from-indigo-500/20 to-indigo-400/5' }) : null;

  // ── RENDER: Company Grid ─────────────────────────────────────────────────
  if (!selectedCompany) {
    return (
      <div className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-outfit text-slate-900 dark:text-white tracking-tight">
              Company Prep
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Curated interview problems — updated every 3 weeks
            </p>
          </div>
          <button
            onClick={fetchCompanies}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 text-xs font-bold transition-all"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {loadingList ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-card p-5 h-36 animate-pulse bg-slate-100 dark:bg-white/[0.02]" />
            ))}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
          >
            {companies.map(({ company, total, solved, attempted }) => {
              const cm = COMPANY_META[company] || { color: '#6366f1', emoji: '🏢', grad: 'from-indigo-500/20 to-indigo-400/5' };
              const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
              const circumference = 2 * Math.PI * 20;
              const strokeDash = (pct / 100) * circumference;

              return (
                <motion.button
                  key={company}
                  variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                  onClick={() => handleSelectCompany(company)}
                  className={`group relative overflow-hidden glass-card p-5 text-left transition-all hover:scale-[1.02] hover:shadow-xl flex flex-col gap-3 bg-gradient-to-br ${cm.grad}`}
                >
                  {/* Background glow */}
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ backgroundColor: cm.color + '30' }} />

                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{cm.emoji}</span>
                    {/* Mini donut ring */}
                    <svg width="52" height="52" viewBox="0 0 52 52" className="shrink-0">
                      <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="5" />
                      <circle
                        cx="26" cy="26" r="20" fill="none"
                        stroke={cm.color}
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray={`${strokeDash} ${circumference}`}
                        strokeDashoffset={circumference * 0.25}
                        style={{ transition: 'stroke-dasharray 0.6s ease' }}
                      />
                      <text x="26" y="30" textAnchor="middle" fontSize="10" fontWeight="bold"
                        fill={cm.color} style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {pct}%
                      </text>
                    </svg>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white font-outfit text-sm">
                      {company}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {solved}/{total} solved
                      {attempted > 0 && ` · ${attempted} in progress`}
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: cm.color }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {total} Problems
                    </span>
                    <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" style={{ color: cm.color }} />
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </div>
    );
  }

  // ── RENDER: Company Detail ───────────────────────────────────────────────
  const companyData = companies.find(c => c.company === selectedCompany);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={selectedCompany}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.25 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedCompany(null)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors text-sm font-bold"
          >
            <ArrowLeft size={18} />
            All Companies
          </button>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{meta.emoji}</span>
            <div>
              <h1 className="text-2xl font-bold font-outfit text-slate-900 dark:text-white">
                {selectedCompany}
              </h1>
              <p className="text-xs text-slate-500">Interview prep track · Updated every 3 weeks</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Problems', value: stats.total, icon: <Target size={16}/>, color: '#6366f1' },
              { label: 'Solved',         value: stats.solved, icon: <CheckCircle2 size={16}/>, color: '#10b981' },
              { label: 'In Progress',    value: stats.attempted, icon: <Clock size={16}/>, color: '#f59e0b' },
              { label: 'Completion',     value: `${stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0}%`, icon: <Award size={16}/>, color: meta.color },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="glass-card p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: color + '20', color }}>
                  {icon}
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
                  <p className="text-xl font-bold font-outfit text-slate-900 dark:text-white">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Charts Row */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Activity Chart — 14 days */}
            <div className="lg:col-span-2 glass-card p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} style={{ color: meta.color }} />
                <h2 className="section-title mb-0">Solve Activity (Last 14 Days)</h2>
              </div>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityData} margin={{ top: 5, right: 0, left: -30, bottom: 0 }}>
                    <XAxis dataKey="date" axisLine={false} tickLine={false}
                      tick={{ fontSize: 10, fill: '#94a3b8' }} minTickGap={24} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} fill={meta.color} fillOpacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Difficulty Breakdown */}
            <div className="glass-card p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <BarChart2 size={16} style={{ color: meta.color }} />
                <h2 className="section-title mb-0">By Difficulty</h2>
              </div>
              <div className="flex flex-col gap-3 mt-1">
                {diffChartData.map(({ name, solved, total, fill }) => {
                  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
                  return (
                    <div key={name} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold" style={{ color: fill }}>{name}</span>
                        <span className="text-slate-500 font-medium">{solved}/{total}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.7, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: fill }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Radial overall */}
              <div className="flex items-center justify-center mt-2">
                <div className="relative flex items-center justify-center">
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="8" />
                    {stats.total > 0 && (
                      <circle
                        cx="50" cy="50" r="38" fill="none"
                        stroke={meta.color}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${(stats.solved / stats.total) * 2 * Math.PI * 38} ${2 * Math.PI * 38}`}
                        strokeDashoffset={2 * Math.PI * 38 * 0.25}
                        style={{ transition: 'stroke-dasharray 0.8s ease' }}
                      />
                    )}
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-xl font-black font-outfit" style={{ color: meta.color }}>
                      {stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0}%
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Done</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Problem Table */}
        <div className="glass-card flex flex-col overflow-hidden">
          {/* Table Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-slate-200 dark:border-white/[0.06]">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search problems or topics…"
                className="input-field pl-8 py-2 text-sm"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Diff filter */}
            <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg gap-0.5">
              {['All', 'Easy', 'Medium', 'Hard'].map(d => (
                <button
                  key={d}
                  onClick={() => setDiffFilter(d)}
                  className={`px-3 py-1.5 text-[11px] font-bold tracking-wide rounded-md transition-all ${
                    diffFilter === d
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Status filter */}
            <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg gap-0.5">
              {['All', 'Solved', 'Attempted', 'Not Started'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 text-[11px] font-bold tracking-wide rounded-md transition-all whitespace-nowrap ${
                    statusFilter === s
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {s === 'All' ? 'All Status' : s}
                </button>
              ))}
            </div>

            {/* Count */}
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
              {filtered.length} / {problems.length}
            </span>
          </div>

          {/* Table */}
          {loadingProblems ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-slate-100 dark:bg-white/[0.03] animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <Zap size={32} className="opacity-30" />
              <p className="text-sm font-medium">No problems match your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th w-8">#</th>
                    <th
                      className="table-th"
                      onClick={() => setSortBy(sortBy === 'frequency' ? 'difficulty' : 'frequency')}
                    >
                      Problem
                    </th>
                    <th className="table-th hidden md:table-cell" onClick={() => setSortBy('difficulty')}>
                      Difficulty
                    </th>
                    <th className="table-th hidden lg:table-cell">Topics</th>
                    <th className="table-th">Freq</th>
                    <th className="table-th cursor-pointer" onClick={() => setSortBy('status')}>
                      Status
                    </th>
                    <th className="table-th w-10" />
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((problem, idx) => (
                      <motion.tr
                        key={problem.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="table-row"
                      >
                        {/* Index */}
                        <td className="table-td text-slate-400 text-xs tabular-nums">{idx + 1}</td>

                        {/* Name */}
                        <td className="table-td max-w-[260px]">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                            {problem.name}
                          </span>
                        </td>

                        {/* Difficulty */}
                        <td className="table-td hidden md:table-cell">
                          <span
                            className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                            style={{
                              color: DIFF_COLORS[problem.difficulty],
                              backgroundColor: DIFF_COLORS[problem.difficulty] + '15',
                            }}
                          >
                            {problem.difficulty}
                          </span>
                        </td>

                        {/* Topics */}
                        <td className="table-td hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {(problem.topics || []).slice(0, 3).map(t => (
                              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400">
                                {t}
                              </span>
                            ))}
                            {problem.topics?.length > 3 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-400">
                                +{problem.topics.length - 3}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Frequency stars */}
                        <td className="table-td">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full ${i < (problem.frequency || 3) ? 'opacity-100' : 'opacity-20'}`}
                                style={{ backgroundColor: i < (problem.frequency || 3) ? meta.color : '#94a3b8' }}
                              />
                            ))}
                          </div>
                        </td>

                        {/* Status Toggle */}
                        <td className="table-td">
                          <button
                            disabled={updatingId === problem.id}
                            onClick={() => handleStatusToggle(problem)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                            style={{
                              color: STATUS_COLORS[problem.status],
                              backgroundColor: STATUS_COLORS[problem.status] + '15',
                            }}
                          >
                            {problem.status === 'Solved' && <CheckCircle2 size={12} />}
                            {problem.status === 'Attempted' && <Clock size={12} />}
                            {problem.status === 'Not Started' && <Circle size={12} />}
                            <span className="hidden sm:inline">
                              {updatingId === problem.id ? '…' : problem.status}
                            </span>
                          </button>
                        </td>

                        {/* External link */}
                        <td className="table-td">
                          <a
                            href={problem.link}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors inline-flex"
                          >
                            <ExternalLink size={13} />
                          </a>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
