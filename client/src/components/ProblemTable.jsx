import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpDown, Maximize2, Edit2, CheckCircle2, Star, Lightbulb, X, Code2 } from 'lucide-react';
import { useStore } from '../store/StoreContext.jsx';
import { DifficultyBadge, PlatformBadge, TopicBadge, PatternBadge } from './Badges.jsx';
import CodeSolutionModal from './CodeSolutionModal.jsx';
import ProblemViewerModal from './ProblemViewerModal.jsx';
import MarkdownRenderer from './MarkdownRenderer.jsx';

export default function ProblemTable({ problems, onEdit }) {
  const { filters, setFilter, togglePOTD } = useStore();
  const [approachModal, setApproachModal] = useState({ open: false, problem: null });
  const [codeModal, setCodeModal] = useState({ open: false, problem: null });

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
        <thead>
          <tr className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02]">
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
          {problems.map((p) => (
            <tr key={p.id} className="table-row group">
              <td className="table-td pl-4">
                {p.status === 'Solved' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />}
              </td>
              <td className="table-td font-medium text-slate-900 dark:text-slate-100 max-w-[200px] truncate">
                <div className="flex items-center gap-2">
                  {p.link ? (
                    <a href={p.link} target="_blank" rel="noreferrer" className="hover:text-brand-600 dark:hover:text-brand-400 hover:underline underline-offset-2 flex items-center gap-1.5 transition-colors truncate">
                      {p.name}
                      <Maximize2 size={12} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </a>
                  ) : (
                    <span className="truncate">{p.name}</span>
                  )}
                  {/* Approach button */}
                  {p.approach && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setApproachModal({ open: true, problem: p }); }}
                      className="p-1 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded transition-colors shrink-0"
                      title="View Approach & Intuition"
                    >
                      <Lightbulb size={14} />
                    </button>
                  )}
                  {/* Code Solution button */}
                  {p.solutionCode && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setCodeModal({ open: true, problem: p }); }}
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
                  <button onClick={() => onEdit(p)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors">
                    <Edit2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="py-3 px-4 text-xs text-slate-500 font-medium">
        {problems.length} problem{problems.length !== 1 ? 's' : ''} shown
      </div>

      {/* Approach Modal */}
      {approachModal.open && createPortal(
        <div className="modal-overlay z-[100]" onClick={() => setApproachModal({ open: false, problem: null })}>
          <div className="modal-box flex flex-col max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02]">
              <h2 className="text-xl font-bold font-outfit tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <Lightbulb size={20} className="text-amber-500" />
                Approach & Intuition
              </h2>
              <button onClick={() => setApproachModal({ open: false, problem: null })} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors">
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
                  <MarkdownRenderer content={approachModal.problem.approach} />
                ) : (
                  <span className="italic opacity-60">No approach recorded for this problem yet.</span>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Comprehensive Problem Viewer Modal */}
      <ProblemViewerModal
        open={codeModal.open}
        onClose={() => setCodeModal({ open: false, problem: null })}
        problem={codeModal.problem}
        onEdit={onEdit}
      />
    </div>
  );
}
