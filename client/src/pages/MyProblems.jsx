import { useState } from 'react';
import { Plus, User } from 'lucide-react';
import { useStore } from '../store/StoreContext.jsx';
import { useAuth } from '../store/AuthContext.jsx';
import FilterBar, { applyFilters, EMPTY_FILTERS } from '../components/FilterBar.jsx';
import ProblemTable from '../components/ProblemTable.jsx';
import ProblemModal from '../components/ProblemModal.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function MyProblems() {
  const { problems, filters } = useStore();
  const { authUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProblem, setEditProblem] = useState(null);

  const mine = problems.filter(p =>
    authUser ? p.person?.toLowerCase() === authUser.name.toLowerCase() : false
  );
  const visible = applyFilters(mine, filters, searchQuery);

  const openAdd  = () => { setEditProblem(null); setModalOpen(true); };
  const openEdit = (p) => { setEditProblem(p);   setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditProblem(null); };

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
          <FilterBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          <ProblemTable problems={visible} onEdit={openEdit} />
        </>
      )}

      <ProblemModal open={modalOpen} onClose={closeModal} editProblem={editProblem} />
    </div>
  );
}
