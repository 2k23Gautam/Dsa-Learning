import { useState } from 'react';
import { X, Copy, Check, Code2, Edit2 } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function CodeSolutionModal({ open, onClose, problem, onEdit }) {
  const [copied, setCopied] = useState(false);

  const code = problem?.solutionCode || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleEdit = () => {
    onClose();
    if (onEdit && problem) {
      onEdit(problem);
    }
  };

  if (!open) return null;

  const linesCount = code ? code.split('\n').length : 0;

  // Determine language intuitively (basic fallback)
  const codeLower = code.toLowerCase();
  let language = 'javascript';
  if (codeLower.includes('#include') || codeLower.includes('std::')) language = 'cpp';
  else if (codeLower.includes('public class') || codeLower.includes('system.out')) language = 'java';
  else if (codeLower.includes('def ') || codeLower.includes('print(')) language = 'python';

  return (
    <div className="modal-overlay z-[110] bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-4xl mx-auto my-6 rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-[#1e1e1e] border border-[#3c3c3c]"
        style={{ maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Title bar — VS Code style */}
        <div
          style={{ background: '#1e1e1e', borderBottom: '1px solid #3c3c3c' }}
          className="flex items-center justify-between px-4 py-3 shrink-0"
        >
          <div className="flex items-center gap-4">
            {/* Traffic lights decoration */}
            <div className="flex gap-2">
              <button onClick={onClose} className="w-3.5 h-3.5 rounded-full bg-[#ff5f57] hover:bg-[#ff5f57]/80 transition-colors flex items-center justify-center group" title="Close">
                <X size={8} className="opacity-0 group-hover:opacity-100 text-[#4c0000]" />
              </button>
              <div className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]" />
              <div className="w-3.5 h-3.5 rounded-full bg-[#27c93f]" />
            </div>
            
            <div className="flex items-center gap-2 text-[#d4d4d4] select-none">
              <Code2 size={15} className="text-[#569cd6]" />
              <span className="text-[13px] font-mono font-semibold truncate max-w-[300px]">
                {problem?.name ? problem.name.replace(/\s+/g, '_') : 'solution'}.{language === 'cpp' ? 'cpp' : language === 'java' ? 'java' : language === 'python' ? 'py' : 'js'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium font-sans transition-all text-white bg-brand-600 hover:bg-brand-500 shadow-sm"
              title="Edit this solution in the Problem Modal"
            >
              <Edit2 size={13} />
              Edit Code
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-mono transition-all"
              style={{
                background: copied ? '#27c93f22' : '#ffffff0f',
                color: copied ? '#27c93f' : '#d4d4d4',
                border: `1px solid ${copied ? '#27c93f44' : '#3c3c3c'}`
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <div className="w-[1px] h-5 bg-[#3c3c3c] mx-1" />
            <button
              onClick={onClose}
              className="p-1.5 rounded transition-colors text-[#d4d4d4] hover:bg-[#ffffff14] hover:text-white"
              title="Close Viewer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ background: '#252526', borderBottom: '1px solid #3c3c3c' }} className="flex shrink-0">
          <div
            className="px-4 py-2.5 text-[12px] font-mono flex items-center gap-2 select-none"
            style={{ background: '#1e1e1e', borderTop: '2px solid #569cd6', color: '#d4d4d4' }}
          >
            <Code2 size={14} className="text-[#569cd6]" />
            solution.{language === 'cpp' ? 'cpp' : language === 'java' ? 'java' : language === 'python' ? 'py' : 'js'}
          </div>
        </div>

        {!code ? (
          <div
            style={{ background: '#1e1e1e', color: '#6a6a6a' }}
            className="flex-1 flex flex-col items-center justify-center p-16 text-center select-none"
          >
            <Code2 size={48} className="mb-4 opacity-30 text-[#569cd6]" />
            <p className="text-[14px] font-mono">No solution code saved for this problem.</p>
            <p className="text-[12px] mt-2 opacity-60">Click the "Edit Code" button above to add your solution.</p>
            <button
              onClick={handleEdit}
              className="mt-6 px-4 py-2 bg-[#ffffff0f] hover:bg-[#ffffff14] border border-[#3c3c3c] rounded text-[#d4d4d4] text-[13px] font-mono flex items-center gap-2 transition-colors"
            >
              <Edit2 size={14} />
              Open Editor
            </button>
          </div>
        ) : (
          /* Code body with real Syntax Highlighter */
          <div className="flex-1 overflow-auto bg-[#1e1e1e] relative">
            <SyntaxHighlighter
              language={language}
              style={vscDarkPlus}
              showLineNumbers={true}
              wrapLines={true}
              customStyle={{
                margin: 0,
                padding: '1.5rem 1rem',
                background: '#1e1e1e',
                fontSize: '13px',
                fontFamily: '"Fira Code", "Cascadia Code", Consolas, "Courier New", monospace',
                lineHeight: '1.6'
              }}
              lineNumberStyle={{
                minWidth: '3.5em',
                paddingRight: '1em',
                textAlign: 'right',
                color: '#6e7681',
                marginRight: '1em'
              }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        )}

        {/* Status bar — VS Code style */}
        <div
          className="shrink-0 flex items-center justify-between px-4 py-1.5 text-[11px] font-mono select-none"
          style={{ background: '#007acc', color: '#ffffff' }}
        >
          <div className="flex items-center gap-4">
            <span>{linesCount} lines</span>
            <span>{code.length} chars</span>
          </div>
          <div className="flex items-center gap-4">
            <span>UTF-8</span>
            <span>Spaces: 4</span>
            <span className="capitalize">{language}</span>
          </div>
        </div>

        {/* Explicit Action Footer for visibility */}
        <div className="shrink-0 flex items-center justify-end px-5 py-3 border-t border-[#3c3c3c] bg-[#1e1e1e] gap-3">
           <button
             onClick={onClose}
             className="px-5 py-2 text-sm font-bold text-[#d4d4d4] bg-[#3c3c3c] hover:bg-[#4c4c4c] transition-colors rounded shadow-sm"
           >
             Close Viewer
           </button>
           <button
             onClick={handleEdit}
             className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-md transition-colors rounded"
           >
             <Edit2 size={16} />
             Edit Code
           </button>
        </div>

      </div>
    </div>
  );
}
