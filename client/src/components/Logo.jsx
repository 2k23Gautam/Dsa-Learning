import { Terminal } from 'lucide-react';

export default function Logo({ showText = true, layout = 'row', title = "DSA", highlight = "Tracker", className = "" }) {
  const isCol = layout === 'col';
  
  return (
    <div className={`flex items-center justify-center ${isCol ? 'flex-col gap-4' : 'gap-3'} ${className}`}>
      
      {/* Sleek Icon Block */}
      <div className={`
        relative flex items-center justify-center 
        bg-white dark:bg-[#020617] 
        shadow-sm border border-slate-200 dark:border-white/[0.12] 
        group-hover:scale-110 transition-transform duration-300 ease-out
        ${isCol ? 'w-16 h-16 rounded-[1.25rem]' : 'w-9 h-9 rounded-[0.65rem]'}
      `}>
        {/* Subtle accent line at the top */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
        
        {/* Icon */}
        <Terminal 
          size={isCol ? 28 : 16} 
          className="text-slate-900 dark:text-white relative z-10" 
          strokeWidth={2} 
        />
        
        {/* Brand color dot */}
        <div className={`absolute rounded-full bg-brand-500 ${isCol ? 'w-2 h-2 top-4 right-4' : 'w-1.5 h-1.5 top-2 right-2'}`} />
      </div>
      
      {/* Typography */}
      {showText && (
        <h1 className={`font-outfit font-bold tracking-tight ${isCol ? 'text-4xl' : 'text-[16px] leading-none mt-0.5'}`}>
          <span className="text-slate-900 dark:text-white">{title}</span>
          <span className="text-brand-500 ml-1.5">
            {highlight}
          </span>
        </h1>
      )}
    </div>
  );
}
