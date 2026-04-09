import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { useStore } from '../store/StoreContext.jsx';
import toast from 'react-hot-toast';
import { X, CalendarDays, BrainCircuit, Activity, FileText, Code2, Edit2, Timer, HardDrive, Tag, Target, GitBranch, Lightbulb, Loader2 } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { DifficultyBadge, StatusBadge, PlatformBadge } from './Badges.jsx';
import MarkdownRenderer from './MarkdownRenderer.jsx';

export default function ProblemViewerModal({ open, onClose, problem, onEdit }) {
  const { updateProblem } = useStore();
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [editedCode, setEditedCode] = useState('');
  const [isSavingCode, setIsSavingCode] = useState(false);

  useEffect(() => {
    if (problem) {
      setEditedCode(problem.solutionCode || '');
      setIsEditingCode(false);
    }
  }, [problem]);

  if (!open || !problem) return null;

  const handleEdit = () => {
    onClose();
    if (onEdit) onEdit(problem);
  };

  const code = problem.solutionCode || '';
  
  // Basic language detection
  const codeLower = code.toLowerCase();
  let language = 'javascript';
  if (codeLower.includes('#include') || codeLower.includes('std::')) language = 'cpp';
  else if (codeLower.includes('public class') || codeLower.includes('system.out')) language = 'java';
  else if (codeLower.includes('def ') || codeLower.includes('print(')) language = 'python';

  const handleSaveCode = async () => {
    setIsSavingCode(true);
    try {
      await updateProblem(problem._id || problem.id, { ...problem, solutionCode: editedCode });
      toast.success('Code saved successfully');
      setIsEditingCode(false);
    } catch (err) {
      toast.error('Failed to save code');
    } finally {
      setIsSavingCode(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[210] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div 
        className="w-[calc(100vw-2rem)] md:w-[calc(100vw-4rem)] max-w-6xl h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] max-h-[90vh] flex flex-col bg-slate-50 dark:bg-[#0f1522] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 mx-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-white/5 bg-white/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 shadow-sm border border-brand-500/20">
              <BrainCircuit size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black font-outfit text-slate-900 dark:text-white tracking-tight leading-tight">
                {problem.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <PlatformBadge platform={problem.platform} />
                <DifficultyBadge difficulty={problem.difficulty} />
                <StatusBadge status={problem.status} />
                {problem.isPOTD && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold uppercase tracking-widest border border-amber-500/20">POTD</span>}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body - Split View */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Panel: Analytics & Concepts */}
          <div className="w-full md:w-80 shrink-0 flex flex-col border-r border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-[#0b101a] overflow-y-auto no-scrollbar pb-6 relative">
            
            {/* Meta Stats Grid */}
            <div className="p-6 grid grid-cols-2 gap-3 border-b border-slate-200 dark:border-white/5">
              <div className="p-3 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05]">
                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mb-1">
                  <CalendarDays size={14} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Solved On</span>
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">
                  {problem.dateSolved ? problem.dateSolved.substring(0, 10) : 'Unknown'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05]">
                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mb-1">
                  <Activity size={14} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Revision</span>
                </div>
                <p className={`text-sm font-bold ${problem.status === 'Needs Revision' ? 'text-rose-500' : 'text-slate-800 dark:text-white'}`}>
                  {problem.revisionDate ? problem.revisionDate.substring(0, 10) : 'None'}
                </p>
              </div>
              
              <div className="p-3 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05]">
                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mb-1">
                  <Timer size={14} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Time</span>
                </div>
                <p className="text-sm font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {problem.timeComplexity || 'O(?)'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05]">
                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mb-1">
                  <HardDrive size={14} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Space</span>
                </div>
                <p className="text-sm font-mono text-purple-600 dark:text-purple-400 font-bold">
                  {problem.spaceComplexity || 'O(?)'}
                </p>
              </div>
            </div>

            {/* Tags & Classifications */}
            <div className="p-6 border-b border-slate-200 dark:border-white/5 space-y-4">
               <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                    <Target size={14}/> Core Patterns
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {problem.patterns?.length > 0 ? problem.patterns.map(ptr => (
                      <span key={ptr} className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        {ptr}
                      </span>
                    )) : <span className="text-xs text-slate-500 italic">No patterns tagged</span>}
                  </div>
               </div>

               <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                    <Tag size={14}/> Topics
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {problem.topics?.length > 0 ? problem.topics.map(t => (
                      <span key={t} className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-slate-300">
                        {t}
                      </span>
                    )) : <span className="text-xs text-slate-500 italic">No topics tagged</span>}
                  </div>
               </div>
            </div>

            {/* Approach Notes */}
            <div className="p-6">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                 <Lightbulb size={14} className="text-amber-500" /> Approach & Intuition
               </h3>
               <div className="bg-white dark:bg-white/[0.02] p-4 rounded-2xl border border-slate-200 dark:border-white/[0.05]">
                 {problem.approach ? (
                   <MarkdownRenderer content={problem.approach} />
                 ) : (
                   <span className="text-sm italic text-slate-500 opacity-60">No approach logged.</span>
                 )}
               </div>

               {problem.notes && (
                 <>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 mt-6">Extra Notes / Edge Cases</h3>
                  <div className="text-xs text-slate-600 dark:text-slate-400 p-4 border border-amber-500/20 bg-amber-500/5 rounded-2xl italic">
                    {problem.notes}
                  </div>
                 </>
               )}
            </div>

          </div>

          {/* Right Panel: Official Viewer Engine */}
          <div className="flex-1 min-w-0 flex flex-col bg-[#1e1e1e] border-t md:border-t-0 border-slate-200 dark:border-white/5 relative">
             <div className="shrink-0 bg-[#252526] border-b border-[#3c3c3c] flex items-center justify-between pr-4">
                <div className="px-5 py-2.5 text-[12px] font-mono flex items-center gap-2 select-none border-t-2 border-[#569cd6] text-[#d4d4d4] bg-[#1e1e1e]">
                  <Code2 size={14} className="text-[#569cd6]" />
                  solution.{language === 'cpp' ? 'cpp' : language === 'java' ? 'java' : language === 'python' ? 'py' : 'js'}
                </div>
                <div className="flex items-center gap-2">
                   {!isEditingCode ? (
                      <button onClick={() => setIsEditingCode(true)} className="text-[11px] font-bold tracking-wide flex items-center gap-1.5 px-2.5 py-1 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors uppercase">
                        <Edit2 size={12} /> Edit Code
                      </button>
                   ) : (
                      <>
                        <button onClick={() => { setIsEditingCode(false); setEditedCode(problem.solutionCode || '') }} className="text-[11px] font-bold tracking-wide px-2.5 py-1 text-slate-400 hover:text-white transition-colors uppercase">
                           Cancel
                        </button>
                        <button onClick={handleSaveCode} disabled={isSavingCode} className="text-[11px] font-bold tracking-wide flex items-center gap-1.5 px-3 py-1 bg-brand-500 hover:bg-brand-600 text-white rounded transition-colors uppercase disabled:opacity-50">
                           {isSavingCode ? <Loader2 size={12} className="animate-spin" /> : <HardDrive size={12} />} Save
                        </button>
                      </>
                   )}
                </div>
             </div>
             
             {isEditingCode ? (
                <div className="flex-1 overflow-auto bg-[#1e1e1e] border-t border-[#3c3c3c] relative">
                   <textarea
                     value={editedCode}
                     onChange={e => setEditedCode(e.target.value)}
                     className="w-full h-full min-h-[300px] bg-transparent text-[#d4d4d4] p-6 font-mono text-[13px] outline-none resize-none no-scrollbar whitespace-pre"
                     spellCheck="false"
                     placeholder="Paste or write your solution code here..."
                   />
                </div>
             ) : !code ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-[#6a6a6a]">
                  <Code2 size={48} className="mb-4 opacity-30 text-[#569cd6]" />
                  <p className="text-[14px] font-mono mb-6">No solution code saved.</p>
                  <button onClick={() => setIsEditingCode(true)} className="px-4 py-2 bg-brand-500/10 text-brand-500 hover:bg-brand-500/20 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                     <Edit2 size={16} /> Add Code
                  </button>
                </div>
             ) : (
                <div className="flex-1 overflow-auto relative no-scrollbar">
                  <SyntaxHighlighter
                    language={language}
                    style={vscDarkPlus}
                    showLineNumbers={true}
                    wrapLines={true}
                    customStyle={{ margin: 0, padding: '1.5rem', background: '#1e1e1e', fontSize: '13px', fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace', lineHeight: '1.6' }}
                    lineNumberStyle={{ minWidth: '3em', paddingRight: '1em', textAlign: 'right', color: '#6e7681', userSelect: 'none', borderRight: '1px solid #3c3c3c', marginRight: '1em' }}
                  >
                    {code}
                  </SyntaxHighlighter>
                </div>
             )}
          </div>
        </div>

        {/* Global Action Footer */}
        <div className="shrink-0 p-4 border-t border-slate-200 dark:border-white/5 bg-slate-100/50 dark:bg-[#0b101a] flex items-center justify-between">
           <a 
             href={problem.link} 
             target="_blank" 
             rel="noreferrer"
             className={`text-sm font-bold ${problem.link ? 'text-brand-600 hover:text-brand-500' : 'text-slate-400 pointer-events-none'}`}
           >
             {problem.link ? 'Open Source Link ↗' : 'No link provided'}
           </a>
           <div className="flex items-center gap-3">
             <button 
               onClick={onClose}
               className="px-6 py-2.5 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
             >
               Close Viewer
             </button>
             <button 
               onClick={handleEdit}
               className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-white bg-brand-500 hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20"
             >
               <Edit2 size={16} />
               Edit Problem
             </button>
           </div>
        </div>

      </div>
    </div>
  , document.body);
}
