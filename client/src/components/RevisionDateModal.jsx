import { useState, useEffect } from 'react';
import { Calendar, X, Check } from 'lucide-react';

export default function RevisionDateModal({ open, onClose, onSave, currentProblem }) {
  const [date, setDate] = useState('');

  useEffect(() => {
    if (open) {
      // Default to 7 days from now if no date exists
      const defaultDate = currentProblem?.revisionDate || 
        new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
      setDate(defaultDate);
    }
  }, [open, currentProblem]);

  if (!open) return null;

  const handleSave = () => {
    if (date) {
      onSave(date);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-sm gradient-glass overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="text-brand-400" size={18} />
            <h3 className="font-bold text-slate-900 dark:text-white">Set Revision Date</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/[0.05] rounded-lg transition-colors text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select when you want to revisit <span className="text-slate-900 dark:text-slate-200 font-semibold">"{currentProblem?.name}"</span>.
          </p>
          
          <div className="relative group">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors pointer-events-none" size={16} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl py-3 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-brand-500/50 transition-all font-medium color-scheme-dark"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-sm font-bold text-slate-600 dark:text-slate-300 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-sm font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
            >
              <Check size={16} /> Set Date
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
