import { useState, useMemo } from 'react';
import { Plus, List } from 'lucide-react';
import { useStore } from '../store/StoreContext.jsx';
import ProblemTable from '../components/ProblemTable.jsx';
import FilterBar from '../components/FilterBar.jsx';
import ProblemModal from '../components/ProblemModal.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function AllProblems() {
  const { problems, filters } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProblem, setEditProblem] = useState(null);

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

  const openNew = () => { setEditProblem(null); setModalOpen(true); };
  const openEdit = (p) => { setEditProblem(p); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditProblem(null); };

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

      <FilterBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Main Content Area */}
      <div className="flex-1 glass-card overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto w-full no-scrollbar relative min-h-[400px]">
          {filteredProblems.length > 0 ? (
            <ProblemTable problems={filteredProblems} onEdit={openEdit} />
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

      <ProblemModal open={modalOpen} onClose={closeModal} editProblem={editProblem} />
    </div>
  );
}
