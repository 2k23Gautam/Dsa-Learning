import { useState, useEffect } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { buildApiUrl } from '../store/StoreContext.jsx';

export default function GfgTabContent({ handle, token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!handle || !token) { setLoading(false); return; }
    setLoading(true);
    setError(false);

    // Fetch via our backend proxy to avoid GFG CORS restrictions
    fetch(buildApiUrl(`/api/platforms/gfg/${handle}`), {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('GFG fetch failed');
        return res.json();
      })
      .then(json => setData(json))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [handle, token]);

  if (!handle) return null;

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="flex items-center text-slate-400"
      >
        <RefreshCw className="animate-spin mr-3" size={18} /> Syncing GFG...
      </motion.div>
    );
  }

  // Safely derive numbers from whatever shape the GFG API returns
  const totalSolved = data?.info?.totalProblemsSolved
    ?? data?.totalProblemsSolved
    ?? data?.solved_problems_count
    ?? null;

  const score = data?.info?.codingScore
    ?? data?.profile?.codingScore
    ?? data?.score
    ?? null;

  const rank = data?.info?.instituteRank
    ?? data?.info?.globalRank
    ?? data?.rank
    ?? null;

  const streak = data?.info?.currentStreak
    ?? data?.streak
    ?? null;

  const monthlyScore = data?.info?.monthlyScore
    ?? data?.monthlyScore
    ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
      className="flex flex-wrap items-center gap-8 w-full"
    >
      {/* Handle identity block */}
      <div className="flex items-center gap-4 border-r border-slate-200 dark:border-white/10 pr-8">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-500/10 text-green-500 text-lg font-black">
          G
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">{handle}</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">GFG Coder</p>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-slate-500 italic">
          GFG profile unavailable — verify your handle is correct.
        </p>
      ) : (
        <>
          {totalSolved !== null && (
            <div className="text-center border-r border-slate-200 dark:border-white/10 pr-8">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Solved</p>
              <p className="text-xl font-bold text-green-500">{totalSolved}</p>
            </div>
          )}

          {score !== null && (
            <div className="text-center border-r border-slate-200 dark:border-white/10 pr-8">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Coding Score</p>
              <p className="text-xl font-bold text-slate-700 dark:text-slate-300">{score}</p>
            </div>
          )}

          {streak !== null && (
            <div className="text-center border-r border-slate-200 dark:border-white/10 pr-8">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Streak</p>
              <p className="text-xl font-bold text-orange-500">{streak}d</p>
            </div>
          )}

          {rank !== null && (
            <div className="text-center pr-8">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Institute Rank</p>
              <p className="text-xl font-bold text-slate-700 dark:text-slate-300">#{rank}</p>
            </div>
          )}

          {/* If API returned nothing useful, show a placeholder */}
          {totalSolved === null && score === null && !error && (
            <p className="text-sm text-slate-400 italic">Stats not available — profile may be private.</p>
          )}
        </>
      )}

      <a href={`https://www.geeksforgeeks.org/user/${handle}`} target="_blank" rel="noreferrer" className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors ml-auto mr-2">
        <ExternalLink size={18} />
      </a>
    </motion.div>
  );
}
