import { useState, useEffect } from 'react';
import { useAuth } from '../store/AuthContext.jsx';
import { Users, UserPlus, UserMinus, Check, X, ShieldCheck, Globe, Trophy, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CircularProgress from '../components/CircularProgress.jsx';
import { buildApiUrl } from '../store/StoreContext.jsx';
import toast from 'react-hot-toast';

export default function Friends() {
  const { token, authUser, refreshUser } = useAuth();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        fetch(buildApiUrl('/api/users/friends'), { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(buildApiUrl('/api/users/pending-requests'), { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (friendsRes.ok) {
        const data = await friendsRes.json();
        setFriends(data.filter(Boolean));
      }
      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setRequests(data.filter(Boolean));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      const res = await fetch(buildApiUrl(`/api/users/accept-request/${requestId}`), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Friend request accepted!');
        fetchData();
        refreshUser();
      }
    } catch (err) {
      toast.error('Failed to accept request');
    }
  };

  const handleReject = async (requestId) => {
    try {
      const res = await fetch(buildApiUrl(`/api/users/reject-request/${requestId}`), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Friend request rejected');
        fetchData();
        refreshUser();
      }
    } catch (err) {
      toast.error('Failed to reject request');
    }
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
        fetchData();
        refreshUser();
      }
    } catch (err) {
      toast.error('Failed to remove friend');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-12">
      
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-black font-outfit text-slate-900 dark:text-white tracking-tight">
          Your Network
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm tracking-wide">
          Manage your connections and pending invitations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Friends List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Users size={16} className="text-brand-500" /> Friends ({friends.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {friends.length > 0 ? (
              friends.map((friend) => (
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
                  
                  {/* Circle Stats Pattern */}
                  <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="bg-slate-50 dark:bg-white/[0.03] p-3 rounded-2xl border border-slate-100 dark:border-white/[0.05] flex flex-col items-center">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Solved</p>
                       <CircularProgress
                          value={friend.leetcodeStats?.matchedUser?.submitStats?.acSubmissionNum?.[0]?.count || 0}
                          max={1000}
                          size={60}
                          strokeWidth={5}
                          color="#f59e0b"
                          label=""
                          noCard={true}
                       />
                    </div>
                    <div className="bg-slate-50 dark:bg-white/[0.03] p-3 rounded-2xl border border-slate-100 dark:border-white/[0.05] flex flex-col items-center">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Rating</p>
                       <CircularProgress
                          value={friend.leetcodeStats?.userContestRanking?.rating ? Math.round(friend.leetcodeStats.userContestRanking.rating) : 0}
                          max={3000}
                          size={60}
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

                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-brand-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))
            ) : !loading && (
              <div className="col-span-full py-16 flex flex-col items-center justify-center glass-card border-dashed">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-white/[0.03] flex items-center justify-center mb-4 text-slate-300">
                  <UserPlus size={32} />
                </div>
                <p className="text-slate-400 font-medium">Build your network to see progress</p>
                <button 
                  onClick={() => navigate('/community')}
                  className="mt-4 text-xs font-black text-brand-500 uppercase tracking-widest hover:underline"
                >
                  Find Friends
                </button>
              </div>
            )}
            {loading && [1,2,3,4].map(i => <div key={i} className="h-32 glass-card animate-pulse" />)}
          </div>
        </div>

        {/* Requests Sidebar */}
        <div className="space-y-6">
          <h2 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-500" /> Pending ({requests.length})
          </h2>

          <div className="space-y-3">
            {requests.length > 0 ? (
              requests.map((req) => (
                <div key={req._id} className="glass-card p-4 hover:border-emerald-500/30 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center text-slate-600 dark:text-slate-200 font-bold border border-slate-200 dark:border-white/[0.08]">
                      {req.from?.name ? req.from.name[0].toUpperCase() : '?'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{req.from?.name || 'Unknown User'}</p>
                      <p className="text-[10px] text-slate-500">{req.from?.email || ''}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAccept(req._id)}
                      className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      <Check size={16} />
                    </button>
                    <button 
                      onClick={() => handleReject(req._id)}
                      className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.05] text-slate-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center glass-card border-dashed">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No new requests</p>
              </div>
            )}
          </div>

          <div className="p-5 rounded-2xl bg-brand-500/5 border border-brand-500/10 space-y-3">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-brand-500" />
              <p className="text-[10px] font-black uppercase text-brand-600 tracking-widest">Connect Globally</p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Adding friends allows you to see their daily progress, streaks, and LeetCode achievements. Competition yields perfection!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
