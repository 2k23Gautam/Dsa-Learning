import { useMemo, useState } from 'react';
import { useStore } from '../store/StoreContext.jsx';
import { DifficultyBadge, StatusBadge, PatternChip } from '../components/Badges.jsx';
import ProblemModal from '../components/ProblemModal.jsx';
import ProblemViewerModal from '../components/ProblemViewerModal.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { ExternalLink, Clock4, User, FolderKanban, Lightbulb, X, Code2 } from 'lucide-react';

export default function TopicBoard() {
  const { problems } = useStore();
  const [editProblem, setEditProblem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [diffFilter, setDiffFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [approachModal, setApproachModal] = useState({ open: false, problem: null });
  const [viewerModal, setViewerModal] = useState({ open: false, problem: null });

  const filtered = problems.filter(p => {
    if (diffFilter && p.difficulty !== diffFilter) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    return true;
  });

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

  const openEdit = (p) => { setEditProblem(p); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditProblem(null); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 dark:bg-brand-500/15 flex items-center justify-center">
            <FolderKanban className="text-brand-500" size={22} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Topic Board
          </h1>
        </div>
        <div className="flex gap-2">
          <select className="input-field w-auto" value={diffFilter} onChange={e => setDiffFilter(e.target.value)}>
            <option value="">All Difficulties</option>
            {['Easy', 'Medium', 'Hard'].map(d => <option key={d}>{d}</option>)}
          </select>
          <select className="input-field w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            {['Not Started', 'Solved', 'Needs Revision', 'Revised'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {topicMap.length === 0 ? (
        <EmptyState icon="book" title="No problems yet" subtitle="Add problems with topics to see the board." />
      ) : (
        <div className="kanban-board">
          {topicMap.map(([topic, ps]) => (
            <div key={topic} className="kanban-col">
              {/* Column header */}
              <div className="glass-card px-3 py-3 flex items-center justify-between sticky top-0 z-10 relative overflow-hidden">
                {/* Top gradient line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-500 to-neon-cyan opacity-30" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{topic}</span>
                <span className="ml-2 text-[10px] bg-brand-500/10 text-brand-400 font-bold px-2 py-0.5 rounded-full">
                  {ps.length}
                </span>
              </div>

              {/* Cards */}
              {ps.map(p => (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openEdit(p)}
                  className={`w-full text-left gradient-glass p-3.5 hover:border-brand-500/30 transition-all duration-200 cursor-pointer
                    hover:-translate-y-0.5 hover:shadow-neon-sm overflow-visible
                    ${p.status === 'Needs Revision' ? 'border-amber-400/30' : ''}`}
                >
                  <div className="relative pr-6 mb-2">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 uppercase tracking-tight">{p.name}</p>
                    <div className="absolute -right-1 -top-1 flex flex-col gap-0.5">
                      {p.approach && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setApproachModal({ open: true, problem: p }); }}
                          className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-md transition-colors"
                          title="View Approach & Intuition"
                        >
                          <Lightbulb size={14} />
                        </button>
                      )}
                      {p.solutionCode && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setViewerModal({ open: true, problem: p }); }}
                          className="p-1.5 text-slate-400 hover:text-[#569cd6] hover:bg-[#569cd6]/10 rounded-md transition-colors"
                          title="View Code Solution"
                        >
                          <Code2 size={14} />
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
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span className="flex items-center gap-1"><Clock4 size={10} />{p.timeTaken || 0}m</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <ProblemModal open={modalOpen} onClose={closeModal} editProblem={editProblem} />
      
      <ProblemViewerModal 
        open={viewerModal.open} 
        onClose={() => setViewerModal({ open: false, problem: null })} 
        problem={viewerModal.problem} 
        onEdit={(p) => {
          setViewerModal({ open: false, problem: null });
          setEditProblem(p);
          setModalOpen(true);
        }}
      />
      
      {approachModal.open && (
        <div className="modal-overlay z-[100]" onClick={() => setApproachModal({ open: false, problem: null })}>
          <div className="modal-box flex flex-col max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02]">
              <h2 className="text-xl font-bold font-outfit tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <Lightbulb size={20} className="text-amber-500" />
                Approach & Intuition
              </h2>
              <button 
                onClick={() => setApproachModal({ open: false, problem: null })} 
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="mb-4">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Problem</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{approachModal.problem?.name}</span>
              </div>
              <div className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {approachModal.problem?.approach ? (
                  <ul className="space-y-3">
                    {approachModal.problem.approach
                      .replace(/([a-z0-9])\.\s+([A-Z])/g, '$1.\n$2')
                      .split('\n')
                      .map(line => line.trim())
                      .filter(line => line.length > 0)
                      .map((point, i) => {
                        const cleanPoint = point.replace(/^(\d+[\.\)]|[-*])\s+/, '');
                        return (
                          <li key={i} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed group">
                            <div className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500/40 group-hover:bg-amber-500 transition-colors shadow-[0_0_8px_rgba(245,158,11,0.2)]" />
                            <span>{cleanPoint}</span>
                          </li>
                        );
                    })}
                  </ul>
                ) : (
                  <span className="italic opacity-60">No approach recorded for this problem yet.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
