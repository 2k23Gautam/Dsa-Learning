import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

export default function TagInput({ options, selected, onChange, placeholder }) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const filteredOptions = options.filter(
    o => o.toLowerCase().includes(query.toLowerCase()) && !selected.includes(o)
  ).slice(0, 5);

  const exactMatch = options.find(o => o.toLowerCase() === query.trim().toLowerCase());

  const addTag = (tag) => {
    if (!tag || selected.includes(tag)) return;
    onChange([...selected, tag]);
    setQuery('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const removeTag = (tag) => {
    onChange(selected.filter(t => t !== tag));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = query.trim();
      if (!trimmed) return;

      if (exactMatch) {
        addTag(exactMatch);
      } else if (filteredOptions.length > 0) {
        addTag(filteredOptions[0]);
      } else {
        addTag(trimmed);
      }
    } else if (e.key === 'Backspace' && !query && selected.length > 0) {
      removeTag(selected[selected.length - 1]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && 
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(tag => (
            <span key={tag} className="px-2 py-1 bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300 text-xs font-semibold rounded-lg flex items-center gap-1 border border-brand-200 dark:border-brand-500/30 transition-all duration-200 hover:shadow-sm">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:text-brand-900 dark:text-brand-400 dark:hover:text-white transition-colors" title={`Remove ${tag}`}>
                <X size={12} strokeWidth={3} />
              </button>
            </span>
          ))}
        </div>
      )}
      
      <div className="relative">
        <input 
          ref={inputRef}
          type="text" 
          className="input-field py-2" 
          placeholder={selected.length === 0 ? placeholder : "Add more..."}
          value={query}
          onChange={e => { setQuery(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
        />
        
        {showDropdown && query.trim() && (
          <div ref={dropdownRef} className="absolute z-50 w-full mt-1.5 bg-white dark:bg-[#0f1522] border border-slate-200 dark:border-white/[0.08] shadow-bento rounded-xl overflow-hidden animate-slide-down origin-top">
            {filteredOptions.length > 0 ? (
              <div className="py-1">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Suggestions
                </div>
                {filteredOptions.map(opt => (
                  <button 
                    key={opt} 
                    type="button"
                    onClick={() => addTag(opt)} 
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-white/[0.04] cursor-pointer text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-between group"
                  >
                    <span>{opt}</span>
                    <span className="text-[10px] text-slate-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Press Enter ↵</span>
                  </button>
                ))}
              </div>
            ) : null}
            
            {!exactMatch && (
              <div className="py-1 border-t border-slate-100 dark:border-white/[0.04]">
                <button 
                  type="button"
                  onClick={() => addTag(query.trim())} 
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-brand-500/10 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-between group"
                >
                  <span>Create "<span className="font-semibold text-brand-600 dark:text-brand-400">{query.trim()}</span>"</span>
                  <span className="text-[10px] text-slate-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Press Enter ↵</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
