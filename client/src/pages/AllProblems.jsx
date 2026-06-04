import { useState, useMemo } from 'react';
import { Plus, List } from 'lucide-react';
import { useStore } from '../store/StoreContext.jsx';
import ProblemTable from '../components/ProblemTable.jsx';
import FilterBar from '../components/FilterBar.jsx';
import ProblemDrawer from '../components/ProblemDrawer.jsx';
import EmptyState from '../components/EmptyState.jsx';

function TableSkeleton() {
  return (
    <div className="w-full space-y-4 p-5 animate-pulse">
      <div className="flex gap-4 border-b border-slate-200 dark:border-white/[0.06] pb-3">
        <div className="h-4 bg-slate-200 dark:bg-white/[0.04] rounded w-1/4" />
        <div className="h-4 bg-slate-200 dark:bg-white/[0.04] rounded w-1/12" />
        <div className="h-4 bg-slate-200 dark:bg-white/[0.04] rounded w-1/6" />
        <div className="h-4 bg-slate-200 dark:bg-white/[0.04] rounded w-1/6" />
        <div className="h-4 bg-slate-200 dark:bg-white/[0.04] rounded w-1/12" />
      </div>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex gap-4 items-center py-2 border-b border-slate-100 dark:border-white/[0.02]">
          <div className="h-5 bg-slate-200 dark:bg-white/[0.04] rounded w-1/4" />
          <div className="h-5 bg-slate-200 dark:bg-white/[0.04] rounded-full w-12" />
          <div className="h-5 bg-slate-200 dark:bg-white/[0.04] rounded-full w-16" />
          <div className="h-5 bg-slate-200 dark:bg-white/[0.04] rounded w-1/6" />
          <div className="h-4 bg-slate-200 dark:bg-white/[0.04] rounded w-20 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export default function AllProblems() {
  const { problems, filters, problemsLoading } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredProblems = useMemo(() => {
    return problems.filter(p => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesId = (p.id || p._id || '').toString().toLowerCase().includes(q);
        if (!matchesName && !matchesId) return false;
      }
      
      // Selects
      if (filters.difficulty !== 'All' && p.difficulty !== filters.difficulty) return false;
      if (filters.status !== 'All' && p.status !== filters.status) return false;
      if (filters.topic !== 'All' && (!p.topics || !p.topics.includes(filters.topic))) return false;
      if (filters.pattern !== 'All' && (!p.patterns || !p.patterns.includes(filters.pattern))) return false;
      
      // Toggles
      if (filters.potd && !p.isPOTD) return false;
      
      // Date constraints
      if (filters.dateRange.start) {
        const pDate = new Date(p.dateSolved);
        const sDate = new Date(filters.dateRange.start);
        if (pDate < sDate) return false;
      }
      if (filters.dateRange.end) {
        const pDate = new Date(p.dateSolved);
        const eDate = new Date(filters.dateRange.end);
        if (pDate > eDate) return false;
      }
      return true;
    }).sort((a, b) => {
      const valA = a[filters.sortBy];
      const valB = b[filters.sortBy];
      
      if (valA < valB) return filters.sortDesc ? 1 : -1;
      if (valA > valB) return filters.sortDesc ? -1 : 1;
      return 0;
    });
  }, [problems, searchQuery, filters]);

  const stats = useMemo(() => {
    let easy = 0, medium = 0, hard = 0;
    filteredProblems.forEach(p => {
      if (p.difficulty === 'Easy') easy++;
      else if (p.difficulty === 'Medium') medium++;
      else if (p.difficulty === 'Hard') hard++;
    });
    const total = filteredProblems.length;
    return { total, easy, medium, hard };
  }, [filteredProblems]);

  const openNew = () => { setDrawerOpen(true); };
  const closeDrawer = () => { setDrawerOpen(false); };

  return (
    <div className="flex flex-col h-full space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
            <List className="text-brand-600 dark:text-brand-400" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-outfit text-slate-900 dark:text-white tracking-tight leading-none">All Problems</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{filteredProblems.length} of {problems.length} shown</p>
          </div>
        </div>
        <button onClick={openNew} className="btn-primary shrink-0 self-start sm:self-auto">
          <Plus size={18} /> Add Problem
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
        <div className="gradient-glass glow-card-brand p-4 flex flex-col justify-between h-20 relative overflow-hidden group hover:border-brand-500/30">
          <span className="text-[9px] font-black text-brand-500 dark:text-brand-400 uppercase tracking-widest block">Filtered</span>
          <p className="text-xl font-black font-outfit text-slate-800 dark:text-white leading-none mt-0.5">{stats.total}</p>
          <div className="h-1 w-full bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden mt-1.5">
            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${problems.length > 0 ? (stats.total / problems.length) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="gradient-glass glow-card-easy p-4 flex flex-col justify-between h-20 relative overflow-hidden group hover:border-emerald-500/30">
          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block">Easy</span>
          <p className="text-xl font-black font-outfit text-slate-800 dark:text-white leading-none mt-0.5">{stats.easy}</p>
          <div className="h-1 w-full bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden mt-1.5">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.total > 0 ? (stats.easy / stats.total) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="gradient-glass glow-card-amber p-4 flex flex-col justify-between h-20 relative overflow-hidden group hover:border-amber-500/30">
          <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest block">Medium</span>
          <p className="text-xl font-black font-outfit text-slate-800 dark:text-white leading-none mt-0.5">{stats.medium}</p>
          <div className="h-1 w-full bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden mt-1.5">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${stats.total > 0 ? (stats.medium / stats.total) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="gradient-glass glow-card-rose p-4 flex flex-col justify-between h-20 relative overflow-hidden group hover:border-rose-500/30">
          <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest block">Hard</span>
          <p className="text-xl font-black font-outfit text-slate-800 dark:text-white leading-none mt-0.5">{stats.hard}</p>
          <div className="h-1 w-full bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden mt-1.5">
            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${stats.total > 0 ? (stats.hard / stats.total) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      <FilterBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Main Content Area */}
      <div className="flex-1 gradient-glass overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto w-full no-scrollbar relative min-h-[400px]">
          {problemsLoading ? (
            <TableSkeleton />
          ) : filteredProblems.length > 0 ? (
            <ProblemTable problems={filteredProblems} />
          ) : (
            <div className="absolute inset-0 flex">
              <EmptyState 
                title={problems.length === 0 ? "No problems tracked yet" : "No matches found"} 
                subtitle={problems.length === 0 ? "Click 'Add Problem' to log your first DSA challenge." : "Try adjusting your search or filter criteria."}
                icon="list"
              />
            </div>
          )}
        </div>
      </div>

      <ProblemDrawer open={drawerOpen} onClose={closeDrawer} />
    </div>
  );
}
