import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Users2 } from 'lucide-react';
import { useStore } from '../store/StoreContext.jsx';
import ProblemTable from '../components/ProblemTable.jsx';
import ProblemModal from '../components/ProblemModal.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { DifficultyBadge } from '../components/Badges.jsx';

export default function FriendWise() {
  const { problems } = useStore();
  const [editProblem, setEditProblem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [collapsed, setCollapsed] = useState({});

  const groups = useMemo(() => {
    const map = {};
    problems.forEach(p => {
      const key = p.person || 'Unknown';
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [problems]);

  const toggle = (name) => setCollapsed(c => ({ ...c, [name]: !c[name] }));

  const openEdit = (p) => { setEditProblem(p); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditProblem(null); };

  if (!groups.length) return <EmptyState icon="friends" title="No problems yet" subtitle="Add problems and assign person names." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-500/10 dark:bg-brand-500/15 flex items-center justify-center">
          <Users2 className="text-brand-500" size={22} />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Friend-wise View</h1>
      </div>

      {/* Person cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {groups.map(([name, ps]) => {
          const easy   = ps.filter(p => p.difficulty === 'Easy').length;
          const medium = ps.filter(p => p.difficulty === 'Medium').length;
          const hard   = ps.filter(p => p.difficulty === 'Hard').length;
          return (
            <div key={name} className="gradient-glass p-4 hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-neon-cyan flex items-center justify-center text-white font-bold text-sm shadow-neon-sm">
                  {name[0].toUpperCase()}
                </div>
                <p className="font-bold text-slate-800 dark:text-slate-100 truncate tracking-tight">{name}</p>
              </div>
              <p className="text-2xl font-extrabold text-brand-400">{ps.length}</p>
              <div className="flex gap-2 mt-2">
                <span className="text-[11px] text-emerald-400 font-semibold">{easy}E</span>
                <span className="text-[11px] text-amber-400 font-semibold">{medium}M</span>
                <span className="text-[11px] text-red-400 font-semibold">{hard}H</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grouped tables */}
      {groups.map(([name, ps]) => (
        <div key={name} className="glass-card overflow-hidden">
          <button
            onClick={() => toggle(name)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-neon-cyan flex items-center justify-center text-white font-bold text-sm shadow-neon-sm">
                {name[0].toUpperCase()}
              </div>
              <span className="font-bold text-slate-800 dark:text-slate-100 tracking-tight">{name}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">({ps.length} problems)</span>
            </div>
            {collapsed[name] ? <ChevronRight size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
          </button>

          {!collapsed[name] && (
            <div className="border-t border-slate-200/50 dark:border-white/[0.04]">
              <ProblemTable problems={ps} onEdit={openEdit} />
            </div>
          )}
        </div>
      ))}

      <ProblemModal open={modalOpen} onClose={closeModal} editProblem={editProblem} />
    </div>
  );
}
