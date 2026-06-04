import { useMemo, useState, useEffect, useRef } from 'react';
import { useStore } from '../store/StoreContext.jsx';
import { DifficultyBadge, StatusBadge, PatternChip } from '../components/Badges.jsx';
import ProblemDrawer from '../components/ProblemDrawer.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { 
  Clock4, FolderKanban, Lightbulb, X, Code2, Network, Share2, Type, 
  Layers, Zap, Binary, Database, BookOpen, Search, BarChart3, CheckCircle, Award
} from 'lucide-react';

const getTopicIcon = (topic) => {
  const t = topic.toLowerCase();
  if (t.includes('tree')) return <Network size={15} className="text-blue-500" />;
  if (t.includes('graph')) return <Share2 size={15} className="text-indigo-500" />;
  if (t.includes('string')) return <Type size={15} className="text-pink-500" />;
  if (t.includes('array') || t.includes('list') || t.includes('matrix') || t.includes('vector')) return <Layers size={15} className="text-emerald-500" />;
  if (t.includes('dp') || t.includes('dynamic') || t.includes('greedy') || t.includes('backtrack')) return <Zap size={15} className="text-amber-500" />;
  if (t.includes('search') || t.includes('sort') || t.includes('binary search')) return <Search size={15} className="text-cyan-500" />;
  if (t.includes('math') || t.includes('bit') || t.includes('number') || t.includes('geometry')) return <Binary size={15} className="text-purple-500" />;
  if (t.includes('stack') || t.includes('queue') || t.includes('heap') || t.includes('hash') || t.includes('map') || t.includes('set')) return <Database size={15} className="text-rose-500" />;
  return <BookOpen size={15} className="text-slate-500" />;
};

function BoardSkeleton() {
  return (
    <div className="kanban-board flex-1 min-h-0 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex flex-col gap-4 min-w-[310px] w-[310px] bg-slate-100/50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/[0.04] rounded-3xl p-4 shrink-0 h-[calc(100vh-210px)] relative overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/50 dark:border-white/[0.04]">
            <div className="flex items-center gap-2 w-2/3">
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-white/[0.04]" />
              <div className="h-4 bg-slate-200 dark:bg-white/[0.04] rounded w-20" />
            </div>
            <div className="h-4 bg-slate-200 dark:bg-white/[0.04] rounded w-10" />
          </div>
          <div className="space-y-3 flex-1 overflow-hidden">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="w-full bg-white/70 dark:bg-[#090e1a]/70 border border-slate-200/50 dark:border-white/[0.06] rounded-2xl p-4 space-y-3 h-28">
                <div className="h-4 bg-slate-200 dark:bg-white/[0.04] rounded w-5/6" />
                <div className="flex gap-1">
                  <div className="h-4 bg-slate-200 dark:bg-white/[0.04] rounded w-10" />
                  <div className="h-4 bg-slate-200 dark:bg-white/[0.04] rounded w-16" />
                </div>
                <div className="h-3 bg-slate-200 dark:bg-white/[0.04] rounded w-1/3" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TopicBoard() {
  const { problems, problemsLoading } = useStore();
  const [diffFilter, setDiffFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerState, setDrawerState] = useState({ open: false, problem: null, initialTab: 'overview' });

  // Add columns lazy loading state & ref
  const [visibleColumnsCount, setVisibleColumnsCount] = useState(6);
  const horizontalSentinelRef = useRef(null);

  const filtered = useMemo(() => {
    return problems.filter(p => {
      if (diffFilter && p.difficulty !== diffFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name ? p.name.toLowerCase().includes(q) : false;
        const matchesId = p.id ? p.id.toLowerCase().includes(q) : false;
        const matchesTopics = p.topics ? p.topics.some(t => t.toLowerCase().includes(q)) : false;
        const matchesPatterns = p.patterns ? p.patterns.some(pt => pt.toLowerCase().includes(q)) : false;
        if (!matchesName && !matchesId && !matchesTopics && !matchesPatterns) return false;
      }
      return true;
    });
  }, [problems, diffFilter, statusFilter, searchQuery]);

  const topicMap = useMemo(() => {
    const map = {};
    filtered.forEach(p => {
      (p.topics || []).forEach(t => {
        if (!map[t]) map[t] = [];
        map[t].push(p);
      });
    });
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  // Compute Topic Board statistics based on active filters
  const stats = useMemo(() => {
    const uniqueTopics = new Set();
    let totalProblemsOnBoard = 0;
    let solvedProblemsOnBoard = 0;
    let easy = 0, medium = 0, hard = 0;
    let maxTopicName = 'None';
    let maxTopicCount = 0;

    filtered.forEach(p => {
      totalProblemsOnBoard++;
      if (p.status === 'Solved' || p.status === 'Revised') {
        solvedProblemsOnBoard++;
      }
      if (p.difficulty === 'Easy') easy++;
      else if (p.difficulty === 'Medium') medium++;
      else if (p.difficulty === 'Hard') hard++;
      
      (p.topics || []).forEach(t => {
        uniqueTopics.add(t);
      });
    });

    const counts = {};
    filtered.forEach(p => {
      (p.topics || []).forEach(t => {
        counts[t] = (counts[t] || 0) + 1;
        if (counts[t] > maxTopicCount) {
          maxTopicCount = counts[t];
          maxTopicName = t;
        }
      });
    });

    return {
      topicsCount: uniqueTopics.size,
      total: totalProblemsOnBoard,
      solved: solvedProblemsOnBoard,
      easy,
      medium,
      hard,
      activeTopic: maxTopicName,
      activeCount: maxTopicCount
    };
  }, [filtered]);

  // Reset columns visibility when filters or topic map change
  useEffect(() => {
    setVisibleColumnsCount(6);
  }, [diffFilter, statusFilter, searchQuery, topicMap.length]);

  // Setup horizontal column loader observer
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleColumnsCount(prev => Math.min(topicMap.length, prev + 6));
      }
    }, {
      root: null,
      rootMargin: '200px', // start loading next columns early
      threshold: 0.1
    });

    if (horizontalSentinelRef.current) {
      observer.observe(horizontalSentinelRef.current);
    }

    return () => observer.disconnect();
  }, [topicMap.length]);

  const visibleTopicMap = useMemo(() => {
    return topicMap.slice(0, visibleColumnsCount);
  }, [topicMap, visibleColumnsCount]);

  const closeDrawer = () => { setDrawerState({ open: false, problem: null, initialTab: 'overview' }); };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
            <FolderKanban className="text-brand-600 dark:text-brand-400" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-outfit text-slate-900 dark:text-white tracking-tight leading-none">
              Topic Board
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              Visualize your progress across {topicMap.length} unique topics
            </p>
          </div>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
        <div className="gradient-glass glow-card-brand p-4 flex flex-col justify-between h-20 relative overflow-hidden group hover:border-brand-500/30">
          <span className="text-[9px] font-black text-brand-500 dark:text-brand-400 uppercase tracking-widest block flex items-center gap-1">
            <BookOpen size={10} /> Total Topics
          </span>
          <p className="text-xl font-black font-outfit text-slate-800 dark:text-white leading-none mt-0.5">{stats.topicsCount}</p>
          <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">Unique focus areas mapped</p>
        </div>

        <div className="gradient-glass glow-card-easy p-4 flex flex-col justify-between h-20 relative overflow-hidden group hover:border-emerald-500/30">
          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block flex items-center gap-1">
            <CheckCircle size={10} /> Solve Progress
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black font-outfit text-slate-800 dark:text-white leading-none">{stats.solved}</span>
            <span className="text-[10px] font-semibold text-slate-500">/ {stats.total}</span>
          </div>
          <div className="h-1 w-full bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden mt-1.5">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.total > 0 ? (stats.solved / stats.total) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="gradient-glass glow-card-amber p-4 flex flex-col justify-between h-20 relative overflow-hidden group hover:border-amber-500/30">
          <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest block flex items-center gap-1">
            <Award size={10} /> Popular Topic
          </span>
          <p className="text-[13px] font-bold text-slate-800 dark:text-white truncate mt-0.5 leading-tight" title={stats.activeTopic}>
            {stats.activeTopic}
          </p>
          <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">{stats.activeCount} problems active</p>
        </div>

        <div className="gradient-glass glow-card-rose p-4 flex flex-col justify-between h-20 relative overflow-hidden group hover:border-rose-500/30">
          <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest block flex items-center gap-1">
            <BarChart3 size={10} /> Difficulty Ratio
          </span>
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-700 dark:text-slate-300 mt-0.5">
            <span className="text-emerald-500">{stats.easy}E</span>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <span className="text-amber-500">{stats.medium}M</span>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <span className="text-rose-500">{stats.hard}H</span>
          </div>
          <div className="h-1 w-full bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden mt-1.5 flex">
            <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${stats.total > 0 ? (stats.easy / stats.total) * 100 : 0}%` }} />
            <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${stats.total > 0 ? (stats.medium / stats.total) * 100 : 0}%` }} />
            <div className="bg-rose-500 h-full transition-all duration-300" style={{ width: `${stats.total > 0 ? (stats.hard / stats.total) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 gradient-glass p-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-500" size={16} />
          <input
            type="text"
            placeholder="Search problems, patterns, topics..."
            className="input-field pl-10 py-1.5"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Pill Segmented Controls */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Difficulty</span>
            <div className="flex bg-slate-100 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/[0.06] p-1 rounded-xl gap-0.5">
              {['', 'Easy', 'Medium', 'Hard'].map((d) => (
                <button
                  key={d}
                  onClick={() => setDiffFilter(d)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 ${
                    diffFilter === d
                      ? 'bg-white dark:bg-[#131b2c] text-brand-500 dark:text-brand-400 shadow-sm border border-slate-200/10 dark:border-white/[0.04]'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {d || 'All'}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</span>
            <div className="flex bg-slate-100 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/[0.06] p-1 rounded-xl gap-0.5">
              {['', 'Not Started', 'Solved', 'Needs Revision', 'Revised'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 ${
                    statusFilter === s
                      ? 'bg-white dark:bg-[#131b2c] text-brand-500 dark:text-brand-400 shadow-sm border border-slate-200/10 dark:border-white/[0.04]'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {s || 'All'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {problemsLoading ? (
        <BoardSkeleton />
      ) : topicMap.length === 0 ? (
        <EmptyState icon="book" title="No problems found" subtitle="Try loosening your search or difficulty filters." />
      ) : (
        <div className="kanban-board flex-1 min-h-0">
          {visibleTopicMap.map(([topic, ps]) => (
            <TopicColumn 
              key={topic}
              topic={topic}
              ps={ps}
              setDrawerState={setDrawerState}
            />
          ))}
          {/* Horizontal Sentinel */}
          <div 
            ref={horizontalSentinelRef} 
            className="shrink-0 w-8 flex items-center justify-center min-h-[150px]"
          >
            {visibleColumnsCount < topicMap.length && (
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
            )}
          </div>
        </div>
      )}

      <ProblemDrawer
        open={drawerState.open}
        onClose={closeDrawer}
        problem={drawerState.problem}
        initialTab={drawerState.initialTab}
      />
    </div>
  );
}

function TopicColumn({ topic, ps, setDrawerState }) {
  const [visibleCount, setVisibleCount] = useState(6);
  const sentinelRef = useRef(null);

  useEffect(() => {
    setVisibleCount(6);
  }, [ps]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount(prev => Math.min(ps.length, prev + 6));
      }
    }, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    });

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [ps]);

  const visibleProblems = useMemo(() => {
    return ps.slice(0, visibleCount);
  }, [ps, visibleCount]);

  const solvedCount = useMemo(() => {
    return ps.filter(p => p.status === 'Solved' || p.status === 'Revised').length;
  }, [ps]);

  const progressPercent = ps.length > 0 ? (solvedCount / ps.length) * 100 : 0;

  return (
    <div className="flex flex-col gap-4 min-w-[310px] w-[310px] bg-slate-100/50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/[0.04] rounded-3xl p-4 shrink-0 snap-center h-[calc(100vh-210px)] relative overflow-hidden transition-all duration-300 hover:border-slate-300 dark:hover:border-white/[0.08] hover:bg-slate-200/20 dark:hover:bg-white/[0.015]">
      {/* Column header */}
      <div className="flex flex-col gap-2 pb-2 mb-1 select-none shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-inner bg-gradient-to-br ${
              topic.toLowerCase().includes('tree') ? 'from-blue-500/10 to-indigo-500/5' :
              topic.toLowerCase().includes('graph') ? 'from-indigo-500/10 to-purple-500/5' :
              topic.toLowerCase().includes('string') ? 'from-pink-500/10 to-rose-500/5' :
              (topic.toLowerCase().includes('array') || topic.toLowerCase().includes('list') || topic.toLowerCase().includes('matrix')) ? 'from-emerald-500/10 to-teal-500/5' :
              (topic.toLowerCase().includes('dp') || topic.toLowerCase().includes('dynamic') || topic.toLowerCase().includes('greedy') || topic.toLowerCase().includes('backtrack')) ? 'from-amber-500/10 to-orange-500/5' :
              (topic.toLowerCase().includes('search') || topic.toLowerCase().includes('sort')) ? 'from-cyan-500/10 to-sky-500/5' :
              (topic.toLowerCase().includes('math') || topic.toLowerCase().includes('bit') || topic.toLowerCase().includes('number')) ? 'from-purple-500/10 to-violet-500/5' :
              'from-rose-500/10 to-red-500/5'
            }`}>
              {getTopicIcon(topic)}
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 truncate">{topic}</span>
          </div>
          <span className="text-[10px] bg-brand-500/10 text-brand-500 dark:text-brand-400 font-extrabold px-2 py-0.5 rounded-full select-none whitespace-nowrap">
            {solvedCount}/{ps.length} Solved
          </span>
        </div>
        
        {/* Column completion progress bar */}
        <div className="h-1 w-full bg-slate-200/50 dark:bg-white/[0.04] rounded-full overflow-hidden">
          <div 
            className="h-full bg-brand-500 dark:bg-brand-400 rounded-full transition-all duration-500" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Cards Scroll Container */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-0.5 min-h-0">
        {visibleProblems.map(p => (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            onClick={() => setDrawerState({ open: true, problem: p, initialTab: 'overview' })}
            className={`w-full text-left bg-white/70 dark:bg-[#090e1a]/70 backdrop-blur-xl border border-slate-200/50 dark:border-white/[0.06] rounded-2xl p-4 transition-all duration-300 cursor-pointer group hover:-translate-y-0.5 overflow-visible
              ${p.difficulty === 'Easy' ? 'hover:border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.06)]' : 
                p.difficulty === 'Medium' ? 'hover:border-amber-500/30 hover:shadow-[0_0_15px_rgba(245,158,11,0.06)]' : 
                'hover:border-rose-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.06)]'}`}
          >
            <div className="relative pr-6 mb-2">
              <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100 line-clamp-2 tracking-tight group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors">{p.name}</p>
              <div className="absolute -right-2 -top-1.5 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {p.approach && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDrawerState({ open: true, problem: p, initialTab: 'approach' }); }}
                    className="p-1 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-md transition-colors"
                    title="View Approach & Intuition"
                  >
                    <Lightbulb size={12} />
                  </button>
                )}
                {p.solutionCode && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDrawerState({ open: true, problem: p, initialTab: 'code' }); }}
                    className="p-1 text-slate-400 hover:text-[#569cd6] hover:bg-[#569cd6]/10 rounded-md transition-colors"
                    title="View Code Solution"
                  >
                    <Code2 size={12} />
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              <DifficultyBadge difficulty={p.difficulty} />
              <StatusBadge status={p.status} />
            </div>
            {p.patterns?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {p.patterns.slice(0, 2).map(pt => <PatternChip key={pt} label={pt} small />)}
              </div>
            )}
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-200/50 dark:border-white/[0.04] text-[10px] text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1 font-mono font-medium"><Clock4 size={10} />{p.timeComplexity || 'O(?)'}</span>
              <span className="font-black uppercase tracking-widest">{p.platform}</span>
            </div>
          </div>
        ))}

        {/* Sentinel */}
        <div ref={sentinelRef} className="h-6 flex items-center justify-center">
          {visibleCount < ps.length && (
            <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping" />
          )}
        </div>
      </div>
    </div>
  );
}
