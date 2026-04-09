import React, { useState } from 'react';
import { Code2, Eye } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function CodeEditor({ value, onChange, language = 'javascript', placeholder = "Paste your code here..." }) {
  const [activeTab, setActiveTab] = useState('write');

  return (
    <div className="flex flex-col w-full border border-slate-300 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-[#0b101a] transition-all focus-within:ring-2 focus-within:ring-brand-500/50 focus-within:border-brand-500/50 shadow-sm relative z-[100]">
      {/* Tool/Tab Bar */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-1.5 font-sans relative z-[101]">
        <button
          type="button"
          onClick={() => setActiveTab('write')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'write' 
              ? 'bg-white dark:bg-white/10 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200 dark:border-white/5' 
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/5 border border-transparent'
          }`}
        >
          <Code2 size={13} /> Edit
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
      <div className="min-h-[200px] max-h-[400px] overflow-y-auto w-full relative z-[100]">
        {activeTab === 'write' ? (
          <textarea
            value={value || ''}
            onChange={onChange}
            className="w-full h-full min-h-[200px] p-4 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-mono resize-y whitespace-pre"
            spellCheck="false"
            placeholder={placeholder}
          />
        ) : (
          <div className="w-full h-full min-h-[200px] max-h-[400px] overflow-auto text-xs bg-[#1e1e1e] relative z-[100]">
            {value ? (
              <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                showLineNumbers={true}
                wrapLines={true}
                customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
                lineNumberStyle={{ minWidth: '3em', paddingRight: '1em', textAlign: 'right', color: '#6e7681', userSelect: 'none', borderRight: '1px solid #3c3c3c', marginRight: '1em' }}
              >
                {value}
              </SyntaxHighlighter>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 italic gap-2 py-10 opacity-70">
                <Code2 size={24} />
                <span>Nothing to preview.</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="shrink-0 flex items-center justify-between px-3 py-1.5 bg-slate-50/80 dark:bg-white/[0.01] border-t border-slate-200 dark:border-white/5 relative z-[101]">
        <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">
          Syntax Highlighted View
        </span>
        <span className="text-[10px] text-slate-400 font-mono">
          {value?.length || 0} chars
        </span>
      </div>
    </div>
  );
}
