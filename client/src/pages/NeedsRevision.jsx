import { useState } from 'react';
import { RotateCcw, CalendarPlus, AlertTriangle, Pencil, Lightbulb, Code2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '../store/StoreContext.jsx';
import { applyFilters, EMPTY_FILTERS } from '../components/FilterBar.jsx';
import ProblemTable from '../components/ProblemTable.jsx';
import ProblemModal from '../components/ProblemModal.jsx';
import EmptyState from '../components/EmptyState.jsx';
import FilterBar from '../components/FilterBar.jsx';
import RevisionDateModal from '../components/RevisionDateModal.jsx';

export default function NeedsRevision() {
  const { problems, updateProblem, filters } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [editProblem, setEditProblem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [activeProblem, setActiveProblem] = useState(null);

  const revisionProblems = problems.filter(p => p.status === 'Needs Revision');
  const visible = applyFilters(revisionProblems, filters, searchQuery);

  const openEdit = (p) => { setEditProblem(p); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditProblem(null); };

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

      {revisionProblems.length === 0 ? (
        <EmptyState icon="book"
          title="Nothing needs revision! 🎉"
          subtitle="Mark problems as 'Needs Revision' from the All Problems view." />
      ) : (
        <>
          <FilterBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

          {/* Quick-action cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {visible.map(p => (
              <div key={p.id}
                className="gradient-glass p-4 space-y-2 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all duration-300"
                style={{ borderLeft: '3px solid rgba(245,158,11,0.5)' }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm line-clamp-2">{p.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-600 mt-0.5">{p.platform}</p>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-400/15 text-amber-400 px-2 py-0.5 rounded-full whitespace-nowrap">
                    Rev #{p.revisionCount || 0}
                  </span>
                </div>

                {p.revisionDate && (
                  <p className="text-xs text-slate-400 dark:text-slate-600 mb-2">
                    📅 Next revision: <span className="text-amber-400 font-medium">{p.revisionDate}</span>
                  </p>
                )}

                <div className="flex items-center gap-2 mb-2">
                  {p.approach && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md">
                      <Lightbulb size={12} /> Approach Logged
                    </div>
                  )}
                  {p.solutionCode && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#569cd6] bg-[#569cd6]/10 px-2 py-1 rounded-md">
                      <Code2 size={12} /> Code Saved
                    </div>
                  )}
                </div>



                <div className="flex gap-2 pt-1">
                  <button onClick={() => markRevised(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20
                               text-emerald-500 text-xs font-semibold py-2 rounded-xl transition-all duration-200
                               hover:shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                    <RotateCcw size={12} /> Mark Revised
                  </button>
                  <button onClick={() => setNextRevision(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-brand-500/10 hover:bg-brand-500/20
                               text-brand-400 text-xs font-semibold py-2 rounded-xl transition-all duration-200
                               hover:shadow-[0_0_12px_rgba(51,140,255,0.15)]">
                    <CalendarPlus size={12} /> Set Date
                  </button>
                  <button onClick={() => openEdit(p)}
                    className="px-3 bg-surface-100 dark:bg-white/[0.04] hover:bg-surface-200 dark:hover:bg-white/[0.08]
                               text-slate-600 text-xs py-2 rounded-xl transition-all duration-200">
                    <Pencil size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <h2 className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-widest">Table View</h2>
            <ProblemTable problems={visible} onEdit={openEdit} />
          </div>
        </>
      )}

      <ProblemModal open={modalOpen} onClose={closeModal} editProblem={editProblem} />
      <RevisionDateModal 
        open={dateModalOpen} 
        onClose={closeDateModal} 
        onSave={handleSaveDate} 
        currentProblem={activeProblem} 
      />
    </div>
  );
}
