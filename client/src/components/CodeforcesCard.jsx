import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

export default function CodeforcesCard({ handle }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!handle) {
      setLoading(false);
      return;
    }
    
    // Fetch live Codeforces rank and rating directly from their public API
    fetch(`https://codeforces.com/api/user.info?handles=${handle}`)
      .then(res => res.json())
      .then(json => {
        if (json.status === 'OK' && json.result.length > 0) {
          setData(json.result[0]);
        }
      })
      .catch(e => console.error('CF Fetch Error:', e))
      .finally(() => setLoading(false));
  }, [handle]);

  if (!handle) return null;

  // Codeforces Official Rank Colors
  const getRankColor = (rank) => {
    if (!rank) return 'text-slate-500';
    if (rank.includes('newbie')) return 'text-slate-400';
    if (rank.includes('pupil')) return 'text-emerald-500';
    if (rank.includes('specialist')) return 'text-cyan-500';
    if (rank.includes('expert')) return 'text-blue-500';
    if (rank.includes('candidate master')) return 'text-purple-500';
    if (rank.includes('master')) return 'text-orange-400';
    if (rank.includes('grandmaster')) return 'text-red-500';
    return 'text-brand-500';
  };

  return (
    <div className="glass-card p-5 relative overflow-hidden group border-l-4 border-l-blue-500/50">
      {/* Ambient background glow */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500" />
      
      <div className="flex items-center gap-4 relative z-10">
        {loading ? (
           <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-white/5 animate-pulse" />
        ) : data?.titlePhoto ? (
           <img src={data.titlePhoto} alt="CF Avatar" className="w-12 h-12 rounded-2xl object-cover shadow-lg border border-white dark:border-white/10" />
        ) : (
           <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
             <Globe size={24} />
           </div>
        )}

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1 flex items-center gap-2">
              {handle}
              {/* Distinctive CF tag */}
              <span className="text-[8px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-sm font-black uppercase tracking-tighter">CF</span>
            </h3>
            {data?.rating && (
              <span className={`text-xs font-black px-2 py-0.5 rounded-md bg-white dark:bg-white/[0.03] ${getRankColor(data.rank)} border border-current/10 shadow-sm`}>
                {data.rating}
              </span>
            )}
          </div>
          
          <p className="text-[10px] font-black uppercase tracking-widest mt-0.5 text-slate-500 dark:text-slate-400">
            {loading ? 'Initializing...' : (data?.rank || 'Unrated')}
          </p>
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-2 gap-2 mt-4 relative z-10">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#050b14] border border-slate-100 dark:border-white/[0.04]">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Max Rank</p>
            <p className={`text-[11px] font-bold ${getRankColor(data.maxRank)} truncate uppercase tracking-tight`}>
              {data.maxRank || '--'}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#050b14] border border-slate-100 dark:border-white/[0.04]">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Max Rating</p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {data.maxRating || '--'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
