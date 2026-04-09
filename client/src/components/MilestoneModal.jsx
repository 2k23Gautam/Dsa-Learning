import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Target, TrendingUp, Award, Crown, Star, Flame, CheckCircle2, Zap, Shield, ShieldAlert } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const TIERS = [
  { min: 0, label: 'Apprentice', icon: Zap, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { min: 50, label: 'Bronze', icon: Shield, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { min: 100, label: 'Silver', icon: Award, color: 'text-slate-300', bg: 'bg-slate-500/10' },
  { min: 500, label: 'Gold', icon: Trophy, color: 'text-amber-400', bg: 'bg-yellow-500/10' },
  { min: 1000, label: 'Platinum', icon: Star, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { min: 2000, label: 'Diamond', icon: ShieldAlert, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { min: 5000, label: 'Legendary', icon: Crown, color: 'text-red-400', bg: 'bg-red-500/10' }
];

export default function MilestoneModal({ open, onClose, points = 0, history = [] }) {
  const currentTier = [...TIERS].reverse().find(t => points >= t.min) || TIERS[0];
  const nextTier = TIERS.find(t => t.min > points) || TIERS[TIERS.length - 1];
  
  // Real chart data from history, with fallback simulation
  const chartData = useMemo(() => {
    if (history && history.length > 1) {
        return history.map(h => ({
            day: new Date(h.date).toLocaleDateString('en-US', { weekday: 'short' }),
            points: h.points
        }));
    }

    // Fallback: 1 point per day step
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const todayIndex = new Date().getDay();
    const data = [];
    for (let i = 0; i < 7; i++) {
        const dayIdx = (todayIndex - 6 + i + 7) % 7;
        data.push({
            day: days[dayIdx],
            points: Math.max(0, points - (6 - i)) 
        });
    }
    return data;
  }, [points, history]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
        />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative glass-card max-w-3xl w-full p-8 overflow-hidden border border-white/10 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500">
                <TrendingUp size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black font-outfit text-white tracking-tight italic uppercase">Performance Analytics</h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Live GD Points Progression</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-8">
            {/* The Graph */}
            <div className="glass-card p-6 border-white/5 bg-white/[0.01] h-64 relative overflow-hidden group">
               <div className="absolute top-4 left-6 z-10">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Points Growth</p>
                  <p className="text-2xl font-black text-white font-outfit">{points} <span className="text-[10px] text-brand-400">GD</span></p>
               </div>
               
               <div className="absolute inset-0 pt-16">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={chartData}>
                     <defs>
                       <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                     <XAxis 
                       dataKey="day" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }}
                     />
                     <Tooltip 
                       content={({ active, payload }) => {
                         if (active && payload && payload.length) {
                           return (
                             <div className="glass-card px-3 py-1.5 border-brand-500/20 bg-slate-900 shadow-xl">
                               <p className="text-[10px] font-black text-brand-400 uppercase">{payload[0].payload.day}</p>
                               <p className="text-sm font-black text-white">{Math.round(payload[0].value)} Points</p>
                             </div>
                           );
                         }
                         return null;
                       }}
                     />
                     <Area 
                       type="monotone" 
                       dataKey="points" 
                       stroke="#3b82f6" 
                       strokeWidth={3}
                       fillOpacity={1} 
                       fill="url(#colorPoints)" 
                       animationDuration={2000}
                     />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
            </div>

            {/* Milestones Horizontal List */}
            <div className="space-y-4">
               <div className="flex items-center justify-between px-2">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Milestone Path</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                     Next: <span className="text-brand-400">{nextTier.label}</span> ({nextTier.min} Points)
                  </p>
               </div>
               
               <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                  {TIERS.map((tier, i) => {
                     const isUnlocked = points >= tier.min;
                     const isCurrent = currentTier.label === tier.label;
                     return (
                       <div 
                         key={i} 
                         className={`relative p-3 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-2 ${isUnlocked ? 'border-brand-500/20 bg-brand-500/5' : 'border-white/5 bg-white/[0.01] opacity-40'}`}
                       >
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isUnlocked ? tier.color + ' ' + tier.bg : 'text-slate-700 bg-slate-800/10'}`}>
                           <tier.icon size={16} />
                         </div>
                         <p className={`text-[9px] font-black uppercase text-center leading-tight ${isUnlocked ? 'text-white' : 'text-slate-600'}`}>
                           {tier.label}
                         </p>
                         {isCurrent && (
                           <motion.div 
                             layoutId="active-milestone"
                             className="absolute -top-1 -right-1 w-2 h-2 bg-brand-500 rounded-full shadow-[0_0_10px_#3b82f6] animate-pulse"
                           />
                         )}
                       </div>
                     );
                  })}
               </div>
            </div>
          </div>
          
          <div className="mt-10 pt-6 border-t border-white/5 flex justify-center">
            <button 
              onClick={onClose}
              className="px-10 py-3 rounded-2xl bg-white/5 text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all group shrink-0"
            >
              Analyze Complete
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
