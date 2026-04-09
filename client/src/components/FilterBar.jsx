import { Search, Filter, SlidersHorizontal, Sun, Calendar } from 'lucide-react';
import { useStore } from '../store/StoreContext.jsx';
import { DIFFICULTIES, STATUSES, TOPICS, PATTERNS } from '../store/data.js';
import { useMemo } from 'react';

export default function FilterBar({ searchQuery, setSearchQuery }) {
  const { filters, setFilter, togglePOTD, setDateRange, problems } = useStore();

  // Dynamically extract custom topics from user's problems
  const dynamicTopics = useMemo(() => {
    const custom = new Set();
    problems?.forEach(p => p.topics?.forEach(t => custom.add(t)));
    return Array.from(new Set([...TOPICS, ...custom])).sort();
  }, [problems]);

  const dynamicPatterns = useMemo(() => {
    const custom = new Set();
    problems?.forEach(p => p.patterns?.forEach(pt => custom.add(pt)));
    return Array.from(new Set([...PATTERNS, ...custom])).sort();
  }, [problems]);

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Search & Top Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-500" size={18} />
          <input
            type="text"
            placeholder="Search problems by name or ID..."
            className="input-field pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {/* POTD Toggle */}
          <button
            onClick={() => togglePOTD(!filters.potd)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-150
              ${filters.potd 
                ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400' 
                : 'bg-white dark:bg-[#0b101a] border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.02]'}`}
          >
            <Sun size={16} className={filters.potd ? "fill-current" : ""} />
            POTD
          </button>

          {/* Expand Filters */}
          <button
            onClick={() => setFilter('showPanel', !filters.showPanel)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-150
              ${filters.showPanel 
                ? 'bg-brand-50 dark:bg-brand-500/10 border-brand-200 dark:border-brand-500/20 text-brand-700 dark:text-brand-400' 
                : 'bg-white dark:bg-[#0b101a] border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.02]'}`}
          >
            <SlidersHorizontal size={16} />
            Filters
            {(filters.difficulty !== 'All' || filters.status !== 'All' || filters.topic !== 'All' || filters.pattern !== 'All' || filters.dateRange.start) && (
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Filter Panel */}
      {filters.showPanel && (
        <div className="glass-card p-4 animate-slide-down">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <FilterSection title="Difficulty" options={['All', ...DIFFICULTIES]} current={filters.difficulty} onChange={(v) => setFilter('difficulty', v)} />
            <FilterSection title="Status" options={['All', ...STATUSES]} current={filters.status} onChange={(v) => setFilter('status', v)} />
            
            <div className="space-y-2">
              <span className="label">Topic</span>
              <select 
                className="input-field py-1.5"
                value={filters.topic}
                onChange={(e) => setFilter('topic', e.target.value)}
              >
                <option value="All">All Topics</option>
                {dynamicTopics.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <span className="label">Pattern</span>
              <select 
                className="input-field py-1.5"
                value={filters.pattern}
                onChange={(e) => setFilter('pattern', e.target.value)}
              >
                <option value="All">All Patterns</option>
                {dynamicPatterns.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Quick Date Filters - Footer of panel */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/[0.06] flex flex-wrap items-center gap-4 overflow-x-auto no-scrollbar pb-1">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 shrink-0 uppercase tracking-widest"><Calendar size={14}/> Date Range</span>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setDateRange(null, null)} className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-colors ${!filters.dateRange.start ? 'chip-active' : 'chip-inactive'}`}>Any Time</button>
              <button 
                onClick={() => { 
                  const d = new Date(); 
                  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
                  setDateRange(start.toISOString(), end.toISOString()); 
                }} 
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-colors ${filters.dateRange.start && new Date(filters.dateRange.start).toDateString() === new Date().toDateString() ? 'chip-active' : 'chip-inactive'}`}
              >
                Today
              </button>
            </div>
            
            <div className="flex items-center gap-2 shrink-0 border-l border-slate-200 dark:border-white/[0.06] pl-4">
              <input 
                type="date" 
                className="input-field py-1 px-2 text-xs w-[120px]"
                value={filters.dateRange.start ? new Date(filters.dateRange.start).toISOString().split('T')[0] : ''}
                onChange={e => {
                  if (!e.target.value) {
                    setDateRange(null, filters.dateRange.end);
                  } else {
                    const start = new Date(e.target.value);
                    setDateRange(start.toISOString(), filters.dateRange.end);
                  }
                }}
              />
              <span className="text-slate-400 text-xs">to</span>
              <input 
                type="date" 
                className="input-field py-1 px-2 text-xs w-[120px]"
                value={filters.dateRange.end ? new Date(filters.dateRange.end).toISOString().split('T')[0] : ''}
                onChange={e => {
                  if (!e.target.value) {
                    setDateRange(filters.dateRange.start, null);
                  } else {
                    const d = new Date(e.target.value);
                    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
                    setDateRange(filters.dateRange.start, end.toISOString());
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSection({ title, options, current, onChange }) {
  return (
    <div className="space-y-2">
      <span className="label">{title}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-colors ${
              current === opt ? 'chip-active' : 'chip-inactive'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export const EMPTY_FILTERS = {
  difficulty: 'All', status: 'All', topic: 'All', pattern: 'All',
  potd: false, dateRange: { start: null, end: null },
  sortBy: 'dateSolved', sortDesc: true, showPanel: false
};

export function applyFilters(problems, filters, searchQuery = '') {
  return problems.filter(p => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesName = p.name ? p.name.toLowerCase().includes(q) : false;
      const matchesId = p.id ? p.id.toLowerCase().includes(q) : false;
      if (!matchesName && !matchesId) return false;
    }
    if (filters.difficulty !== 'All' && p.difficulty !== filters.difficulty) return false;
    if (filters.status !== 'All' && p.status !== filters.status) return false;
    if (filters.topic !== 'All' && (!p.topics || !p.topics.includes(filters.topic))) return false;
    if (filters.pattern !== 'All' && (!p.patterns || !p.patterns.includes(filters.pattern))) return false;
    if (filters.potd && !p.isPOTD) return false;
    if (filters.dateRange?.start || filters.dateRange?.end) {
      if (!p.dateSolved) return false;
      const pDate = new Date(p.dateSolved);
      
      if (filters.dateRange.start) {
        const sDate = new Date(filters.dateRange.start);
        if (pDate < sDate) return false;
      }
      
      if (filters.dateRange.end) {
        const eDate = new Date(filters.dateRange.end);
        if (pDate > eDate) return false;
      }
    }
    return true;
  }).sort((a, b) => {
    let valA = a[filters.sortBy];
    let valB = b[filters.sortBy];
    if (valA < valB) return filters.sortDesc ? 1 : -1;
    if (valA > valB) return filters.sortDesc ? -1 : 1;
    return 0;
  });
}
