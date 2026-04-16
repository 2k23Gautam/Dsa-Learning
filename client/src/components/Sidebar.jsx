import { X, LayoutDashboard, List, User, Users, Trello,
  Settings,
  LogOut,
  UserCircle,
  UserPlus,
  AlertTriangle, Zap, CalendarDays, Sun, Moon, Building2,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
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
  const { theme, toggleTheme, stats } = useStore();
  const { authUser } = useAuth();

  return (
    <aside className={`fixed md:relative flex flex-col w-[280px] md:w-[240px] h-full shrink-0
                      bg-white dark:bg-[#020617]
                      border-r border-slate-200 dark:border-white/[0.06]
                      transition-all duration-300 z-50
                      ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      
      {/* Logo Area */}
      <div className="flex items-center justify-between gap-3 px-6 py-6 group cursor-pointer">
        <Logo layout="row" title="DSA" highlight="Tracker" />
        <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <X size={20} />
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group
              ${isActive
                ? 'bg-white dark:bg-white/[0.06] text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200 dark:border-transparent'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.03] hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={isActive
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors duration-150'
                } />
                <span className="tracking-tight">{label}</span>
                {to === '/revision' && stats.needsRevision > 0 && (
                  <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md
                    ${isActive
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                      : 'bg-slate-100 text-slate-500 dark:bg-white/[0.04] dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-white/[0.08]'
                    }`}>
                    {stats.needsRevision}
                  </span>
                )}
                {to === '/community' && authUser?.friendRequests?.filter(r => r.status === 'pending').length > 0 && (
                  <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full
                    ${isActive
                      ? 'bg-brand-600 text-white'
                      : 'bg-brand-500 text-white flex items-center justify-center'
                    }`}>
                    {authUser.friendRequests.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: Profile & Theme */}
      <div className="mt-auto p-4 border-t border-slate-200 dark:border-white/[0.06] space-y-4">
        
        {/* User Profile Avatar */}
        <NavLink 
          to="/profile"
          onClick={onClose}
          className={({ isActive }) => 
            `flex items-center gap-3 p-2 rounded-xl transition-all group
            ${isActive ? 'bg-brand-500/5 border border-brand-500/20' : 'hover:bg-slate-100 dark:hover:bg-white/[0.03] border border-transparent'}
          `}
        >
          <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-black text-sm border-2 border-white dark:border-slate-900 shadow-lg group-hover:scale-105 transition-transform overflow-hidden">
            {authUser?.profileImage ? (
              <img src={buildAssetUrl(authUser.profileImage)} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              authUser?.name?.[0]?.toUpperCase() || 'U'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {authUser?.name || 'User'}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-500 font-medium uppercase tracking-widest truncate">
              Manage Profile
            </p>
          </div>
        </NavLink>

        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium
                     text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.03]
                     hover:text-slate-900 dark:hover:text-slate-200 transition-all duration-150"
        >
          {theme === 'dark'
            ? <Sun size={16} className="text-slate-400 group-hover:text-slate-500" />
            : <Moon size={16} className="text-slate-400 group-hover:text-slate-500" />
          }
          <span className="tracking-tight font-semibold">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>
    </aside>
  );
}
