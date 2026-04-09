import { FolderX } from 'lucide-react';

export default function EmptyState({ title = "No problems found", subtitle = "Adjust your filters or add a new problem to get started.", icon = "folder" }) {
  return (
    <div className="w-full flex-1 min-h-[400px] flex items-center justify-center p-8 bg-slate-50/50 dark:bg-[#020617]/50 rounded-2xl border border-dashed border-slate-300 dark:border-white/[0.08]">
      <div className="flex flex-col items-center text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-[#0f1522] border border-slate-200 dark:border-white/[0.06] flex items-center justify-center mb-4 shadow-sm">
          {icon === 'folder' ? (
             <FolderX size={28} className="text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
          ) : (
             <div className="text-slate-400 dark:text-slate-500">
               {/* Use text/emoji or custom icon based on prop if needed, fallback to folder X */}
               <FolderX size={28} strokeWidth={1.5} />
             </div>
          )}
        </div>
        <h3 className="text-lg font-bold font-outfit text-slate-900 dark:text-white tracking-tight mb-2">
          {title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 tracking-wide">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
