import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Trash2, Sparkles, Loader2, FileText, CheckCircle2, AlertCircle, CalendarDays, BrainCircuit, Activity, Code2, Edit2, Timer, HardDrive, Tag, Target, Lightbulb } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { buildApiUrl, useStore } from '../store/StoreContext.jsx';
import { useAuth } from '../store/AuthContext.jsx';
import { PLATFORMS, DIFFICULTIES, STATUSES, TOPICS, PATTERNS, TIME_COMPLEXITIES, SPACE_COMPLEXITIES } from '../store/data.js';
import TagInput from './TagInput.jsx';
import MarkdownEditor from './MarkdownEditor.jsx';
import MarkdownRenderer from './MarkdownRenderer.jsx';
import { DifficultyBadge, StatusBadge, PlatformBadge } from './Badges.jsx';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const initialState = {
  name: '', link: '', platform: '', difficulty: 'Easy', topics: [], patterns: [],
  status: 'Solved', dateSolved: '', timeComplexity: '', spaceComplexity: '',
  approach: '', notes: '', solutionCode: '', revisionCount: 0, isPOTD: false
};

export default function ProblemDrawer({ open, onClose, problem = null, initialTab = 'overview', initialData = null }) {
  const { problems, addProblem, updateProblem, deleteProblem } = useStore();
  const { token } = useAuth();
  const [formData, setFormData] = useState({ ...initialState });
  const [activeTab, setActiveTab] = useState('overview');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Statement fetching
  const [fetchedStatement, setFetchedStatement] = useState('');
  const [statementStatus, setStatementStatus] = useState('idle'); // idle | fetching | success | error
  const fetchDebounceRef = useRef(null);

  // Code editor states (inside Code Tab)
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [editedCode, setEditedCode] = useState('');
  const [isSavingCode, setIsSavingCode] = useState(false);

  // Dynamically extract custom topics & patterns
  const dynamicTopics = useMemo(() => {
    const custom = new Set();
    problems?.forEach(p => p.topics?.forEach(t => custom.add(t)));
    return Array.from(new Set([...TOPICS, ...custom])).sort();
  }, [problems]);

  const dynamicPatterns = useMemo(() => {
    const custom = new Set();
    problems?.forEach(p => p.patterns?.forEach(pt => custom.add(pt)));
    return Array.from(new Set([...PATTERNS, ...custom])).sort();
  }, [problems]);

  useEffect(() => {
    if (open) {
      if (problem) {
        setFormData({ ...problem });
        setEditedCode(problem.solutionCode || '');
        setIsEditingCode(false);
        setActiveTab(initialTab || 'overview');
      } else {
        const prefilled = initialData ? { ...initialState, ...initialData } : { ...initialState };
        setFormData({ ...prefilled, dateSolved: new Date().toISOString().substring(0, 10) });
        setEditedCode('');
        setIsEditingCode(false);
        setActiveTab('edit');
      }
      setFetchedStatement('');
      setStatementStatus('idle');
    }
  }, [open, problem, initialTab, initialData]);

  // Auto-detect code language
  const code = formData.solutionCode || '';
  const language = useMemo(() => {
    const codeLower = code.toLowerCase();
    if (codeLower.includes('#include') || codeLower.includes('std::')) return 'cpp';
    if (codeLower.includes('public class') || codeLower.includes('system.out')) return 'java';
    if (codeLower.includes('def ') || codeLower.includes('print(')) return 'python';
    return 'javascript';
  }, [code]);

  // Fetch statement automatically
  const handleLinkChange = (e) => {
    const link = e.target.value;
    setFormData(prev => ({ ...prev, link }));

    if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);

    const isLeetCode = /leetcode\.com\/problems\/([\w-]+)/i.test(link);
    const isCodeforces = /codeforces\.com\/(contest|problemset)\//i.test(link);
    
    if (!isLeetCode && !isCodeforces) {
      setFetchedStatement('');
      setStatementStatus('idle');
      return;
    }

    setStatementStatus('fetching');
    fetchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(buildApiUrl('/api/problems/fetch-statement'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ link })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Failed to fetch');
        }

        const data = await res.json();
        setFetchedStatement(data.statement || '');
        setStatementStatus('success');

        if (!formData.name && data.title) {
          setFormData(prev => ({
            ...prev,
            difficulty: data.difficulty || prev.difficulty,
            name: prev.name || data.title
          }));
        }

        toast.success('Problem statement fetched! AI will use it for analysis.', { icon: '📄' });
      } catch (err) {
        console.warn('[Statement Fetch]', err.message);
        setFetchedStatement('');
        setStatementStatus('error');
      }
    }, 800);
  };

  const handleAiSuggest = async () => {
    if (!formData.solutionCode) {
      return toast.error('Please paste your solution code first for AI analysis');
    }

    setIsAiLoading(true);
    try {
      const res = await fetch(buildApiUrl('/api/problems/ai-suggest'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          link: formData.link,
          solutionCode: formData.solutionCode,
          problemStatement: fetchedStatement || ''
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'AI failed');
      }

      const suggestions = await res.json();

      setFormData(prev => ({
        ...prev,
        topics: Array.from(new Set([...(prev.topics || []), ...(suggestions.topics || [])])),
        difficulty: suggestions.difficulty || prev.difficulty,
        patterns: Array.from(new Set([...(prev.patterns || []), ...(suggestions.patterns || [])])),
        timeComplexity: suggestions.timeComplexity || prev.timeComplexity,
        spaceComplexity: suggestions.spaceComplexity || prev.spaceComplexity,
        approach: suggestions.suggestedApproach || prev.approach
      }));

      toast.success(fetchedStatement ? '✨ AI analyzed code + statement!' : '✨ Suggestions populated from AI!');
    } catch (err) {
      toast.error(err.message || 'AI Extraction failed');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let success;
      if (problem) {
        success = await updateProblem(formData.id || formData._id, formData);
      } else {
        success = await addProblem(formData);
      }
      if (success) onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (problem) {
      deleteProblem(formData.id || formData._id);
      toast.success('Problem deleted successfully');
    }
    onClose();
  };

  const handleSaveCode = async () => {
    setIsSavingCode(true);
    try {
      const targetId = problem?.id || problem?._id || formData.id || formData._id;
      await updateProblem(targetId, { ...formData, solutionCode: editedCode });
      setFormData(prev => ({ ...prev, solutionCode: editedCode }));
      toast.success('Code saved successfully');
      setIsEditingCode(false);
    } catch (err) {
      toast.error('Failed to save code');
    } finally {
      setIsSavingCode(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText, disabled: !problem },
    { id: 'approach', label: 'Approach', icon: Lightbulb, disabled: !problem },
    { id: 'code', label: 'Code', icon: Code2, disabled: !problem },
    { id: 'edit', label: !problem ? 'Log Problem' : 'Edit Details', icon: Edit2, disabled: false },
  ];

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          {/* Backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer Body */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="relative w-full sm:w-[540px] md:w-[700px] lg:w-[860px] h-full bg-slate-50 dark:bg-[#09090b] shadow-2xl border-l border-slate-200 dark:border-white/[0.08] flex flex-col z-[210] overflow-hidden"
          >
            {/* Header */}
            <div className="shrink-0 px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 shadow-sm border border-brand-500/20">
                  <BrainCircuit size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black font-outfit text-slate-900 dark:text-white tracking-tight leading-tight">
                    {problem ? formData.name : 'Log New Problem'}
                  </h2>
                  {problem && (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <PlatformBadge platform={formData.platform} />
                      <DifficultyBadge difficulty={formData.difficulty} />
                      <StatusBadge status={formData.status} />
                      {formData.isPOTD && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold uppercase tracking-widest border border-amber-500/20">
                          POTD
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Sub-Header Tabs */}
            <div className="flex border-b border-slate-200 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.01] px-6 py-2 gap-1 overflow-x-auto no-scrollbar shrink-0">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                if (tab.disabled) return null;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-colors ${
                      active
                        ? 'bg-brand-500/10 text-brand-500 border border-brand-500/20'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.03]'
                    }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Scrollable Workspace */}
            <div className="flex-1 overflow-y-auto p-6 no-scrollbar relative min-h-0 bg-slate-50 dark:bg-[#09090b]">
              
              {/* Tab 1: Overview */}
              {activeTab === 'overview' && problem && (
                <div className="space-y-6">
                  {/* Complexities and Solve details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05]">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Solved On</span>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {formData.dateSolved ? formData.dateSolved.substring(0, 10) : '—'}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05]">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Revisions</span>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {formData.revisionCount || 0}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05]">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Time complexity</span>
                      <p className="text-sm font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {formData.timeComplexity || 'O(?)'}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05]">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Space complexity</span>
                      <p className="text-sm font-mono text-purple-600 dark:text-purple-400 font-bold">
                        {formData.spaceComplexity || 'O(?)'}
                      </p>
                    </div>
                  </div>

                  {/* Classification tags */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05]">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                        <Target size={14} /> Core Patterns
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {formData.patterns?.length > 0 ? formData.patterns.map(p => (
                          <span key={p} className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            {p}
                          </span>
                        )) : <span className="text-xs text-slate-500 italic">No patterns selected</span>}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05]">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                        <Tag size={14} /> Topics
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {formData.topics?.length > 0 ? formData.topics.map(t => (
                          <span key={t} className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-200/50 dark:bg-white/5 text-slate-700 dark:text-slate-300">
                            {t}
                          </span>
                        )) : <span className="text-xs text-slate-500 italic">No topics selected</span>}
                      </div>
                    </div>
                  </div>

                  {/* Notes / Learnings */}
                  {formData.notes && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Notes & Learnings</span>
                      <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
                        {formData.notes}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Approach & Intuition */}
              {activeTab === 'approach' && problem && (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-white/[0.02] p-5 rounded-2xl border border-slate-200/60 dark:border-white/[0.05]">
                    {formData.approach ? (
                      <MarkdownRenderer content={formData.approach} />
                    ) : (
                      <span className="text-sm italic text-slate-500">No approach logged for this problem yet. Add details in edit tab.</span>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Code Solution */}
              {activeTab === 'code' && problem && (
                <div className="flex flex-col h-full rounded-2xl overflow-hidden border border-slate-200 dark:border-white/[0.08] bg-[#1e1e1e]">
                  <div className="shrink-0 bg-[#252526] border-b border-[#3c3c3c] flex items-center justify-between pr-4 pl-4 py-2">
                    <span className="text-[11px] font-mono flex items-center gap-2 select-none text-[#d4d4d4]">
                      <Code2 size={14} className="text-[#569cd6]" />
                      solution.{language === 'cpp' ? 'cpp' : language === 'java' ? 'java' : language === 'python' ? 'py' : 'js'}
                    </span>
                    <div className="flex items-center gap-2">
                      {!isEditingCode ? (
                        <button
                          onClick={() => setIsEditingCode(true)}
                          className="text-[10px] font-bold tracking-wide flex items-center gap-1.5 px-2.5 py-1 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors uppercase"
                        >
                          <Edit2 size={12} /> Edit Code
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => { setIsEditingCode(false); setEditedCode(formData.solutionCode || ''); }}
                            className="text-[10px] font-bold tracking-wide px-2.5 py-1 text-slate-400 hover:text-white transition-colors uppercase"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveCode}
                            disabled={isSavingCode}
                            className="text-[10px] font-bold tracking-wide flex items-center gap-1.5 px-3 py-1 bg-brand-500 hover:bg-brand-600 text-white rounded transition-colors uppercase disabled:opacity-50"
                          >
                            {isSavingCode ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {isEditingCode ? (
                    <div className="flex-1 min-h-[350px]">
                      <textarea
                        value={editedCode}
                        onChange={e => setEditedCode(e.target.value)}
                        className="w-full h-full min-h-[350px] bg-[#1e1e1e] text-[#d4d4d4] p-5 font-mono text-[12px] outline-none resize-none no-scrollbar whitespace-pre"
                        spellCheck="false"
                      />
                    </div>
                  ) : !formData.solutionCode ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-[#6a6a6a] min-h-[250px]">
                      <Code2 size={44} className="mb-3 opacity-30 text-[#569cd6]" />
                      <p className="text-[13px] font-mono mb-4">No solution code saved.</p>
                      <button
                        onClick={() => setIsEditingCode(true)}
                        className="px-3.5 py-1.5 bg-brand-500/10 text-brand-500 hover:bg-brand-500/20 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Edit2 size={14} /> Add Code
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-auto max-h-[60vh] no-scrollbar">
                      <SyntaxHighlighter
                        language={language}
                        style={vscDarkPlus}
                        showLineNumbers={true}
                        wrapLines={true}
                        customStyle={{ margin: 0, padding: '1.25rem', background: '#1e1e1e', fontSize: '12px', fontFamily: '"Fira Code", monospace', lineHeight: '1.6' }}
                        lineNumberStyle={{ minWidth: '2.5em', paddingRight: '0.75em', textAlign: 'right', color: '#6e7681', borderRight: '1px solid #3c3c3c', marginRight: '0.75em', userSelect: 'none' }}
                      >
                        {formData.solutionCode}
                      </SyntaxHighlighter>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Edit Details */}
              {activeTab === 'edit' && (
                <form id="problem-drawer-form" onSubmit={handleSubmit} className="space-y-6">
                  {/* Solution Code */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="section-title text-xs border-l-2 border-brand-500 pl-2 mb-0">Solution Code</h3>
                      <button
                        type="button"
                        onClick={handleAiSuggest}
                        disabled={isAiLoading || !formData.solutionCode}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-600 hover:bg-brand-500/20 disabled:opacity-50 transition-all text-[10px] font-black uppercase tracking-widest border border-brand-500/20"
                      >
                        {isAiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} className="text-brand-500" />}
                        {isAiLoading ? 'Analyzing...' : 'AI Suggest ✨'}
                      </button>
                    </div>
                    <textarea
                      rows="6"
                      className="input-field font-mono text-[11px] resize-none py-2.5 no-scrollbar leading-relaxed"
                      placeholder="Paste your code for complexity extraction..."
                      value={formData.solutionCode}
                      onChange={e => setFormData({ ...formData, solutionCode: e.target.value })}
                    />
                  </div>

                  {/* Core Info */}
                  <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/[0.06]">
                    <h3 className="section-title text-xs border-l-2 border-brand-500 pl-2 mb-0">Core Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Problem Name *</label>
                        <input required type="text" className="input-field" placeholder="e.g. Two Sum"
                          value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                      </div>
                      <div>
                        <label className="label flex items-center gap-2">
                          Problem Link
                          {statementStatus === 'fetching' && <span className="text-[10px] text-amber-500 flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Fetching statement...</span>}
                          {statementStatus === 'success' && <span className="text-[10px] text-green-500 flex items-center gap-1"><CheckCircle2 size={10} /> statement fetched!</span>}
                          {statementStatus === 'error' && <span className="text-[10px] text-slate-400 flex items-center gap-1"><AlertCircle size={10} /> Fetch failed</span>}
                        </label>
                        <input
                          type="url"
                          className="input-field"
                          placeholder="https://leetcode.com/problems/..."
                          value={formData.link}
                          onChange={handleLinkChange}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="label">Platform *</label>
                        <select required className="input-field" value={formData.platform} onChange={e => setFormData({ ...formData, platform: e.target.value })}>
                          <option value="" disabled>Select Platform</option>
                          {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="label">Difficulty *</label>
                        <select required className="input-field" value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })}>
                          <option value="" disabled>Select Difficulty</option>
                          {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="label">Status *</label>
                        <select required className="input-field" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Approach & Logic */}
                  <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/[0.06]">
                    <h3 className="section-title text-xs border-l-2 border-brand-500 pl-2 mb-0">Approach & Logic</h3>
                    <MarkdownEditor
                      value={formData.approach}
                      onChange={e => setFormData({ ...formData, approach: e.target.value })}
                      placeholder="Explain logic details..."
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Time Complexity</label>
                        <input
                          list="time-complexities-drawer"
                          className="input-field"
                          placeholder="e.g. O(n)"
                          value={formData.timeComplexity}
                          onChange={e => setFormData({ ...formData, timeComplexity: e.target.value })}
                        />
                        <datalist id="time-complexities-drawer">
                          {TIME_COMPLEXITIES.map(tc => <option key={tc} value={tc} />)}
                        </datalist>
                      </div>
                      <div>
                        <label className="label">Space Complexity</label>
                        <input
                          list="space-complexities-drawer"
                          className="input-field"
                          placeholder="e.g. O(1)"
                          value={formData.spaceComplexity}
                          onChange={e => setFormData({ ...formData, spaceComplexity: e.target.value })}
                        />
                        <datalist id="space-complexities-drawer">
                          {SPACE_COMPLEXITIES.map(sc => <option key={sc} value={sc} />)}
                        </datalist>
                      </div>
                    </div>
                  </div>

                  {/* Classification */}
                  <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/[0.06]">
                    <h3 className="section-title text-xs border-l-2 border-brand-500 pl-2 mb-0">Classification</h3>
                    <div>
                      <label className="label">Patterns</label>
                      <TagInput
                        options={dynamicPatterns}
                        selected={formData.patterns}
                        onChange={v => setFormData(prev => ({ ...prev, patterns: v }))}
                        placeholder="Select patterns..."
                      />
                    </div>
                    <div>
                      <label className="label">Topics</label>
                      <TagInput
                        options={dynamicTopics}
                        selected={formData.topics}
                        onChange={v => setFormData(prev => ({ ...prev, topics: v }))}
                        placeholder="Select topics..."
                      />
                    </div>
                  </div>

                  {/* Logs & Notes */}
                  <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/[0.06]">
                    <h3 className="section-title text-xs border-l-2 border-brand-500 pl-2 mb-0">Logs</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Date Solved *</label>
                        <input required type="date" className="input-field"
                          value={formData.dateSolved} onChange={e => setFormData({ ...formData, dateSolved: e.target.value })} />
                      </div>
                      <div>
                        <label className="label">Revisions</label>
                        <input type="number" min="0" className="input-field"
                          value={formData.revisionCount} onChange={e => setFormData({ ...formData, revisionCount: parseInt(e.target.value) || 0 })} />
                      </div>
                    </div>

                    <div>
                      <label className="label">Learnings & Notes</label>
                      <textarea rows="3" className="input-field resize-none py-2.5" placeholder="Edge cases, learnings..."
                        value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                    </div>

                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="potd-drawer" className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        checked={formData.isPOTD} onChange={e => setFormData({ ...formData, isPOTD: e.target.checked })} />
                      <label htmlFor="potd-drawer" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                        Mark as Problem of the Day (POTD)
                      </label>
                    </div>
                  </div>
                </form>
              )}

            </div>

            {/* Bottom Footer Actions */}
            <div className="shrink-0 p-4 border-t border-slate-200 dark:border-white/[0.06] bg-slate-100/50 dark:bg-[#0b101a] flex items-center justify-between">
              <div>
                {activeTab === 'edit' && problem && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="btn-danger flex items-center gap-1.5 px-4 py-2 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-500 font-bold text-xs uppercase"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {activeTab === 'edit' ? (
                  <>
                    <button type="button" onClick={onClose} className="btn-secondary text-xs uppercase font-bold px-5 py-2">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      form="problem-drawer-form"
                      disabled={isSubmitting}
                      className="btn-primary text-xs uppercase font-bold px-6 py-2"
                    >
                      {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      {isSubmitting ? 'Saving...' : (problem ? 'Save Changes' : 'Log Problem')}
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={onClose} className="btn-secondary text-xs uppercase font-bold px-5 py-2">
                      Close Viewer
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('edit')}
                      className="btn-primary text-xs uppercase font-bold px-6 py-2"
                    >
                      <Edit2 size={14} /> Edit Details
                    </button>
                  </>
                )}
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
