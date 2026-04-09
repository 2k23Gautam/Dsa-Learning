import { useState, useEffect } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CodeforcesTabContent({ handle }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!handle) return;
    
    // Fetch live CF data when active
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

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
        className="flex items-center justify-center p-8 text-slate-400"
      >
        <RefreshCw className="animate-spin mr-3" size={18} /> Syncing Codeforces...
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
      className="flex flex-wrap items-center gap-8 w-full"
    >
      {/* Profile Info Block */}
      <div className="flex items-center gap-4 border-r border-slate-200 dark:border-white/10 pr-8">
        {data?.titlePhoto ? (
           <img src={data.titlePhoto} alt="CF Avatar" className="w-12 h-12 rounded-xl object-cover shadow-sm" />
        ) : (
           <div className="w-12 h-12 rounded-xl bg-blue-500/10" />
        )}
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            {handle}
          </h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">
            {data?.rank || 'Unrated'}
          </p>
        </div>
      </div>

      {/* Stats Blocks */}
      {data && (
        <>
          <div className="text-center border-r border-slate-200 dark:border-white/10 pr-8">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Contest Rating</p>
             <p className="text-xl font-bold text-emerald-500">
               {data.rating || '--'}
             </p>
          </div>

          <div className="text-center border-r border-slate-200 dark:border-white/10 pr-8">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Max Rating</p>
             <p className="text-xl font-bold text-blue-500">
               {data.maxRating || '--'}
             </p>
          </div>

          <div className="text-center pr-8">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Contribution</p>
             <p className="text-xl font-bold text-slate-700 dark:text-slate-300">
               {data.contribution > 0 ? '+' : ''}{data.contribution || '0'}
             </p>
          </div>
        </>
      )}

      {/* External Link */}
      <a href={`https://codeforces.com/profile/${handle}`} target="_blank" rel="noreferrer" className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors ml-auto mr-2">
        <ExternalLink size={18} />
      </a>
    </motion.div>
  );
}
