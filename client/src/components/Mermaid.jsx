import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import toast from 'react-hot-toast';

// Initialize mermaid with some defaults
mermaid.initialize({
  startOnLoad: true,
  theme: 'base',
  themeVariables: {
    primaryColor: '#6366f1',
    primaryTextColor: '#fff',
    primaryBorderColor: '#6366f1',
    lineColor: '#818cf8',
    secondaryColor: '#1e293b',
    tertiaryColor: '#0f172a',
    mainBkg: '#0f172a',
    nodeBorder: '#312e81',
    clusterBkg: '#1e293b',
    titleColor: '#e2e8f0',
  },
  securityLevel: 'loose',
  fontFamily: 'Inter, system-ui, sans-serif'
});

const Mermaid = ({ chart }) => {
  const ref = useRef(null);
  const [error, setError] = useState(null);

  const sanitizeChart = (c) => {
    if (!c) return '';
    let sanitized = c.trim();
    
    // 1. Strip accidental markdown blocks
    sanitized = sanitized.replace(/```mermaid/g, '').replace(/```/g, '').trim();

    // 2. Fix unquoted labels and handle nested quotes/brackets
    // This looks for node definitions like A[label], B(label), C{label}
    // We use a more robust approach to capture the content until the LAST closing character
    sanitized = sanitized.replace(/([a-zA-Z0-9_-]+)([\[\(\{]+)([\s\S]*?)([\]\)\}]+\s*(?:\r?\n|$|-->|-.->|==>))/g, (match, id, open, content, close) => {
       // We only want to transform if it looks like a label definition
       let inner = content.trim();
       
       // Remove any existing outer quotes
       inner = inner.replace(/^["']|["']$/g, '');
       
       // Replace any internal double quotes with single quotes
       // Replace internal brackets/braces that might break Mermaid with escaped versions or similar
       inner = inner.replace(/"/g, "'")
                    .replace(/[\[\]]/g, (m) => m === '[' ? '(' : ')'); // Convert sub-brackets to parens
       
       // Re-wrap with quotes and original delimiters
       // Trim the 'close' part to just the delimiters
       const delimiters = close.match(/^[\]\)\}]+/)[0];
       const suffix = close.substring(delimiters.length);
       
       return `${id}${open}"${inner}"${delimiters}${suffix}`;
    });
    
    // 3. Ensure a valid header
    if (!sanitized.match(/^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|quadrantChart|xychart|mindmap|timeline)/)) {
       sanitized = 'flowchart TD\n' + sanitized;
    }
    
    return sanitized;
  };

  useEffect(() => {
    if (ref.current && chart) {
      setError(null);
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
      const cleanChart = sanitizeChart(chart);
      
      try {
        // Clear previous content
        ref.current.innerHTML = '';
        
        mermaid.render(id, cleanChart).then(({ svg }) => {
          if (ref.current) {
            ref.current.innerHTML = svg;
          }
        }).catch(err => {
          console.error("Mermaid Render Error:", err, "Chart Code:", cleanChart);
          setError(`Failed to render visualization. Raw code was logged to console.`);
        });
      } catch (err) {
        console.error("Mermaid Parse Error:", err, "Chart Code:", cleanChart);
        setError("Invalid visualization format");
      }
    }
  }, [chart]);

  if (error) {
    const cleanChart = sanitizeChart(chart);
    return (
      <div className="mt-4 p-4 rounded-xl bg-rose-500/5 border border-rose-500/10">
        <div className="text-[10px] text-rose-400 font-bold uppercase tracking-widest mb-2">Rendering Error</div>
        <p className="text-xs text-rose-300/80 mb-3">{error}</p>
        <div className="p-3 bg-black/40 rounded-lg border border-rose-500/10 mb-3">
          <pre className="text-[10px] font-mono text-rose-200/60 overflow-x-auto no-scrollbar">{cleanChart}</pre>
        </div>
        <button 
          onClick={() => { navigator.clipboard.writeText(cleanChart); toast.success('Code copied!'); }}
          className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-all border border-rose-500/20"
        >
          Copy Code for Debugging
        </button>
      </div>
    );
  }

  return (
    <div className="mermaid-container bg-slate-900/40 dark:bg-black/20 p-4 rounded-2xl border border-slate-200/50 dark:border-white/5 overflow-x-auto no-scrollbar shadow-inner mt-4 group transition-all duration-300 hover:border-brand-500/30">
      <div ref={ref} className="mermaid-svg flex justify-center [&>svg]:max-w-full [&>svg]:h-auto" />
    </div>
  );
};

export default Mermaid;
