import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, CheckCircle2, TrendingUp } from 'lucide-react';
import { useAuth } from '../store/AuthContext.jsx';
import { BAR_COLORS } from '../store/data.js';
import { buildApiUrl } from '../store/StoreContext.jsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function FriendProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(buildApiUrl(`/api/users/profile/${id}`), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id, token]);

  if (loading) return <div className="p-12 text-center text-slate-600">Loading profile...</div>;
  if (!data) return <div className="p-12 text-center text-slate-600">User not found</div>;

  const { user, stats, topicProgress } = data;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-600 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold font-outfit text-slate-900 dark:text-white tracking-tight">
            {user.name}'s Progress
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm tracking-wide">
            Viewing public stats for {user.email}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <FriendStatCard label="TOTAL SOLVED" value={stats.solved} colorClass="text-brand-600 dark:text-brand-400" />
        <FriendStatCard label="EASY" value={stats.easy} colorClass="text-emerald-500" />
        <FriendStatCard label="MEDIUM" value={stats.medium} colorClass="text-amber-500" />
        <FriendStatCard label="HARD" value={stats.hard} colorClass="text-rose-500" />
      </div>

      {/* Graph Section */}
      <div className="glass-card p-6 flex flex-col">
        <h2 className="section-title flex items-center gap-2 mb-6">
          <TrendingUp size={18} className="text-brand-500" />
          Topic Mastery
        </h2>
        
        <div className="w-full -ml-4" style={{ height: `${Math.max(300, (topicProgress?.length || 0) * 35 + 60)}px` }}>
          {topicProgress.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicProgress} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148,163,184,0.15)" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="label" axisLine={false} tickLine={false} width={120} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} />
                <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(148,163,184,0.05)' }} />
                <Bar name="Solved" dataKey="solved" stackId="a" fill={BAR_COLORS.solved} />
                <Bar name="Revised" dataKey="revised" stackId="a" fill={BAR_COLORS.revised} />
                <Bar name="Needs Revision" dataKey="needsRevision" stackId="a" fill={BAR_COLORS.needsRevision} />
                <Bar name="Others" dataKey="others" stackId="a" fill={BAR_COLORS.others} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">No data available for this user yet.</div>
          )}
        </div>
      </div>

    </div>
  );
}

function FriendStatCard({ label, value, colorClass }) {
  return (
    <div className="glass-card p-5">
      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 tracking-wider block mb-2">{label}</span>
      <p className={`text-3xl font-bold font-outfit tracking-tight ${colorClass}`}>{value}</p>
    </div>
  );
}

const BarTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/[0.08] shadow-bento px-3 py-2 rounded-lg text-sm min-w-[140px]">
        <span className="text-slate-900 dark:text-white font-bold block mb-2">{data.label}</span>
        <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-col gap-1.5">
          <p className="flex justify-between"><span>Solved:</span> <span className="font-bold">{data.solved}</span></p>
          <p className="flex justify-between"><span>Total Tracked:</span> <span className="font-bold">{data.tracked}</span></p>
        </div>
      </div>
    );
  }
  return null;
};
