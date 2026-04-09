import { useMemo, useState } from 'react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, parseISO, isSameMonth, addMonths, subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, X, CalendarDays } from 'lucide-react';
import { useStore } from '../store/StoreContext.jsx';
import { DifficultyBadge, StatusBadge } from '../components/Badges.jsx';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function SolvedCalendar() {
  const { problems } = useStore();
  const [current, setCurrent] = useState(new Date());
  const [selected, setSelected] = useState(null);

  const byDate = useMemo(() => {
    const map = {};
    problems.forEach(p => {
      // 1. Solved Date
      const sd = (p.dateSolved || p.solvedDate)?.substring(0, 10);
      if (sd) {
        if (!map[sd]) map[sd] = [];
        map[sd].push({ ...p, _calType: 'solved' });
      }

      // 2. Revision Date
      const rd = p.revisionDate?.substring(0, 10);
      if (rd && p.status === 'Needs Revision') {
        if (!map[rd]) map[rd] = [];
        // Only push if it's not already there as a revision
        if (!map[rd].some(existing => existing.id === p.id && existing._calType === 'revision')) {
           map[rd].push({ ...p, _calType: 'revision' });
        }
      }
    });
    return map;
  }, [problems]);

  const max = useMemo(() => Math.max(...Object.values(byDate).map(a => a.length), 1), [byDate]);

  const days = useMemo(() => {
    const monthStart = startOfMonth(current);
    const monthEnd   = endOfMonth(current);
    return eachDayOfInterval({
      start: startOfWeek(monthStart),
      end:   endOfWeek(monthEnd),
    });
  }, [current]);

  const prev = () => setCurrent(c => subMonths(c, 1));
  const next = () => setCurrent(c => addMonths(c, 1));

  const selectedProblems = selected ? (byDate[selected] || []) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-500/10 dark:bg-brand-500/15 flex items-center justify-center">
          <CalendarDays className="text-brand-500" size={22} />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Solved Calendar</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 glass-card p-5">
          {/* Nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prev} className="btn-ghost"><ChevronLeft size={18} /></button>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">
              {format(current, 'MMMM yyyy')}
            </h2>
            <button onClick={next} className="btn-ghost"><ChevronRight size={18} /></button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 py-1 uppercase tracking-wider">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day) => {
              const ds = format(day, 'yyyy-MM-dd');
              const count = byDate[ds]?.length || 0;
              const inMonth = isSameMonth(day, current);
              const isToday = ds === format(new Date(), 'yyyy-MM-dd');
              const isSelected = ds === selected;

              const intensity = count === 0 ? 0 : Math.ceil((count / max) * 4);
              const bgClass = !inMonth ? 'opacity-30 bg-transparent' : [
                'bg-slate-100/50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/[0.04]',
                'bg-brand-500/10 border border-brand-500/10',
                'bg-brand-500/25 border border-brand-500/25',
                'bg-brand-500/50 border border-brand-500/30',
                'bg-gradient-to-br from-brand-500 to-brand-600 shadow-md shadow-brand-500/20 border border-brand-300/30',
              ][intensity];

              return (
                <button
                  key={ds}
                  onClick={() => inMonth && setSelected(isSelected ? null : ds)}
                  className={`aspect-square flex flex-col items-center justify-center rounded-2xl text-xs transition-all duration-300
                    ${bgClass}
                    ${isToday ? 'ring-2 ring-brand-500/50 shadow-lg shadow-brand-500/10' : ''}
                    ${isSelected ? 'ring-2 ring-brand-500 scale-105 shadow-xl shadow-brand-500/20 z-10' : 'border border-transparent'}
                    ${inMonth ? 'hover:scale-105 hover:shadow-lg hover:shadow-brand-500/5 cursor-pointer' : 'cursor-default'}
                    ${!inMonth ? 'text-slate-300 dark:text-slate-700' : count > 0 ? 'text-white font-black' : 'text-slate-600 dark:text-slate-400 font-bold'}
                  `}
                >
                  <span className={count > 0 && inMonth ? 'text-[11px]' : ''}>{format(day, 'd')}</span>
                  {count > 0 && inMonth && (
                    <span className="text-[9px] font-black leading-none bg-black/10 px-1.5 py-0.5 rounded-full mt-1">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-6 justify-center">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Empty</span>
            {[
              'bg-slate-100 dark:bg-white/[0.04]',
              'bg-brand-500/10',
              'bg-brand-500/25',
              'bg-brand-500/50',
              'bg-gradient-to-br from-brand-500 to-brand-600'
            ].map((c, i) => (
              <div key={i} className={`w-3.5 h-3.5 rounded-md ${c} border border-black/5 dark:border-white/5`} />
            ))}
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">High</span>
          </div>
        </div>

        {/* Day Detail Panel */}
        <div className="glass-card p-5">
          {selected ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 dark:text-white tracking-tight">
                  {format(parseISO(selected), 'dd MMM yyyy')}
                </h3>
                <button onClick={() => setSelected(null)} className="btn-ghost p-1"><X size={14} /></button>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-3 font-medium">
                {selectedProblems.length} problem{selectedProblems.length !== 1 ? 's' : ''} solved
              </p>
              <div className="space-y-2 overflow-y-auto max-h-80">
                {selectedProblems.map(p => (
                  <div key={p.id} className={`p-4 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.05] space-y-2.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-500/5 hover:border-brand-500/20 group relative overflow-hidden border-l-4 ${p.platform?.toLowerCase() === 'leetcode' ? 'border-l-blue-500' : 'border-l-amber-500'}`}>
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-800 dark:text-white line-clamp-2 leading-tight group-hover:text-brand-500 transition-colors flex items-center gap-2">
                          {p.name}
                          {p._calType === 'revision' && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 uppercase tracking-widest border border-rose-500/20 shadow-sm shrink-0 whitespace-nowrap">Revision Pending</span>
                          )}
                        </p>
                      </div>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${p.platform?.toLowerCase() === 'leetcode' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        {p.platform}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5">
                        <DifficultyBadge difficulty={p.difficulty} />
                        <StatusBadge status={p.status} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                        {p.person || '—'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-10">
              <div className="w-14 h-14 rounded-2xl bg-brand-500/8 dark:bg-brand-500/10 flex items-center justify-center mb-4 animate-float">
                <CalendarDays size={24} className="text-brand-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 tracking-tight">Click a day</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">to see problems solved that day</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
