import { Award, Shield, Trophy, Crown, Zap, Star, ShieldAlert, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const TIERS = [
  { min: 5000, label: 'Legendary', icon: Crown, color: 'from-rose-500 via-red-500 to-red-700', text: 'text-red-400', glow: 'shadow-red-500/50', bg: 'bg-red-500/10' },
  { min: 2000, label: 'Diamond', icon: ShieldAlert, color: 'from-fuchsia-500 via-purple-500 to-indigo-600', text: 'text-purple-400', glow: 'shadow-purple-500/40', bg: 'bg-purple-500/10' },
  { min: 1000, label: 'Platinum', icon: Star, color: 'from-cyan-400 via-blue-500 to-indigo-600', text: 'text-cyan-400', glow: 'shadow-cyan-500/40', bg: 'bg-cyan-500/10' },
  { min: 500,  label: 'Gold', icon: Trophy, color: 'from-amber-300 via-yellow-500 to-orange-600', text: 'text-amber-400', glow: 'shadow-yellow-500/40', bg: 'bg-yellow-500/10' },
  { min: 100,  label: 'Silver', icon: Award, color: 'from-slate-200 via-slate-400 to-slate-600', text: 'text-slate-300', glow: 'shadow-slate-400/30', bg: 'bg-slate-500/10' },
  { min: 50,   label: 'Bronze', icon: Shield, color: 'from-orange-400 via-amber-600 to-orange-800', text: 'text-orange-400', glow: 'shadow-orange-500/30', bg: 'bg-orange-500/10' },
  { min: 0,    label: 'Apprentice', icon: Zap, color: 'from-blue-400 via-indigo-500 to-indigo-700', text: 'text-indigo-400', glow: 'shadow-indigo-500/20', bg: 'bg-indigo-500/5' }
];

export default function BadgeDisplay({ points = 0, size = 'md', onClick }) {
  const currentTier = TIERS.find(t => points >= t.min) || TIERS[TIERS.length - 1];
  const Icon = currentTier.icon;

  const sizeClasses = {
    sm: { container: 'w-10 h-10 p-2', icon: 16, text: 'text-[9px]', sub: 'text-[8px]' },
    md: { container: 'w-16 h-16 p-3', icon: 28, text: 'text-[11px]', sub: 'text-[10px]' },
    lg: { container: 'w-24 h-24 p-5', icon: 40, text: 'text-[13px]', sub: 'text-[11px]' }
  };

  const sc = sizeClasses[size] || sizeClasses.md;

  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-4 group ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <motion.div 
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative"
      >
        {/* Deep Glow Layer */}
        <div className={`absolute inset-0 rounded-[2rem] bg-gradient-to-br ${currentTier.color} blur-2xl opacity-40 -z-10`} />
        
        {/* The Badge Container */}
        <div className={`relative rounded-[1.5rem] bg-gradient-to-br ${currentTier.color} flex items-center justify-center text-white shadow-2xl ${currentTier.glow} border-[3px] border-white/20 ${sc.container} overflow-hidden`}>
           {/* Inner Glass Shine */}
           <div className="absolute top-0 left-0 w-full h-[60%] bg-white/20 skew-y-[-10deg] -translate-y-1/2" />
           <Icon size={sc.icon} className="drop-shadow-md relative z-10" strokeWidth={2.5} />
           
           {/* Sparkles on premium tiers */}
           {points >= 50 && (
             <motion.div 
               animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="absolute top-1 right-1"
             >
               <Sparkles size={10} className="text-white/60" />
             </motion.div>
           )}
        </div>
      </motion.div>

      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <p className={`font-black uppercase tracking-[0.2em] ${currentTier.text} ${sc.text} font-outfit`}>
            {currentTier.label}
          </p>
          {points >= 50 && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
        </div>
        <div className={`flex items-center gap-2 px-2 py-0.5 rounded-full ${currentTier.bg} border border-white/5`}>
          <span className="text-white font-black text-[10px]">{points}</span>
          <span className="text-slate-500 font-bold text-[8px] uppercase tracking-widest">GD Points</span>
        </div>
      </div>
    </div>
  );
}
