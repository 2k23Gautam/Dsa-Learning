import { useState, useEffect, useMemo, useRef } from 'react';
import { X, Save, Trash2, Sparkles, Loader2, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { buildApiUrl, useStore } from '../store/StoreContext.jsx';
import { useAuth } from '../store/AuthContext.jsx';
import { PLATFORMS, DIFFICULTIES, STATUSES, TOPICS, PATTERNS, TIME_COMPLEXITIES, SPACE_COMPLEXITIES } from '../store/data.js';
import TagInput from './TagInput.jsx';
import MarkdownEditor from './MarkdownEditor.jsx';
import toast from 'react-hot-toast';

export default function ProblemModal({ open, onClose, editProblem = null, initialData = null }) {
  const { problems, addProblem, updateProblem, deleteProblem } = useStore();
  const { token } = useAuth();
  const [formData, setFormData] = useState({ ...initialState });
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Problem statement state
  const [fetchedStatement, setFetchedStatement] = useState('');
  const [statementStatus, setStatementStatus] = useState('idle'); // idle | fetching | success | error
  const fetchDebounceRef = useRef(null);

  // Dynamically extract custom topics & patterns from user's problems
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
      if (editProblem) setFormData({ ...editProblem });
      else if (initialData) setFormData({ ...initialState, ...initialData, dateSolved: new Date().toISOString().substring(0, 10) });
      else setFormData({ ...initialState, dateSolved: new Date().toISOString().substring(0, 10) });
      // Reset statement when modal opens fresh
      setFetchedStatement('');
      setStatementStatus('idle');
    }
  }, [open, editProblem]);

  // ── Auto-fetch problem statement when LeetCode URL is entered ──────────────
  const handleLinkChange = (e) => {
    const link = e.target.value;
    setFormData(prev => ({ ...prev, link }));

    // Debounce: wait 800ms after user stops typing
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

        // Auto-fill name if empty
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let success;
      if (editProblem) {
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
    if (editProblem) {
      deleteProblem(formData.id || formData._id);
      toast.success('Problem deleted successfully');
    }
    onClose();
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
          problemStatement: fetchedStatement || ''   // ← pass fetched statement to AI
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
        approach: suggestions.suggestedApproach || prev.approach,
        notes: prev.notes
      }));

      const usedStatement = !!fetchedStatement;
      toast.success(
        usedStatement
          ? '✨ AI analyzed your code + problem statement!'
          : '✨ Fields populated with AI suggestions!',
        { duration: 3000 }
      );
    } catch (err) {
      toast.error(err.message || 'AI Extraction failed');
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02]">
          <h2 className="text-xl font-bold font-outfit tracking-tight text-slate-900 dark:text-white">
            {editProblem ? 'Edit Problem' : 'Log New Problem'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto no-scrollbar flex-1 relative">
          <form id="problem-form" onSubmit={handleSubmit} className="space-y-6">

            {/* Solution Code - MOVED TO TOP */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="section-title text-sm border-l-2 border-brand-500 pl-2 mb-0">Solution / Code</h3>
                <button
                  type="button"
                  onClick={handleAiSuggest}
                  disabled={isAiLoading || !formData.solutionCode}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-500/10 text-brand-600 hover:bg-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-[11px] font-black uppercase tracking-widest border border-brand-500/20"
                >
                  {isAiLoading ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} className="text-brand-500" />
                  )}
                  {isAiLoading ? 'Analyzing...' : 'Fill with AI ✨'}
                </button>
              </div>
              <div className="relative group">
                <label className="label">Paste your code (Required for AI Analysis)</label>
                <textarea
                  rows="6"
                  className="input-field font-mono text-[11px] resize-none py-3 focus:ring-brand-500/20 leading-relaxed no-scrollbar"
                  placeholder="Paste your solution here..."
                  value={formData.solutionCode}
                  onChange={e => setFormData({ ...formData, solutionCode: e.target.value })}
                  onClick={e => e.stopPropagation()}
                />
                {!formData.solutionCode && (
                  <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-white/80 dark:bg-[#0f1522]/80 px-2 py-0.5 rounded-full border border-slate-100 dark:border-white/[0.04]">
                      AI needs code to extract complexity & patterns
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Core Info */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/[0.06]">
              <h3 className="section-title text-sm border-l-2 border-brand-500 pl-2">Core Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Problem Name *</label>
                  <input required type="text" className="input-field" placeholder="e.g. Two Sum"
                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                  <label className="label flex items-center gap-2">
                    Problem Link
                    {/* Statement fetch status indicator */}
                    {statementStatus === 'fetching' && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 font-medium">
                        <Loader2 size={10} className="animate-spin" /> Fetching statement...
                      </span>
                    )}
                    {statementStatus === 'success' && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-green-500 font-medium">
                        <CheckCircle2 size={10} /> Statement ready for AI
                      </span>
                    )}
                    {statementStatus === 'error' && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                        <AlertCircle size={10} /> Couldn't fetch statement
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      className="input-field pr-8"
                      placeholder="https://leetcode.com/problems/..."
                      value={formData.link}
                      onChange={handleLinkChange}
                    />
                    {statementStatus === 'success' && (
                      <FileText size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none" />
                    )}
                  </div>
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
              <div className="flex items-center justify-between">
                <h3 className="section-title text-sm border-l-2 border-brand-500 pl-2 mb-0">Approach & Logic</h3>
              </div>

              <div className="relative">
                <MarkdownEditor
                  value={formData.approach}
                  onChange={e => setFormData({ ...formData, approach: e.target.value })}
                  placeholder="Explain the intuition and logical steps to solve..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="label">Time Complexity</label>
                  <input
                    list="time-complexities"
                    className="input-field"
                    placeholder="e.g. O(n)"
                    value={formData.timeComplexity}
                    onChange={e => setFormData({ ...formData, timeComplexity: e.target.value })}
                  />
                  <datalist id="time-complexities">
                    {TIME_COMPLEXITIES.map(tc => <option key={tc} value={tc} />)}
                  </datalist>
                </div>
                <div className="relative">
                  <label className="label">Space Complexity</label>
                  <input
                    list="space-complexities"
                    className="input-field"
                    placeholder="e.g. O(1)"
                    value={formData.spaceComplexity}
                    onChange={e => setFormData({ ...formData, spaceComplexity: e.target.value })}
                  />
                  <datalist id="space-complexities">
                    {SPACE_COMPLEXITIES.map(sc => <option key={sc} value={sc} />)}
                  </datalist>
                </div>
              </div>
            </div>

            {/* Classification */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/[0.06]">
              <h3 className="section-title text-sm border-l-2 border-brand-500 pl-2">Classification</h3>

              <div>
                <label className="label mb-2">Patterns (e.g., Sliding Window)</label>
                <TagInput
                  options={dynamicPatterns}
                  selected={formData.patterns}
                  onChange={v => setFormData(prev => ({ ...prev, patterns: v }))}
                  placeholder="Search and select patterns..."
                />
              </div>

              <div>
                <label className="label mb-2">Topics (e.g., Array, BFS)</label>
                <TagInput
                  options={dynamicTopics}
                  selected={formData.topics}
                  onChange={v => setFormData(prev => ({ ...prev, topics: v }))}
                  placeholder="Search and select topics..."
                />
              </div>
            </div>

            {/* Tracking & Notes */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/[0.06]">
              <h3 className="section-title text-sm border-l-2 border-brand-500 pl-2">Log Details</h3>

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
                <label className="label">Notes / Learnings</label>
                <textarea rows="3" className="input-field resize-none py-3" placeholder="What did you learn? Edge cases?"
                  value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="potd-modal" className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  checked={formData.isPOTD} onChange={e => setFormData({ ...formData, isPOTD: e.target.checked })} />
                <label htmlFor="potd-modal" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  Mark as Problem of the Day (POTD)
                </label>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {editProblem && (
              <button
                type="button"
                onClick={handleDelete}
                className="btn-ghost !text-red-500 hover:!bg-red-50 dark:hover:!bg-red-500/10 flex items-center gap-2"
              >
                <Trash2 size={16} /> Delete
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>Cancel</button>
            <button type="submit" form="problem-form" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {isSubmitting ? 'Processing...' : (editProblem ? 'Save Changes' : 'Log Problem')}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

const initialState = {
  name: '', link: '', platform: '', difficulty: 'Easy', topics: [], patterns: [],
  status: 'Solved', dateSolved: '', timeComplexity: '', spaceComplexity: '',
  approach: '', notes: '', solutionCode: '', revisionCount: 0, isPOTD: false
};
