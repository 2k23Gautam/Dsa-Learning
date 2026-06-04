import { useState, useEffect } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../store/StoreContext';

export default function CodeforcesTabContent({ handle }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!handle) return;
    
    // Fetch live CF data via backend proxy
    const token = localStorage.getItem('dsa_token');
    fetch(`${API_BASE_URL}/api/codeforces/stats/${handle}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
      .then(res => res.json())
      .then(json => {
        if (json && !json.message) {
          setData(json);
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
        {data?.titlePhoto && !data.titlePhoto.includes('no-avatar') ? (
           <img src={data.titlePhoto} alt="CF Avatar" className="w-12 h-12 rounded-xl object-cover shadow-md" />
        ) : (
           <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-amber-600 flex items-center justify-center text-white text-lg font-black font-outfit shadow-md shadow-amber-500/20">
             CF
           </div>
        )}
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            {handle}
          </h3>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider mt-0.5 inline-block bg-slate-100 dark:bg-white/5 ${getRankColor(data?.rank)}`}>
            {data?.rank || 'Unrated'}
          </span>
        </div>
      </div>

      {/* Stats Blocks */}
      {data && (
        <>
          <div className="text-center border-r border-slate-200 dark:border-white/10 pr-8">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Contest Rating</p>
             <p className="text-2xl font-extrabold font-outfit text-emerald-500">
               {data.rating || '--'}
             </p>
          </div>

          <div className="text-center border-r border-slate-200 dark:border-white/10 pr-8">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Max Rating</p>
             <p className="text-2xl font-extrabold font-outfit text-blue-500">
               {data.maxRating || '--'}
             </p>
          </div>

          <div className="text-center pr-8">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Contribution</p>
             <p className="text-2xl font-extrabold font-outfit text-slate-700 dark:text-slate-300">
               {data.contribution > 0 ? '+' : ''}{data.contribution || '0'}
             </p>
          </div>
        </>
      )}

      {/* External Link */}
      <a 
        href={`https://codeforces.com/profile/${handle}`} 
        target="_blank" 
        rel="noreferrer" 
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all ml-auto border border-slate-200/50 dark:border-white/[0.04]"
      >
        View Profile <ExternalLink size={12} />
      </a>
    </motion.div>
  );
}
