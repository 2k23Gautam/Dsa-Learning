import { X, LayoutDashboard, List, User, Users, Trello,
  Settings,
  LogOut,
  UserCircle,
  UserPlus,
  AlertTriangle, Zap, CalendarDays, Sun, Moon, Building2, Briefcase,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { buildAssetUrl, useStore } from '../store/StoreContext.jsx';
import { useAuth } from '../store/AuthContext.jsx';
import Logo from './Logo.jsx';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/all',       icon: List,            label: 'All Problems' },
  { to: '/topics',    icon: Trello,          label: 'Topic Board' },
  { to: '/revision',  icon: AlertTriangle,   label: 'Revision' },
  { to: '/today',     icon: Zap,             label: "Today's DSA" },
  { to: '/calendar',  icon: CalendarDays,    label: 'Calendar' },
  { to: '/company',   icon: Building2,       label: 'Companies' },
  { to: '/community', icon: Users,           label: 'Social Hub' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { theme, toggleTheme, stats, problemsLoading } = useStore();
  const { authUser } = useAuth();
  const location = useLocation();

  return (
    <aside className={`fixed md:relative flex flex-col w-[280px] md:w-[252px] h-full shrink-0
                      bg-white/60 dark:bg-[#060914]/[0.75] backdrop-blur-3xl
                      border-r border-slate-200/50 dark:border-white/[0.04]
                      transition-transform duration-300 z-50
                      ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      
      {/* Logo Area */}
      <div className="flex items-center justify-between gap-3 px-6 py-5 group cursor-pointer border-b border-slate-200/30 dark:border-white/[0.02] bg-white/30 dark:bg-white/[0.005]">
        <Logo layout="row" title="DSA" highlight="Tracker" />
        <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto relative no-scrollbar">
        <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400/80 dark:text-slate-600/80 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500/50" /> Workspace
        </p>
        {NAV.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 group z-10
                ${isActive
                  ? 'text-brand-700 dark:text-white shadow-sm shadow-brand-500/5'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-white/[0.02] hover:translate-x-1'
                }`}
            >
              {isActive && (
                <>
                  {/* Glowing vertical marker on left */}
                  <motion.div
                    layoutId="sidebar-active-indicator-accent"
                    className="absolute left-0 top-[20%] bottom-[20%] w-[3px] bg-gradient-to-b from-brand-500 to-indigo-500 rounded-r-full shadow-sm shadow-brand-500/50 z-20"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                  {/* Glowing background pill */}
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute inset-0 bg-gradient-to-r from-brand-500/10 via-brand-500/[0.05] to-indigo-500/[0.02] dark:from-brand-500/15 dark:via-brand-500/8 dark:to-indigo-500/4 border border-brand-500/20 dark:border-brand-500/25 rounded-xl -z-10 shadow-sm"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                </>
              )}
              <Icon 
                size={18} 
                className={`transition-all duration-300 group-hover:scale-110 z-10
                  ${isActive
                    ? 'text-brand-600 dark:text-brand-300'
                    : 'text-slate-400 dark:text-slate-500 group-hover:text-brand-500 dark:group-hover:text-brand-400'
                  }`} 
              />
              <span className="tracking-wide z-10 transition-colors duration-200">{label}</span>
              {to === '/revision' && !problemsLoading && stats.needsRevision > 0 && (
                <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-lg z-10 border transition-all duration-300
                  ${isActive
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    : 'bg-slate-100 text-slate-500 dark:bg-white/[0.04] dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-white/[0.08] border-transparent'
                  }`}>
                  {stats.needsRevision}
                </span>
              )}
              {to === '/community' && authUser?.friendRequests?.filter(r => r.status === 'pending').length > 0 && (
                <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow-sm transition-all duration-300
                  ${isActive
                    ? 'bg-gradient-to-r from-brand-500 to-indigo-600 text-white shadow-brand-500/20'
                    : 'bg-brand-500 text-white shadow-brand-500/10'
                  }`}>
                  {authUser.friendRequests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom: Profile & Theme */}
      <div className="mt-auto p-4 border-t border-slate-200/50 dark:border-white/[0.04] space-y-3 bg-white/20 dark:bg-white/[0.005]">
        
        {/* User Profile Avatar */}
        <NavLink 
          to="/profile"
          onClick={onClose}
          className={({ isActive }) => 
            `flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 group border
            ${isActive 
              ? 'bg-brand-500/5 border-brand-500/20 dark:bg-brand-500/10 dark:border-brand-500/30' 
              : 'bg-white/40 dark:bg-white/[0.01] hover:bg-slate-100/80 dark:hover:bg-white/[0.03] border-slate-200/50 dark:border-white/[0.04] hover:border-slate-300 dark:hover:border-white/[0.08]'
            } shadow-sm hover:shadow-md
          `}
        >
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white font-black text-sm border-2 border-white dark:border-slate-900 shadow-md group-hover:scale-105 group-hover:ring-2 group-hover:ring-brand-500/30 transition-all duration-300 overflow-hidden shrink-0">
            {authUser?.profileImage ? (
              <img src={buildAssetUrl(authUser.profileImage)} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              authUser?.name?.[0]?.toUpperCase() || 'U'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate transition-colors duration-200">
              {authUser?.name || 'User'}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-500 font-medium uppercase tracking-widest truncate mt-0.5">
              Manage Profile
            </p>
          </div>
        </NavLink>

        {/* Custom Premium Theme Toggle Switch */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-between w-full px-4 py-3 rounded-2xl text-sm font-semibold
                     text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-white/[0.02]
                     hover:text-slate-900 dark:hover:text-slate-200 transition-all duration-300 border border-slate-200/50 dark:border-white/[0.02] group"
        >
          <div className="flex items-center gap-3">
            {theme === 'dark'
              ? <Sun size={16} className="text-amber-500 group-hover:rotate-[30deg] transition-transform duration-500" />
              : <Moon size={16} className="text-indigo-500 group-hover:-rotate-[15deg] transition-transform duration-500" />
            }
            <span className="tracking-wide">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </div>
          <div className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 flex items-center ${theme === 'dark' ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-800'}`}>
            <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300 ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </button>
      </div>
    </aside>
  );
}
