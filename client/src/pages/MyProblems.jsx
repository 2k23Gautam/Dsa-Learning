import { useState, useMemo } from 'react';
import { Plus, User } from 'lucide-react';
import { useStore } from '../store/StoreContext.jsx';
import { useAuth } from '../store/AuthContext.jsx';
import ProblemTable from '../components/ProblemTable.jsx';
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
      {[...Array(5)].map((_, i) => (
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

export default function MyProblems() {
  const { problems, problemsLoading } = useStore();
  const { authUser } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const mine = problems;
  const visible = useMemo(() => {
    return [...mine].sort((a, b) => new Date(b.dateSolved || b.createdAt || 0) - new Date(a.dateSolved || a.createdAt || 0));
  }, [mine]);

  const stats = useMemo(() => {
    let easy = 0, medium = 0, hard = 0;
    visible.forEach(p => {
      if (p.difficulty === 'Easy') easy++;
      else if (p.difficulty === 'Medium') medium++;
      else if (p.difficulty === 'Hard') hard++;
    });
    const total = visible.length;
    return { total, easy, medium, hard };
  }, [visible]);

  const openAdd  = () => { setDrawerOpen(true); };
  const closeDrawer = () => { setDrawerOpen(false); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 dark:bg-brand-500/15 flex items-center justify-center">
            <User className="text-brand-500" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              My Problems
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-600 mt-0.5">
              {authUser ? `Showing for "${authUser.name}"` : 'Please log in to see your problems'}
            </p>
          </div>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Problem</button>
      </div>

      {!authUser ? (
        <EmptyState icon="search" title="Who are you?"
          subtitle="Please log in to see your tracked problems." />
      ) : (
        <>
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0 mb-2">
            <div className="gradient-glass glow-card-brand p-4 flex flex-col justify-between h-20 relative overflow-hidden group hover:border-brand-500/30">
              <span className="text-[9px] font-black text-brand-500 dark:text-brand-400 uppercase tracking-widest block">Filtered</span>
              <p className="text-xl font-black font-outfit text-slate-800 dark:text-white leading-none mt-0.5">{stats.total}</p>
              <div className="h-1 w-full bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden mt-1.5">
                <div className="h-full bg-brand-500 rounded-full" style={{ width: `${mine.length > 0 ? (stats.total / mine.length) * 100 : 0}%` }} />
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

          
          <div className="gradient-glass overflow-hidden flex flex-col mt-2">
            {problemsLoading ? (
              <TableSkeleton />
            ) : (
              <ProblemTable problems={visible} />
            )}
          </div>
        </>
      )}

      <ProblemDrawer open={drawerOpen} onClose={closeDrawer} />
    </div>
  );
}
