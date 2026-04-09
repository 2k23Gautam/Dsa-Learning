import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Users, Trophy, ShieldCheck, Globe, ExternalLink, UserMinus } from 'lucide-react';
import CircularProgressComp from '../components/CircularProgress.jsx';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext.jsx';
import { buildApiUrl } from '../store/StoreContext.jsx';
import toast from 'react-hot-toast';
import Friends from './Friends.jsx';

export default function Community() {
  const { token, authUser, refreshUser } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState([]);
  const [activeTab, setActiveTab] = useState('discover');
  const navigate = useNavigate();

  useEffect(() => {
    if (authUser) {
      fetchFriends();
    }
  }, [authUser]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl(`/api/users/search?q=${encodeURIComponent(query)}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setResults(await res.json());
      }
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const res = await fetch(buildApiUrl('/api/users/friends'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setFriends(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch friends');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const handleRemoveFriend = async (e, friendId) => {
    e.stopPropagation();
    try {
      const res = await fetch(buildApiUrl(`/api/users/remove-friend/${friendId}`), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Friend removed');
        fetchFriends();
        refreshUser();
      }
    } catch (err) {
      toast.error('Failed to remove friend');
    }
  };

  const sendRequest = async (userId) => {
    try {
      const res = await fetch(buildApiUrl(`/api/users/friend-request/${userId}`), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Friend request sent!');
        refreshUser();
      } else {
        const error = await res.json();
        toast.error(error.message || 'Request failed');
      }
    } catch (err) {
      toast.error('Failed to send request');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      
      <div className="relative glass-card p-12 overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 text-[10px] font-black uppercase tracking-[0.2em]">
            <Globe size={14} /> Global Discovery
          </div>
          <h1 className="text-4xl md:text-5xl font-black font-outfit text-slate-900 dark:text-white tracking-tight">
            Connect & Conquer
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm tracking-wide leading-relaxed">
            Find peers worldwide, track their LeetCode dominance, and climb the global leaderboards together.
          </p>
          
          <form onSubmit={handleSearch} className="relative group max-w-lg mx-auto mt-8">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search by name, email or LeetCode handle..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-white dark:bg-white/[0.03] border-2 border-slate-100 dark:border-white/[0.08] rounded-3xl py-5 pl-16 pr-10 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500/40 transition-all shadow-xl shadow-slate-200/50 dark:shadow-none focus:bg-white dark:focus:bg-white/[0.05]"
            />
            {loading && (
              <div className="absolute right-6 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
              </div>
            )}
          </form>
        </div>
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] -ml-32 -mb-32" />
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center mb-8">
         <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl overflow-hidden shadow-sm border border-slate-200/50 dark:border-white/[0.03]">
           <button
             onClick={() => setActiveTab('discover')}
             className={`relative px-8 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${activeTab === 'discover' ? 'text-brand-600 dark:text-brand-400 bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
           >
             Discovery
           </button>
           <button
             onClick={() => setActiveTab('network')}
             className={`relative px-8 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center gap-2 ${activeTab === 'network' ? 'text-brand-600 dark:text-brand-400 bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
           >
             My Network
             {authUser?.friendRequests?.filter(r => r.status === 'pending').length > 0 && (
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             )}
           </button>
         </div>
      </div>

      {activeTab === 'discover' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <ShieldCheck size={16} className="text-brand-500" /> Search Results
              </h2>
            </div>
  
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((user) => (
                <div key={user._id} className="glass-card p-6 group hover:translate-y-[-4px] transition-all relative overflow-hidden backdrop-blur-md">
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-2xl font-black text-slate-400 group-hover:bg-brand-500/10 group-hover:text-brand-600 transition-all">
                      {user.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 dark:text-white truncate">{user.name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">{user.leetcodeUsername || 'No LC Linked'}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Trophy size={12} className="text-amber-500" />
                        <span className="text-[10px] font-black text-slate-600 uppercase">Rank: {user.leetcodeStats?.userContestRanking?.globalRanking?.toLocaleString() || '---'}</span>
                      </div>
                    </div>
                  </div>
  
                  <div className="mt-6 flex items-center gap-2 relative z-10">
                    <button 
                      onClick={() => navigate(`/profile/${user._id}`)}
                      className="flex-1 bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-all flex items-center justify-center gap-2"
                    >
                      View <ExternalLink size={12} />
                    </button>
                    {authUser?.friends?.some(id => id.toString() === user._id.toString()) ? (
                       <div className="flex-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl border border-emerald-500/20 flex items-center justify-center gap-2">
                         <Users size={12} /> Friend
                       </div>
                    ) : authUser?.sentRequests?.some(id => id.toString() === user._id.toString()) ? (
                       <div className="flex-1 bg-brand-500/10 text-brand-500 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl border border-brand-500/20 flex items-center justify-center gap-2">
                         Request Sent
                       </div>
                    ) : (
                      <button 
                        onClick={() => sendRequest(user._id)}
                        className="flex-1 bg-brand-500 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2"
                      >
                        <UserPlus size={12} /> Connect
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
  
          <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Users size={16} className="text-brand-500" /> My Network
              </h2>
            </div>
  
            <div className="space-y-4">
              {friends.slice(0, 5).map((friend) => (
                <div 
                  key={friend._id}
                  className="glass-card p-6 group hover:border-brand-500/30 transition-all cursor-pointer relative overflow-hidden"
                  onClick={() => navigate(`/profile/${friend._id}`)}
                >
                      <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400 text-lg font-black border border-brand-500/20 shadow-inner group-hover:scale-110 transition-transform">
                            {friend.name[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 dark:text-white truncate">
                              {friend.name}
                            </h3>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{friend.leetcodeUsername || 'Pending LC'}</p>
                          </div>
                        </div>
                        <button 
                        onClick={(e) => handleRemoveFriend(e, friend._id)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                      >
                        <UserMinus size={16} />
                      </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div className="bg-slate-50 dark:bg-white/[0.03] p-3 rounded-2xl border border-slate-100 dark:border-white/[0.05] flex flex-col items-center">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Solved</p>
                           <CircularProgressComp
                              value={friend.leetcodeStats?.matchedUser?.submitStats?.acSubmissionNum?.[0]?.count || 0}
                              max={1000}
                              size={56}
                              strokeWidth={5}
                              color="#f59e0b"
                              label=""
                              noCard={true}
                           />
                        </div>
                        <div className="bg-slate-50 dark:bg-white/[0.03] p-3 rounded-2xl border border-slate-100 dark:border-white/[0.05] flex flex-col items-center">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Rating</p>
                           <CircularProgressComp
                              value={friend.leetcodeStats?.userContestRanking?.rating ? Math.round(friend.leetcodeStats.userContestRanking.rating) : 0}
                              max={3000}
                              size={56}
                              strokeWidth={5}
                              color="#3b82f6"
                              label=""
                              noCard={true}
                           />
                        </div>
                      </div>
  
                      <div className="mt-4 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-tighter relative z-10">
                        <span>Rank: #{friend.leetcodeStats?.userContestRanking?.globalRanking?.toLocaleString() || '---'}</span>
                        <Trophy size={12} className="text-amber-500" />
                      </div>
                </div>
              ))}
            </div>
          </div>
  
        </div>
      ) : (
        <Friends />
      )}
    </div>
  );
}
