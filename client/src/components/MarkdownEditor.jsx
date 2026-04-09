import React, { useState } from 'react';
import { Edit2, Eye } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

export default function MarkdownEditor({ value, onChange, placeholder = "Write your detailed approach here...\n\nSupports Markdown: **bold**, *italic*, `code`, and LaTeX math like $O(n)$ or $$\\sum_{i=1}^{n}$$" }) {
  const [activeTab, setActiveTab] = useState('write');

  return (
    <div className="flex flex-col w-full border border-slate-300 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-[#0b101a] transition-all focus-within:ring-2 focus-within:ring-brand-500/50 focus-within:border-brand-500/50 shadow-sm">
      {/* Tool/Tab Bar */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-1.5 font-sans">
        <button
          type="button"
          onClick={() => setActiveTab('write')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'write' 
              ? 'bg-white dark:bg-white/10 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200 dark:border-white/5' 
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/5 border border-transparent'
          }`}
        >
          <Edit2 size={13} /> Write
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'preview' 
              ? 'bg-white dark:bg-white/10 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200 dark:border-white/5' 
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/5 border border-transparent'
          }`}
        >
          <Eye size={13} /> Preview
        </button>
      </div>

      {/* Editor Content */}
      <div className="min-h-[220px] max-h-[500px] overflow-y-auto w-full relative group">
        {activeTab === 'write' ? (
          <textarea
            value={value || ''}
            onChange={onChange}
            className="w-full h-full min-h-[220px] p-4 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm leading-relaxed text-slate-800 dark:text-slate-200 resize-y font-mono"
            placeholder={placeholder}
          />
        ) : (
          <div className="w-full h-full min-h-[220px] p-5 overflow-x-hidden text-sm">
            {value ? (
              <MarkdownRenderer content={value} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 italic gap-2 py-10 opacity-70">
                <Eye size={24} />
                <span>Nothing to preview yet.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 flex items-center justify-between px-3 py-2 bg-slate-50/80 dark:bg-white/[0.01] border-t border-slate-200 dark:border-white/5">
        <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">
          Markdown + KaTeX LaTeX Supported
        </span>
        <span className="text-[10px] text-slate-400 font-mono">
          {value?.length || 0} chars
        </span>
      </div>
    </div>
  );
}
