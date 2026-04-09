import { format } from 'date-fns';
import { Flame, CheckCircle2, Clock4, LogOut, Menu } from 'lucide-react';
import { useStore } from '../store/StoreContext.jsx';
import { useAuth } from '../store/AuthContext.jsx';

export default function TopBar({ onMenuClick }) {
  const { stats } = useStore();
  const { authUser, logout } = useAuth();

  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <header className="shrink-0 bg-white/80 dark:bg-[#0b101a]/80 backdrop-blur-xl
                       border-b border-slate-200 dark:border-white/[0.06]
                       px-4 md:px-6 lg:px-8 py-3 flex items-center justify-between gap-4
                       z-20 transition-all duration-300 sticky top-0">
      
      {/* Mobile Menu Button */}
      <button 
        onClick={onMenuClick}
        className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors"
      >
        <Menu size={20} />
      </button>
      <div className="hidden sm:block">
        <p className="text-sm font-bold text-slate-600 dark:text-slate-400 tracking-tight">{today}</p>
      </div>

      {/* Center — stats */}
      <div className="flex items-center gap-3 md:gap-4 flex-1 justify-start sm:justify-center overflow-x-auto no-scrollbar py-1">
        <StatPill 
          icon={<CheckCircle2 size={12} strokeWidth={3} />} 
          label="Today" 
          value={stats.today} 
          colorClass="text-emerald-500" 
          gradientText="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400"
        />
        <StatPill 
          icon={<Clock4 size={12} strokeWidth={3} />} 
          label="Revision" 
          value={stats.needsRevision} 
          colorClass="text-amber-500" 
          gradientText="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-400"
        />
        <StatPill 
          icon={<Flame size={12} strokeWidth={3} />} 
          label="Streak" 
          value={`${stats.streak}d`} 
          colorClass="text-rose-500" 
          gradientText="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500"
        />
      </div>

      {/* Right — logout button */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={logout}
          title="Sign Out"
          className="flex items-center justify-center p-2 rounded-xl 
                     text-slate-400 hover:text-slate-900 dark:hover:text-white
                     hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors duration-150"
        >
          <LogOut size={18} />
          <span className="text-xs font-bold ml-1 hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

function StatPill({ icon, label, value, colorClass, gradientText }) {
  const bgGlowClass = colorClass.replace('text-', 'bg-');
  
  return (
    <div className="relative group flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-2xl bg-white/60 dark:bg-white/[0.02] backdrop-blur-xl border border-slate-200/50 dark:border-white/[0.08] shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-white/[0.15] transition-all cursor-default overflow-hidden">
      
      {/* Background Hover Glow */}
      <div className={`absolute -inset-4 opacity-0 group-hover:opacity-[0.15] dark:group-hover:opacity-[0.08] transition-opacity blur-xl ${bgGlowClass}`} />
      
      {/* Icon Badge */}
      <div className={`relative flex items-center justify-center w-7 h-7 rounded-[10px] bg-slate-100 dark:bg-white/[0.04] shadow-inner border border-white/50 dark:border-transparent ${colorClass}`}>
        {icon}
      </div>
      
      {/* Stacked Label & Value */}
      <div className="flex flex-col justify-center relative z-10">
        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">
          {label}
        </span>
        <span className={`text-[13px] font-black leading-none ${gradientText}`}>
          {value}
        </span>
      </div>
    </div>
  );
}
