import { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowUpDown, Maximize2, Edit2, CheckCircle2, Star, Lightbulb, Code2 } from 'lucide-react';
import { useStore } from '../store/StoreContext.jsx';
import { DifficultyBadge, PlatformBadge, TopicBadge, PatternBadge } from './Badges.jsx';
import ProblemDrawer from './ProblemDrawer.jsx';

export default function ProblemTable({ problems }) {
  const { filters, setFilter, togglePOTD } = useStore();
  const [drawerState, setDrawerState] = useState({ open: false, problem: null, initialTab: 'overview' });
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(25);
  const sentinelRef = useRef(null);

  useEffect(() => {
    setVisibleCount(25);
  }, [problems]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount(prev => Math.min(problems.length, prev + 25));
      }
    }, {
      root: null,
      rootMargin: '150px',
      threshold: 0.1
    });

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [problems]);

  const visibleProblems = useMemo(() => {
    return problems.slice(0, visibleCount);
  }, [problems, visibleCount]);

  const handleSort = (key) => {
    if (filters.sortBy === key) {
      setFilter('sortDesc', !filters.sortDesc);
    } else {
      setFilter('sortBy', key);
      setFilter('sortDesc', false);
    }
  };

  const SortIcon = ({ sortKey }) => (
    <ArrowUpDown size={12} className={`inline ml-1 transition-colors ${filters.sortBy === sortKey ? 'text-brand-500' : 'text-slate-300 dark:text-slate-600'}`} />
  );

  if (problems.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto no-scrollbar pb-2">
      <table className="w-full text-left min-w-[900px]">
        <thead className="sticky top-0 z-30">
          <tr className="border-b border-slate-200 dark:border-white/[0.08] bg-white/90 dark:bg-slate-950/90 backdrop-blur-md shadow-sm">
            <th className="table-th w-10"></th>
            <th className="table-th" onClick={() => handleSort('name')}>Problem <SortIcon sortKey="name"/></th>
            <th className="table-th" onClick={() => handleSort('platform')}>Platform <SortIcon sortKey="platform"/></th>
            <th className="table-th" onClick={() => handleSort('difficulty')}>Difficulty <SortIcon sortKey="difficulty"/></th>
            <th className="table-th hidden md:table-cell">Topics</th>
            <th className="table-th" onClick={() => handleSort('status')}>Status <SortIcon sortKey="status"/></th>
            <th className="table-th text-center" onClick={() => handleSort('dateSolved')}>Solved <SortIcon sortKey="dateSolved"/></th>
            <th className="table-th hidden lg:table-cell" onClick={() => handleSort('timeComplexity')}>Time (Min) <SortIcon sortKey="timeComplexity"/></th>
            <th className="table-th hidden sm:table-cell" onClick={() => handleSort('revisionCount')}>Rev# <SortIcon sortKey="revisionCount"/></th>
            <th className="table-th text-center">POTD</th>
            <th className="table-th w-24 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {visibleProblems.map((p) => (
            <tr 
              key={p.id} 
              className="table-row group cursor-pointer"
              onMouseEnter={() => setHoveredRowId(p.id)}
              onMouseLeave={() => setHoveredRowId(null)}
              onClick={() => setDrawerState({ open: true, problem: p, initialTab: 'overview' })}
            >
              <td className="table-td pl-4">
                {p.status === 'Solved' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />}
              </td>
              <td className="table-td font-medium text-slate-900 dark:text-slate-100 max-w-[200px] relative group/name">
                <div className="flex items-center gap-2">
                  {p.link ? (
                    <a href={p.link} target="_blank" rel="noreferrer" className="hover:text-brand-600 dark:hover:text-brand-400 hover:underline underline-offset-2 flex items-center gap-1.5 transition-colors truncate w-full">
                      <span className="truncate">{p.name}</span>
                      <Maximize2 size={12} className="opacity-0 group-hover/name:opacity-100 transition-opacity shrink-0" />
                    </a>
                  ) : (
                    <span className="truncate w-full block">{p.name}</span>
                  )}
                  {/* Premium Minimalist Tooltip */}
                  {hoveredRowId === p.id && (
                    <div className="absolute left-0 bottom-full mb-2 z-[999] opacity-100 visible translate-y-0 transition-all duration-200 ease-out pointer-events-none">
                      <div className="bg-[#18181b] dark:bg-[#09090b] text-[#f4f4f5] text-[13px] font-medium py-1.5 px-3 rounded-md shadow-2xl border border-[#27272a] whitespace-nowrap tracking-wide flex items-center">
                        {p.name}
                      </div>
                      {/* Arrow */}
                      <div className="absolute -bottom-1 left-6 w-2.5 h-2.5 bg-[#18181b] dark:bg-[#09090b] border-b border-r border-[#27272a] rotate-45"></div>
                    </div>
                  )}
                  {/* Approach button */}
                  {p.approach && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDrawerState({ open: true, problem: p, initialTab: 'approach' }); }}
                      className="p-1 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded transition-colors shrink-0"
                      title="View Approach & Intuition"
                    >
                      <Lightbulb size={14} />
                    </button>
                  )}
                  {/* Code Solution button */}
                  {p.solutionCode && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDrawerState({ open: true, problem: p, initialTab: 'code' }); }}
                      className="p-1 text-slate-400 hover:text-[#569cd6] hover:bg-[#569cd6]/10 rounded transition-colors shrink-0"
                      title="View Code Solution"
                    >
                      <Code2 size={14} />
                    </button>
                  )}
                </div>
              </td>
              <td className="table-td"><PlatformBadge platform={p.platform} /></td>
              <td className="table-td"><DifficultyBadge difficulty={p.difficulty} /></td>
              <td className="table-td hidden md:table-cell">
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                  {p.topics?.slice(0, 2).map(t => <TopicBadge key={t} topic={t} />)}
                  {p.patterns?.slice(0, 1).map(pt => <PatternBadge key={pt} pattern={pt} />)}
                  {((p.topics?.length || 0) + (p.patterns?.length || 0) > 3) && (
                    <span className="text-[10px] text-slate-500 font-medium px-1">+{(p.topics?.length || 0) + (p.patterns?.length || 0) - 3}</span>
                  )}
                </div>
              </td>
              <td className="table-td">
                <span className={`text-xs font-semibold ${p.status === 'Solved' ? 'text-emerald-600 dark:text-emerald-400' : p.status === 'Attempted' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>
                  {p.status}
                </span>
              </td>
              <td className="table-td text-xs text-slate-500 font-mono tracking-tight">{(p.dateSolved || p.solvedDate || '').substring(0, 10)}</td>
              <td className="table-td hidden lg:table-cell text-xs text-slate-500 font-mono">{p.timeComplexity || '—'}</td>
              <td className="table-td hidden sm:table-cell text-center font-bold text-slate-700 dark:text-slate-200">{p.revisionCount}</td>
              <td className="table-td text-center">
                <button
                  onClick={() => togglePOTD(p.id)}
                  className={`p-1.5 rounded-lg transition-colors ${p.isPOTD ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' : 'text-slate-300 dark:text-slate-600 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-white/[0.04]'}`}
                  title={p.isPOTD ? "Remove from POTD" : "Mark as POTD"}
                >
                  <Star size={16} className={p.isPOTD ? "fill-current" : ""} />
                </button>
              </td>
              <td className="table-td text-right pr-4">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setDrawerState({ open: true, problem: p, initialTab: 'edit' }); }} 
                    className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div ref={sentinelRef} className="py-5 flex items-center justify-center border-t border-slate-200 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.01]">
        <div className="text-xs font-semibold text-slate-500 flex items-center gap-2">
          {visibleCount < problems.length ? (
            <>
              <svg className="w-4 h-4 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
              </svg>
              <span>Showing {visibleCount} of {problems.length} problems (scroll to load more)</span>
            </>
          ) : (
            <span>Showing all {problems.length} problems</span>
          )}
        </div>
      </div>
      <ProblemDrawer
        open={drawerState.open}
        onClose={() => setDrawerState({ open: false, problem: null, initialTab: 'overview' })}
        problem={drawerState.problem}
        initialTab={drawerState.initialTab}
      />
    </div>
  );
}
