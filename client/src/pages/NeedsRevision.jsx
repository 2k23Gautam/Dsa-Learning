import { useState, useMemo } from 'react';
import { RotateCcw, CalendarPlus, AlertTriangle, Pencil, Lightbulb, Code2, Calendar, BookOpen, CheckCircle, Clock4, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '../store/StoreContext.jsx';
import { applyFilters } from '../components/FilterBar.jsx';
import ProblemTable from '../components/ProblemTable.jsx';
import ProblemDrawer from '../components/ProblemDrawer.jsx';
import EmptyState from '../components/EmptyState.jsx';
import FilterBar from '../components/FilterBar.jsx';
import RevisionDateModal from '../components/RevisionDateModal.jsx';

const getRelativeDateString = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const day = parseInt(parts[2], 10);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const target = new Date(year, month, day);
  target.setHours(0, 0, 0, 0);
  
  const diffTime = target - today;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    const days = Math.abs(diffDays);
    return `Overdue by ${days} day${days !== 1 ? 's' : ''} 🚨`;
  }
  if (diffDays === 0) return 'Today 📅';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return `In ${diffDays} days`;
  
  return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

function RevisionSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="gradient-glass p-4 h-20 relative overflow-hidden" />
        ))}
      </div>
      <div className="h-10 bg-slate-200 dark:bg-white/[0.04] rounded-xl w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="gradient-glass p-5 h-[190px] border border-slate-200/50 dark:border-white/[0.06] border-l-4 border-l-slate-200 dark:border-l-white/[0.08]" />
        ))}
      </div>
    </div>
  );
}

export default function NeedsRevision() {
  const { problems, updateProblem, filters, problemsLoading } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerProblem, setDrawerProblem] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [activeProblem, setActiveProblem] = useState(null);

  const revisionProblems = useMemo(() => {
    return problems.filter(p => p.status === 'Needs Revision');
  }, [problems]);

  const visible = useMemo(() => {
    return applyFilters(revisionProblems, filters, searchQuery);
  }, [revisionProblems, filters, searchQuery]);

  // Compute revision stats
  const stats = useMemo(() => {
    let pending = 0;
    let overdue = 0;
    let totalAttempts = 0;
    let easy = 0, medium = 0, hard = 0;
    
    const todayStr = new Date().toISOString().slice(0, 10);
    
    revisionProblems.forEach(p => {
      pending++;
      totalAttempts += (p.revisionCount || 0);
      
      if (p.difficulty === 'Easy') easy++;
      else if (p.difficulty === 'Medium') medium++;
      else if (p.difficulty === 'Hard') hard++;
      
      if (p.revisionDate && p.revisionDate < todayStr) {
        overdue++;
      }
    });
    
    const avgAttempts = pending > 0 ? (totalAttempts / pending).toFixed(1) : '0';
    
    return {
      pending,
      overdue,
      avgAttempts,
      easy,
      medium,
      hard
    };
  }, [revisionProblems]);

  const openEdit = (p) => { setDrawerProblem(p); setDrawerOpen(true); };
  const closeDrawer = () => { setDrawerOpen(false); setDrawerProblem(null); };

  const openDateModal = (p) => { setActiveProblem(p); setDateModalOpen(true); };
  const closeDateModal = () => { setDateModalOpen(false); setActiveProblem(null); };

  const handleSaveDate = (date) => {
    if (activeProblem) {
      updateProblem(activeProblem.id, { revisionDate: date });
      toast.success('Revision date updated!');
    }
  };

  const markRevised = (p) => {
    updateProblem(p.id, { status: 'Revised', revisionCount: (p.revisionCount || 0) + 1 });
    toast.success(`"${p.name}" marked as Revised`);
  };

  const setNextRevision = (p) => {
    openDateModal(p);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 flex items-center justify-center">
          <AlertTriangle className="text-amber-500" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Needs Revision
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-600 mt-0.5">
            {revisionProblems.length} problem{revisionProblems.length !== 1 ? 's' : ''} waiting for revision
          </p>
        </div>
      </div>

      {problemsLoading ? (
        <RevisionSkeleton />
      ) : revisionProblems.length === 0 ? (
        <EmptyState icon="book"
          title="Nothing needs revision! 🎉"
          subtitle="Mark problems as 'Needs Revision' from the All Problems view." />
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
            <div className="gradient-glass glow-card-brand p-4 flex flex-col justify-between h-20 relative overflow-hidden group hover:border-brand-500/30">
              <span className="text-[9px] font-black text-brand-500 dark:text-brand-400 uppercase tracking-widest block flex items-center gap-1">
                <BookOpen size={10} /> Pending
              </span>
              <p className="text-xl font-black font-outfit text-slate-800 dark:text-white leading-none mt-0.5">{stats.pending}</p>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">Revisions active</p>
            </div>

            <div className="gradient-glass glow-card-rose p-4 flex flex-col justify-between h-20 relative overflow-hidden group hover:border-rose-500/30">
              <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest block flex items-center gap-1">
                <AlertTriangle size={10} /> Overdue
              </span>
              <p className={`text-xl font-black font-outfit leading-none mt-0.5 ${stats.overdue > 0 ? 'text-rose-500' : 'text-slate-800 dark:text-white'}`}>{stats.overdue}</p>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">Schedule has passed</p>
            </div>

            <div className="gradient-glass glow-card-amber p-4 flex flex-col justify-between h-20 relative overflow-hidden group hover:border-amber-500/30">
              <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest block flex items-center gap-1">
                <CheckCircle size={10} /> Avg. Passes
              </span>
              <p className="text-xl font-black font-outfit text-slate-800 dark:text-white leading-none mt-0.5">{stats.avgAttempts}</p>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">Attempts per problem</p>
            </div>

            <div className="gradient-glass glow-card-easy p-4 flex flex-col justify-between h-20 relative overflow-hidden group hover:border-emerald-500/30">
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block flex items-center gap-1">
                <BarChart3 size={10} /> Difficulty Split
              </span>
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-700 dark:text-slate-300 mt-0.5">
                <span className="text-emerald-500">{stats.easy}E</span>
                <span className="text-slate-400 dark:text-slate-600">•</span>
                <span className="text-amber-500">{stats.medium}M</span>
                <span className="text-slate-400 dark:text-slate-600">•</span>
                <span className="text-rose-500">{stats.hard}H</span>
              </div>
              <div className="h-1 w-full bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden mt-1.5 flex">
                <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${stats.pending > 0 ? (stats.easy / stats.pending) * 100 : 0}%` }} />
                <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${stats.pending > 0 ? (stats.medium / stats.pending) * 100 : 0}%` }} />
                <div className="bg-rose-500 h-full transition-all duration-300" style={{ width: `${stats.pending > 0 ? (stats.hard / stats.pending) * 100 : 0}%` }} />
              </div>
            </div>
          </div>

          <FilterBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

          {/* Quick-action cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {visible.map(p => (
              <div key={p.id}
                className={`gradient-glass p-5 flex flex-col justify-between hover:shadow-[0_0_20px_rgba(245,158,11,0.06)] border border-slate-200/50 dark:border-white/[0.06] border-l-4 transition-all duration-300 relative group min-h-[190px]
                  ${p.difficulty === 'Easy' ? 'border-l-emerald-500 hover:border-emerald-500/30' : 
                    p.difficulty === 'Medium' ? 'border-l-amber-500 hover:border-amber-500/30' : 
                    'border-l-rose-500 hover:border-rose-500/30'}`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm line-clamp-2 tracking-tight">{p.name}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase mt-0.5 tracking-wider">{p.platform}</p>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-brand-500/10 text-brand-500 dark:text-brand-400 px-2.5 py-0.5 rounded-full select-none whitespace-nowrap">
                      Pass #{p.revisionCount || 0}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {p.approach && (
                      <div className="flex items-center gap-1 text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">
                        <Lightbulb size={10} /> Approach Logged
                      </div>
                    )}
                    {p.solutionCode && (
                      <div className="flex items-center gap-1 text-[9px] font-bold text-[#569cd6] bg-[#569cd6]/10 px-2 py-0.5 rounded-md">
                        <Code2 size={10} /> Code Saved
                      </div>
                    )}
                  </div>

                  {p.revisionDate && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100/50 dark:bg-white/[0.02] px-2.5 py-1.5 rounded-xl border border-slate-200/20 dark:border-white/[0.04] w-fit select-none">
                      <Calendar size={12} className="text-slate-400" />
                      <span>Next: <strong className={`font-semibold ${p.revisionDate < new Date().toISOString().slice(0, 10) ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>{getRelativeDateString(p.revisionDate)}</strong></span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-3 mt-4 border-t border-slate-200/40 dark:border-white/[0.04]">
                  <button onClick={() => markRevised(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white text-xs font-bold py-2 rounded-xl transition-all duration-200 hover:shadow-[0_0_12px_rgba(16,185,129,0.25)] select-none active:scale-[0.98]"
                  >
                    <RotateCcw size={12} /> Mark Revised
                  </button>
                  <button onClick={() => setNextRevision(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-brand-500/10 hover:bg-brand-500 text-brand-500 hover:text-white text-xs font-bold py-2 rounded-xl transition-all duration-200 hover:shadow-[0_0_12px_rgba(51,140,255,0.25)] select-none active:scale-[0.98]"
                  >
                    <CalendarPlus size={12} /> Set Date
                  </button>
                  <button onClick={() => openEdit(p)}
                    className="px-3 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs py-2 rounded-xl transition-all duration-200 active:scale-[0.98]"
                    title="Edit details"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 gradient-glass p-5 border border-slate-200/50 dark:border-white/[0.06]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-4 bg-brand-500 rounded-full" />
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Table View</h2>
            </div>
            <div className="overflow-x-auto no-scrollbar rounded-xl">
              <ProblemTable problems={visible} />
            </div>
          </div>
        </>
      )}

      <ProblemDrawer open={drawerOpen} onClose={closeDrawer} problem={drawerProblem} initialTab="edit" />
      <RevisionDateModal 
        open={dateModalOpen} 
        onClose={closeDateModal} 
        onSave={handleSaveDate} 
        currentProblem={activeProblem} 
      />
    </div>
  );
}
