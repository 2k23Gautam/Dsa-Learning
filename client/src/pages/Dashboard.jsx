import { useMemo, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { format, subDays, subMonths } from 'date-fns';
import { Target, CheckCircle2, Flame, TrendingUp, Globe, ExternalLink, CalendarDays, Clock, Award, Network, Share2, Type, Layers, Zap, Binary, Database, BookOpen, Search } from 'lucide-react';
import { buildApiUrl, useStore } from '../store/StoreContext.jsx';
import { useAuth } from '../store/AuthContext.jsx';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import CircularProgress from '../components/CircularProgress.jsx';
import CodeforcesTabContent from '../components/CodeforcesTabContent.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import BadgeDisplay from '../components/BadgeDisplay.jsx';
import MilestoneModal from '../components/MilestoneModal.jsx';
import ProblemDrawer from '../components/ProblemDrawer.jsx';
import { Sparkles } from 'lucide-react';

import { BAR_COLORS } from '../store/data.js';

const MONTHS = [
  { value: 0, label: 'Jan' },
  { value: 1, label: 'Feb' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Apr' },
  { value: 4, label: 'May' },
  { value: 5, label: 'Jun' },
  { value: 6, label: 'Jul' },
  { value: 7, label: 'Aug' },
  { value: 8, label: 'Sep' },
  { value: 9, label: 'Oct' },
  { value: 10, label: 'Nov' },
  { value: 11, label: 'Dec' },
];

const getTopicIcon = (topic) => {
  const t = topic.toLowerCase();
  if (t.includes('tree')) return <Network size={16} className="text-blue-500" />;
  if (t.includes('graph')) return <Share2 size={16} className="text-indigo-500" />;
  if (t.includes('string')) return <Type size={16} className="text-pink-500" />;
  if (t.includes('array') || t.includes('list') || t.includes('matrix') || t.includes('vector')) return <Layers size={16} className="text-emerald-500" />;
  if (t.includes('dp') || t.includes('dynamic') || t.includes('greedy') || t.includes('backtrack')) return <Zap size={16} className="text-amber-500" />;
  if (t.includes('search') || t.includes('sort') || t.includes('binary search')) return <Search size={16} className="text-cyan-500" />;
  if (t.includes('math') || t.includes('bit') || t.includes('number') || t.includes('geometry')) return <Binary size={16} className="text-purple-500" />;
  if (t.includes('stack') || t.includes('queue') || t.includes('heap') || t.includes('hash') || t.includes('map') || t.includes('set')) return <Database size={16} className="text-rose-500" />;
  return <BookOpen size={16} className="text-slate-500" />;
};

export default function Dashboard() {
  const { stats, problems, detectedSubmissions, dismissSubmission, checkGlobalSubmissions, clearDismissedSubmissions, submissionSyncError, lastSyncTime, todayStr } = useStore();
  const { authUser } = useAuth();
  const [timeRange, setTimeRange] = useState('14 Days');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [drawerState, setDrawerState] = useState({ open: false, problem: null, initialTab: 'overview', initialData: null });
  const [contests, setContests] = useState([]);
  const [contestError, setContestError] = useState(false);
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { token } = useAuth();

  const handleForceSync = async () => {
    setIsSyncing(true);
    await checkGlobalSubmissions(true);
    setIsSyncing(false);
  };

  const fetchContests = async () => {
    setContestError(false);
    try {
      const res = await fetch(buildApiUrl('/api/platforms/contests'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setContests(await res.json());
      } else {
        setContestError(true);
      }
    } catch (e) {
      console.error('Contest fetch error:', e);
      setContestError(true);
    }
  };

  // Re-fetch on every mount so data is always fresh
  useEffect(() => {
    if (token) fetchContests();
  }, [token]);

  const handleRegister = async (contestId, link) => {
    window.open(link, '_blank');
    try {
      await fetch(buildApiUrl('/api/platforms/contests/dismiss'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ contestId })
      });
      // Refresh list
      fetchContests();
    } catch (e) { console.error('Dismiss error:', e); }
  };

  const [activeTab, setActiveTab] = useState(authUser?.leetcodeUsername ? 'LeetCode' : 'Codeforces');

  const connectedPlatforms = useMemo(() => {
    const list = [];
    if (authUser?.leetcodeUsername) list.push({ name: 'LeetCode', handle: authUser.leetcodeUsername, stats: authUser.leetcodeStats });
    if (authUser?.codeforcesHandle) list.push({ name: 'Codeforces', handle: authUser.codeforcesHandle });
    return list;
  }, [authUser]);

  const urgentRevision = useMemo(() => {
    if (!todayStr) return [];
    return problems.filter(p => p.status === 'Needs Revision' && p.revisionDate && p.revisionDate <= todayStr);
  }, [problems, todayStr]);

  const availableYears = useMemo(() => {
    const years = new Set([new Date().getFullYear()]);
    problems.forEach(p => {
      const dateStr = p.dateSolved || p.solvedDate;
      if (dateStr && dateStr.length >= 4) {
        const yr = parseInt(dateStr.substring(0, 4), 10);
        if (!isNaN(yr)) {
          years.add(yr);
        }
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [problems]);

  const activityData = useMemo(() => {
    const data = [];
    
    if (timeRange === '14 Days') {
      const now = new Date();
      for (let i = 13; i >= 0; i--) {
        const d = subDays(now, i);
        const ds = format(d, 'yyyy-MM-dd');
        const count = problems.filter(p => (p.dateSolved || p.solvedDate)?.substring(0,10) === ds).length;
        data.push({ date: format(d, 'MMM dd'), count });
      }
    } else if (timeRange === 'Month') {
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(selectedYear, selectedMonth, day);
        const ds = format(d, 'yyyy-MM-dd');
        const count = problems.filter(p => (p.dateSolved || p.solvedDate)?.substring(0,10) === ds).length;
        data.push({ date: format(d, 'MMM dd'), count });
      }
    } else if (timeRange === 'Year') {
      for (let m = 0; m < 12; m++) {
        const monthPrefix = `${selectedYear}-${(m + 1).toString().padStart(2, '0')}`;
        const count = problems.filter(p => (p.dateSolved || p.solvedDate)?.startsWith(monthPrefix)).length;
        const d = new Date(selectedYear, m, 1);
        data.push({ date: format(d, 'MMM'), count });
      }
    }
    return data;
  }, [problems, timeRange, selectedYear, selectedMonth]);

  const topicProgress = useMemo(() => {
    const map = {};
    problems.forEach(p => {
      (p.topics || []).forEach(t => {
        if (!map[t]) map[t] = { tracked: 0, solved: 0, revised: 0, needsRevision: 0, others: 0 };
        map[t].tracked += 1;
        
        if (p.status === 'Solved') map[t].solved += 1;
        else if (p.status === 'Revised') map[t].revised += 1;
        else if (p.status === 'Needs Revision') map[t].needsRevision += 1;
        else map[t].others += 1;
      });
    });
    return Object.entries(map)
      .map(([label, counts]) => ({ label, ...counts }))
      .sort((a, b) => b.tracked - a.tracked);
  }, [problems]);


  const totalProblems = useMemo(() => problems.length, [problems]);
  
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const next = lastSyncTime + (5 * 60 * 1000);
      const diff = next - now;

      if (diff <= 0) {
        setTimeLeft('Refresh available');
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`Refreshing in ${mins}:${secs.toString().padStart(2, '0')}`);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [lastSyncTime]);

  return (
    <div className="space-y-6">
      
      {/* Premium Header / Greeting Banner */}
      <div 
        className="relative overflow-hidden rounded-3xl border border-slate-200/50 dark:border-white/[0.06] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 md:p-8 text-white shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
        {/* Glow blobs */}
        <div className="absolute -left-16 -top-16 w-32 h-32 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -right-16 -bottom-16 w-32 h-32 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black bg-brand-500/20 border border-brand-500/30 text-brand-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Student Dashboard
            </span>
            <span className="text-[10px] font-black bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-outfit tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Welcome back, {authUser?.name || 'Developer'}! ✨
          </h1>
          <p className="text-slate-400 text-sm font-medium">
            You have solved <span className="text-brand-400 font-bold">{totalProblems}</span> problems in total. Ready to push your stats today?
          </p>
        </div>

        <div className="flex items-center gap-4 relative z-10 shrink-0 flex-wrap">
          {/* Quick Stats Summary in Greeting */}
          <div className="flex gap-2">
            <div className="px-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.04] backdrop-blur-md">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Solved Today</span>
              <span className="text-xl font-bold font-outfit text-white">{stats.today}</span>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.04] backdrop-blur-md flex items-center gap-2">
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Current Streak</span>
                <span className="text-xl font-bold font-outfit text-orange-400">{stats.streak}d</span>
              </div>
              <Flame size={20} className="text-orange-500 animate-pulse fill-orange-500/20" />
            </div>
          </div>
        </div>
      </div>

      {/* Contest Monitor Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-1 px-1">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-brand-500" />
            <h2 className="text-sm font-extrabold font-outfit text-slate-900 dark:text-white uppercase tracking-wider">Upcoming Contests (Next 48h)</h2>
          </div>
          <button 
            onClick={fetchContests}
            className="text-[10px] font-black text-brand-500 uppercase tracking-widest hover:text-brand-600 transition-colors bg-brand-500/5 hover:bg-brand-500/10 px-2.5 py-1 rounded-md border border-brand-500/10"
          >
            Refresh List
          </button>
        </div>

        {contests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contests.map((contest) => {
              const isCodeforces = contest.platform?.toLowerCase().includes('codeforces');
              const color = isCodeforces ? '#f59e0b' : '#3b82f6';
              const bgClass = isCodeforces ? 'from-amber-500/10 to-amber-500/5 hover:border-amber-500/30' : 'from-blue-500/10 to-blue-500/5 hover:border-blue-500/30';
              
              return (
                <div key={contest.id} className={`relative group overflow-hidden rounded-2xl border border-slate-200/50 dark:border-white/[0.06] bg-gradient-to-br ${bgClass} p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl`}>
                  <div className="flex items-center justify-between gap-4 mb-3 relative z-10">
                    <div className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
                      style={{ backgroundColor: `${color}15`, color }}>
                      {contest.platform}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                      <Clock size={12} className="text-slate-400" />
                      {format(new Date(contest.startTime), 'MMM dd, HH:mm')}
                    </div>
                  </div>
                  
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 line-clamp-1 relative z-10 tracking-tight">
                    {contest.name}
                  </h3>

                  <div className="flex items-center justify-between relative z-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Starts in {Math.max(0, Math.round((contest.startTime - Date.now()) / (1000 * 60 * 60)))}h
                    </p>
                    <button 
                      onClick={() => handleRegister(contest.id, contest.link)}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-colors border border-slate-200/50 dark:border-white/[0.04]"
                    >
                      Register
                    </button>
                  </div>
                  <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full blur-3xl opacity-10"
                    style={{ backgroundColor: color }} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4 border-dashed border-slate-200 dark:border-white/[0.08]">
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${contestError ? 'bg-red-50 dark:bg-red-500/[0.08] text-red-400' : 'bg-slate-50 dark:bg-white/[0.02] text-slate-300 dark:text-slate-600'}`}>
               <CalendarDays size={32} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                {contestError ? 'Could Not Load Contests' : 'No Upcoming Contests'}
              </h3>
              <p className="text-xs text-slate-500 max-w-[260px] mt-1">
                {contestError
                  ? 'The contest data source is temporarily unavailable. Please try refreshing.'
                  : 'There are no contests scheduled on supported platforms in the next 48 hours.'}
              </p>
            </div>
            <button onClick={fetchContests} className="px-4 py-2 rounded-xl bg-brand-500/10 text-brand-600 text-[10px] font-black uppercase tracking-widest hover:bg-brand-500/20 transition-all">
              {contestError ? 'Retry' : 'Check Now'}
            </button>
          </div>
        )}
      </div>

      {/* Bento Grid: Statistics Hub */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Main Bento Progress Card */}
        <div className="md:col-span-2 gradient-glass p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
          <div className="space-y-4 min-w-0 flex-1">
            <div>
              <span className="text-[10px] font-black text-brand-500 dark:text-brand-400 uppercase tracking-widest block mb-1">
                COMPLETION SCORE
              </span>
              <h3 className="text-xl font-bold font-outfit text-slate-800 dark:text-white tracking-tight">
                Overall Progress
              </h3>
            </div>
            
            {/* Minimalist analytics details */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold">All Solved</span>
                <span className="font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                  {stats.easy + stats.medium + stats.hard} / {totalProblems}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full"
                  style={{ width: `${totalProblems > 0 ? ((stats.easy + stats.medium + stats.hard) / totalProblems) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-bold text-slate-500 uppercase">{stats.easy} Easy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-[11px] font-bold text-slate-500 uppercase">{stats.medium} Med</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-[11px] font-bold text-slate-500 uppercase">{stats.hard} Hard</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-center">
            <CircularProgress
              label="TRACKING"
              value={totalProblems}
              max={totalProblems || 1}
              color="#3b82f6"
              size={120}
              strokeWidth={10}
              noCard
              icon={<Target size={18} className="text-brand-500" />}
            />
          </div>
        </div>

        {/* Difficulty Bento Cards */}
        <div className="grid grid-cols-3 md:grid-cols-1 md:col-span-1 gap-4">
          <div className="gradient-glass p-4 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden group hover:border-emerald-500/30">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">EASY</span>
              <p className="text-2xl font-black font-outfit text-slate-800 dark:text-white leading-none">{stats.easy}</p>
            </div>
            <div className="shrink-0 scale-90 md:scale-100">
              <CircularProgress
                label=""
                value={stats.easy}
                max={totalProblems || 1}
                color="#10b981"
                size={54}
                strokeWidth={5}
                noCard
              />
            </div>
          </div>

          <div className="gradient-glass p-4 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden group hover:border-amber-500/30">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">MEDIUM</span>
              <p className="text-2xl font-black font-outfit text-slate-800 dark:text-white leading-none">{stats.medium}</p>
            </div>
            <div className="shrink-0 scale-90 md:scale-100">
              <CircularProgress
                label=""
                value={stats.medium}
                max={totalProblems || 1}
                color="#f59e0b"
                size={54}
                strokeWidth={5}
                noCard
              />
            </div>
          </div>

          <div className="gradient-glass p-4 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden group hover:border-rose-500/30">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block">HARD</span>
              <p className="text-2xl font-black font-outfit text-slate-800 dark:text-white leading-none">{stats.hard}</p>
            </div>
            <div className="shrink-0 scale-90 md:scale-100">
              <CircularProgress
                label=""
                value={stats.hard}
                max={totalProblems || 1}
                color="#ef4444"
                size={54}
                strokeWidth={5}
                noCard
              />
            </div>
          </div>
        </div>

        {/* Streaks & Today stats */}
        <div className="grid grid-cols-2 md:grid-cols-1 md:col-span-1 gap-4">
          <div className="gradient-glass p-5 flex items-center justify-between relative overflow-hidden group hover:border-orange-500/30">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">CURRENT STREAK</span>
              <p className="text-2xl font-black font-outfit text-orange-500">{stats.streak} Days</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/15 flex items-center justify-center text-orange-500 animate-pulse">
              <Flame size={20} className="fill-orange-500/20" />
            </div>
          </div>

          <div className="gradient-glass p-5 flex items-center justify-between relative overflow-hidden group hover:border-emerald-500/30">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">SOLVED TODAY</span>
              <p className="text-2xl font-black font-outfit text-slate-800 dark:text-white">{stats.today} Problems</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center text-emerald-500">
              <CheckCircle2 size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Unified Insights Hub with Animated Tabs */}
      <div 
        className={`gradient-glass p-6 md:p-8 flex flex-col gap-8 border-l-4 relative overflow-hidden transition-all duration-500 ${activeTab === 'LeetCode' ? 'border-blue-500/50' : 'border-amber-500/50'}`}
      >
        {/* Glow Effects corresponding to active tab */}
        <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[100px] transition-colors duration-1000 z-0 ${activeTab === 'LeetCode' ? 'bg-blue-500/20' : 'bg-amber-500/20'}`} />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10 w-full">
          {/* Left: icon + title */}
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-500 shadow-lg ${activeTab === 'LeetCode' ? 'bg-blue-500/10 text-blue-500 shadow-blue-500/10' : 'bg-amber-500/10 text-amber-500 shadow-amber-500/10'}`}>
              <Globe size={28} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold font-outfit text-slate-800 dark:text-white tracking-tight">Platform Insights</h2>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {connectedPlatforms.length > 0
                  ? `Unified real-time tracking. ${timeLeft}`
                  : "Connect your accounts in Profile to see automated insights"}
              </p>
              {submissionSyncError && (
                <p className="text-[10px] text-rose-500 font-bold mt-1">⚠️ {submissionSyncError}</p>
              )}
            </div>
          </div>

          {/* Right: sync buttons + tab switcher */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Manual Sync Now + Reset Dismissed */}
            {connectedPlatforms.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleForceSync}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 transition-all disabled:opacity-50"
                  title="Force re-fetch recent submissions from LeetCode & Codeforces"
                >
                  {isSyncing ? (
                    <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z" className="opacity-75" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4.93 9A10 10 0 0119 15M19.07 15A10 10 0 015 9" />
                    </svg>
                  )}
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
                {detectedSubmissions.length === 0 && (
                  <button
                    onClick={clearDismissedSubmissions}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 transition-all"
                    title="Clear all dismissed submissions so they can be re-detected"
                  >
                    Reset Dismissed
                  </button>
                )}
              </div>
            )}

            {/* Smart Tab Switcher */}
            {connectedPlatforms.length > 1 && (
              <div className="flex p-1.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl overflow-hidden shadow-inner border border-slate-200/50 dark:border-white/[0.03]">
                {connectedPlatforms.map(p => (
                  <button
                    key={p.name}
                    onClick={() => setActiveTab(p.name)}
                    className={`relative px-6 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all duration-300 z-10 ${activeTab === p.name ? (p.name === 'LeetCode' ? 'text-blue-500' : 'text-amber-500') : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    {activeTab === p.name && (
                      <motion.div 
                        layoutId="insightTabBg" 
                        className={`absolute inset-0 shadow-sm rounded-lg -z-10 ${p.name === 'LeetCode' ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`} 
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>


        {/* Dynamic Tab Content Area */}
        <div className="relative z-10 w-full min-h-[80px]">
          {connectedPlatforms.length === 0 ? (
            <div className="flex">
              <NavLink to="/profile" className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-500/20">
                Connect Platforms Here
              </NavLink>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'LeetCode' && (
                <motion.div 
                  key="leetcodeTab"
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}
                  className="flex flex-wrap items-center gap-8 w-full"
                >
                  {(() => {
                    const lcPlatform = connectedPlatforms.find(p => p.name === 'LeetCode');
                    if (!lcPlatform) return null;
                    const stats = lcPlatform.stats?.matchedUser?.submitStats?.acSubmissionNum || [];
                    const solved = stats[0]?.count || 0;
                    const rating = lcPlatform.stats?.userContestRanking ? Math.round(lcPlatform.stats.userContestRanking.rating) : null;
                    const rank = lcPlatform.stats?.userContestRanking?.globalRanking || null;
                    
                    return (
                      <>
                        <div className="flex items-center gap-4 border-r border-slate-200 dark:border-white/10 pr-8">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-lg font-black font-outfit shadow-md shadow-orange-500/20">
                            LC
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                              {lcPlatform.handle}
                            </h3>
                            <span className="text-[10px] font-extrabold bg-blue-500/10 text-blue-500 dark:text-blue-400 px-2 py-0.5 rounded-md uppercase tracking-wider mt-0.5 inline-block">
                              LeetCode Integrated
                            </span>
                          </div>
                        </div>

                        <div className="text-center border-r border-slate-200 dark:border-white/10 pr-8">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Platform Solved</p>
                           <p className="text-2xl font-extrabold font-outfit text-blue-500">
                             {solved > 0 ? solved : '--'}
                           </p>
                        </div>

                        {rating && (
                          <div className="text-center border-r border-slate-200 dark:border-white/10 pr-8">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Contest Rating</p>
                            <p className="text-2xl font-extrabold font-outfit text-emerald-500">{rating}</p>
                          </div>
                        )}
                        
                        {rank && (
                          <div className="text-center pr-8">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Global Rank</p>
                            <p className="text-2xl font-extrabold font-outfit text-slate-700 dark:text-slate-300">
                              #{rank.toLocaleString()}
                            </p>
                          </div>
                        )}

                        <a 
                          href={`https://leetcode.com/${lcPlatform.handle}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all ml-auto border border-slate-200/50 dark:border-white/[0.04]"
                        >
                          View Profile <ExternalLink size={12} />
                        </a>
                      </>
                    );
                  })()}
                </motion.div>
              )}

              {activeTab === 'Codeforces' && (
                <CodeforcesTabContent key="cfTab" handle={authUser?.codeforcesHandle} />
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Activity Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Urgent Revision Banner */}
          {urgentRevision.length > 0 && (
            <div className="gradient-glass p-5 border-l-4 border-rose-500 animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-rose-500/[0.01] pointer-events-none" />
              <div className="flex items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/10 text-rose-500 shadow-inner">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Time for Revision!
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      You have <span className="font-bold text-rose-500">{urgentRevision.length}</span> {urgentRevision.length === 1 ? 'problem' : 'problems'} scheduled for revision. E.g. <span className="font-semibold text-rose-500">"{urgentRevision[0].name}"</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setDrawerState({ open: true, problem: urgentRevision[0], initialTab: 'overview' })}
                    className="px-4 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all whitespace-nowrap active:scale-[0.97]"
                  >
                    View Revision
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* New Submission Banner */}
          {detectedSubmissions.length > 0 && (
            <div className="gradient-glass p-5 border-l-4 border-brand-500 animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-brand-500/[0.01] pointer-events-none" />
              <div className="flex items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-brand-500/10 text-brand-500 shadow-inner">
                    <Globe size={20} className="animate-pulse text-brand-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {detectedSubmissions.length > 1 
                        ? `You solved ${detectedSubmissions.length} problems today!` 
                        : `New ${detectedSubmissions[0].platform} Submission!`}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {detectedSubmissions.length > 1
                        ? `Track them one by one. Starting with `
                        : `You solved `}
                      <span className="font-semibold text-brand-500">"{detectedSubmissions[0].title}"</span>. Track it now?
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => dismissSubmission(detectedSubmissions[0].titleSlug)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  >
                    Ignore
                  </button>
                  <button 
                    onClick={() => {
                      const s = detectedSubmissions[0];
                      setDrawerState({
                        open: true,
                        problem: null,
                        initialTab: 'edit',
                        initialData: {
                          name: s.title,
                          link: s.platform === 'LeetCode' 
                            ? `https://leetcode.com/problems/${s.titleSlug}/` 
                            : s.platform === 'Codeforces'
                            ? `https://codeforces.com/contest/${s.titleSlug.split('-')[0]}/problem/${s.titleSlug.split('-')[1]}`
                            : s.platform === 'CodeChef'
                            ? `https://www.codechef.com/problems/${s.titleSlug}`
                            : '',
                          platform: s.platform,
                          difficulty: s.difficulty || 'Medium'
                        }
                      });
                      dismissSubmission(s.titleSlug);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-brand-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-brand-500/20 hover:bg-brand-600 transition-all active:scale-[0.97]"
                  >
                    Track It
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="gradient-glass p-5 md:p-6 flex flex-col h-[340px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <h2 className="section-title flex items-center gap-2 mb-0">
                  <TrendingUp size={18} className="text-brand-500" />
                  Activity Overview
                </h2>
                {timeRange !== '14 Days' && (
                  <div className="flex items-center gap-1.5 animate-in fade-in duration-300">
                    {timeRange === 'Month' && (
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                        className="px-2 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.06] outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                      >
                        {MONTHS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    )}
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                      className="px-2 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.06] outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                    >
                      {availableYears.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg self-end sm:self-auto border border-slate-200/50 dark:border-white/[0.04]">
                {['14 Days', 'Month', 'Year'].map((btn) => (
                  <button
                    key={btn}
                    onClick={() => setTimeRange(btn)}
                    className={`px-3 py-1 text-[11px] font-bold tracking-wide rounded-md transition-colors ${timeRange === btn ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    dy={10}
                    minTickGap={20}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(148,163,184,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCount)"
                    activeDot={{ r: 4, strokeWidth: 0, fill: '#3b82f6' }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Topic Mastery */}
        <div className="gradient-glass p-5 md:p-6 flex flex-col h-[340px]">
          <div className="flex items-center justify-between mb-4 border-b border-slate-200/50 dark:border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-brand-500" />
              <h2 className="text-sm font-extrabold font-outfit text-slate-900 dark:text-white uppercase tracking-wider">Topic Mastery</h2>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-white/[0.04] px-2 py-0.5 rounded-md">
              {topicProgress.length} Topics
            </span>
          </div>

          {topicProgress.length > 0 ? (
            <div className="flex-1 overflow-y-auto pr-1 no-scrollbar">
              <div className="grid grid-cols-2 gap-2.5 pb-2">
                {topicProgress.map((topic) => {
                  const total = topic.tracked || 1;
                  const solvedPct = Math.round((topic.solved / total) * 100);

                  // Color based on completion
                  const pctColor =
                    solvedPct === 100 ? BAR_COLORS.solved :
                    solvedPct >= 60   ? '#3b82f6' :
                    solvedPct >= 30   ? BAR_COLORS.needsRevision :
                                        '#ef4444';

                  return (
                    <div
                      key={topic.label}
                      className="group relative overflow-hidden rounded-2xl p-4 border border-slate-200/50 dark:border-white/[0.06] bg-gradient-to-br from-slate-50/50 to-white/30 dark:from-white/[0.02] dark:to-white/[0.005] flex flex-col gap-3.5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-slate-300 dark:hover:border-white/10"
                    >
                      {/* Background pattern */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
                      
                      {/* Hover glow blob */}
                      <div
                        className="absolute -right-4 -top-4 w-16 h-16 rounded-full blur-2xl opacity-20 group-hover:opacity-40 group-hover:scale-125 transition-all duration-500"
                        style={{ backgroundColor: pctColor }}
                      />

                      {/* Header details */}
                      <div className="flex items-start justify-between gap-3 relative z-10 min-w-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/20 dark:border-white/[0.04] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300">
                            {getTopicIcon(topic.label)}
                          </div>
                          <span className="text-[12px] font-bold text-slate-800 dark:text-slate-200 leading-tight truncate w-full" title={topic.label}>
                            {topic.label}
                          </span>
                        </div>
                        <span
                          className="text-[15px] font-black leading-none font-outfit"
                          style={{ color: pctColor }}
                        >
                          {solvedPct}%
                        </span>
                      </div>

                      {/* Glowing progress line */}
                      <div className="relative h-2 w-full rounded-full bg-slate-200/50 dark:bg-white/[0.06] overflow-hidden z-10 shadow-inner">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                          style={{
                            width: `${solvedPct}%`,
                            background: `linear-gradient(90deg, ${pctColor}88, ${pctColor})`,
                            boxShadow: `0 0 8px ${pctColor}55`
                          }}
                        />
                      </div>

                      {/* Footer tags */}
                      <div className="flex items-center justify-between relative z-10 text-[10px] text-slate-500">
                        <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-white/[0.03] px-2 py-0.5 rounded-full border border-slate-200/10 dark:border-white/[0.04]">
                          {topic.solved > 0 && (
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BAR_COLORS.solved }} title="Solved" />
                          )}
                          {topic.revised > 0 && (
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BAR_COLORS.revised }} title="Revised" />
                          )}
                          {topic.needsRevision > 0 && (
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BAR_COLORS.needsRevision }} title="Needs Revision" />
                          )}
                          {topic.others > 0 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" title="Not Started" />
                          )}
                          <span className="font-bold text-[9px] dark:text-slate-400 uppercase leading-none ml-1">Breakdown</span>
                        </div>
                        <span className="font-extrabold text-[11px] tabular-nums font-outfit dark:text-slate-400">
                          {topic.solved} <span className="font-bold text-slate-500">/ {topic.tracked}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm font-medium text-slate-400 dark:text-slate-600 text-center my-auto">
              Add problems with topics to see your breakdown.
            </p>
          )}
        </div>
        
      </div>

      <ProblemDrawer
        open={drawerState.open}
        onClose={() => setDrawerState({ open: false, problem: null, initialTab: 'overview', initialData: null })}
        problem={drawerState.problem}
        initialTab={drawerState.initialTab}
        initialData={drawerState.initialData}
      />


      <MilestoneModal
        open={milestoneModalOpen}
        onClose={() => setMilestoneModalOpen(false)}
        points={authUser?.gdPoints || 0}
        history={authUser?.gdPointHistory || []}
      />
    </div>
  );
}

function SmallStatCard({ label, value, icon, colorClass }) {
  return (
    <div className="glass-card p-4 flex items-center justify-between">
      <div>
        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 tracking-wider block mb-1">
          {label}
        </span>
        <p className="text-xl font-bold font-outfit text-slate-900 dark:text-white tracking-tight">
          {value}
        </p>
      </div>
      <div className={`w-8 h-8 rounded-full bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center ${colorClass}`}>
        {icon}
      </div>
    </div>
  );
}



const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-md border border-white/[0.08] shadow-2xl px-3 py-2 rounded-xl text-xs flex flex-col gap-0.5 text-white">
        <span className="text-slate-400 font-medium">{label}</span>
        <span className="font-extrabold text-sm text-brand-400">{payload[0].value} Solved</span>
      </div>
    );
  }
  return null;
};
