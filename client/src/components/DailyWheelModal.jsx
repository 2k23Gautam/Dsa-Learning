import { useState, useEffect, useMemo } from 'react';
import { buildApiUrl, useStore } from '../store/StoreContext.jsx';
import { useAuth } from '../store/AuthContext.jsx';
import { Sparkles, Trophy, Globe, Flame, CheckCircle2 } from 'lucide-react';
import ProblemModal from './ProblemModal.jsx';
import toast from 'react-hot-toast';

const CHALLENGE_TOPICS = [
  'Arrays', 'Strings', 'DP', 'Graphs', 'Trees', 
  'Sorting', 'Hashing', 'Recursion', 'Bit Manipulation', 'Sliding Window',
  'Backtracking', 'Binary Search', 'Linked List', 'Stack', 'Queue',
  'Heaps', 'Trie', 'Greedy', 'Segment Trees', 'Game Theory',
  'Math', 'Geometry', 'Bitmasking', 'Two Pointers'
];

export default function DailyWheelModal({ open, onClose }) {
  const { authUser, token, updateAuthUser } = useAuth();
  const { problems } = useStore();
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [forceNewSpin, setForceNewSpin] = useState(false);

  // Check if challenge is completed
  const todayStr = useMemo(() => new Date().toLocaleDateString('en-CA'), []);
  const challengeState = authUser?.dailyChallenge;
  
  const isUnlocked = useMemo(() => {
    if (!challengeState) return false;
    if (challengeState.date !== todayStr) return false;
    return challengeState.isCompleted;
  }, [challengeState, todayStr]);

  // Sync completion automatically if a problem is locked today
  useEffect(() => {
    if (challengeState && challengeState.date === todayStr && !challengeState.isCompleted && challengeState.topic) {
      const matchingProblem = problems.find(p => {
        const pDate = p.dateSolved || p.solvedDate;
        if (!pDate) return false;
        if (pDate.substring(0, 10) !== todayStr) return false;
        return p.topics?.includes(challengeState.topic);
      });

      if (matchingProblem) {
        completeChallenge();
      }
    }
  }, [problems, challengeState, todayStr]);
  
  // Reset practice trigger when modal closes
  useEffect(() => {
    if (!open) {
      setForceNewSpin(false);
    }
  }, [open]);

  const handleSpin = async () => {
    if (isSpinning || (challengeState?.date === todayStr && !forceNewSpin)) return;

    setIsSpinning(true);
    const randomIndex = Math.floor(Math.random() * CHALLENGE_TOPICS.length);
    const degreesPerItem = 360 / CHALLENGE_TOPICS.length;
    // Spin animation: 4 full turns + target index position
    const extraDegrees = (CHALLENGE_TOPICS.length - randomIndex) * degreesPerItem;
    const totalRotation = rotation + (360 * 4) + extraDegrees;

    setRotation(totalRotation);

    setTimeout(async () => {
      setIsSpinning(false);
      setForceNewSpin(false);
      const chosenTopic = CHALLENGE_TOPICS[randomIndex];
      setSpinResult(chosenTopic);

      try {
        const res = await fetch(buildApiUrl('/api/users/daily-challenge/spin'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ topic: chosenTopic, date: todayStr })
        });
        if (res.ok) {
          const data = await res.json();
          updateAuthUser(data.user);
          toast.success(`Challenge Assigned: ${chosenTopic}`);
        }
      } catch (err) {
        toast.error('Failed to save spin');
      }
    }, 4000); // match transition duration
  };

  const completeChallenge = async () => {
    try {
      const res = await fetch(buildApiUrl('/api/users/daily-challenge/complete'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ date: todayStr })
      });
      if (res.ok) {
        const data = await res.json();
        updateAuthUser(data.user);
        toast.success('Congratulations! Platform Unlocked!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const currentTopic = (!forceNewSpin && challengeState?.topic) || spinResult;

  const modalInitialData = useMemo(() => ({
    topics: currentTopic ? [currentTopic] : []
  }), [currentTopic]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!authUser || !open) return null;

  return (
    <div onClick={handleBackdropClick} className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full p-8 text-center space-y-6 border border-brand-500/20 shadow-2xl relative overflow-hidden">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all z-20">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -z-10" />

        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-3xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 shadow-xl shadow-brand-500/10">
            <Flame size={32} className="animate-pulse" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black font-outfit text-white tracking-tight">Daily Challenge</h1>
          <p className="text-slate-400 text-xs">Solve today's assignment to earn GD points.</p>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl py-2.5 px-4 inline-flex flex-col items-center gap-0.5 mx-auto">
          <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Your Balance</p>
          <p className="text-xl font-black text-brand-400 font-outfit">{authUser?.gdPoints || 0} GD</p>
        </div>

        {!currentTopic ? (
          <div className="space-y-12 pb-8">
            {/* Ultra-Premium Spin Wheel Assembly */}
            <div className="relative w-80 h-80 mx-auto flex items-center justify-center select-none group/wheel-container">
              
              {/* Outer Deep Glow & Decorative Rings */}
              <div className="absolute inset-[-40px] rounded-full bg-brand-500/5 blur-[80px] -z-10 animate-pulse" />
              <div className="absolute inset-[-16px] rounded-full border border-white/5 bg-white/[0.02] shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] -z-10" />
              
              {/* Outer Notches (Stationary) */}
              <div className="absolute inset-[-12px] rounded-full border-2 border-white/5 -z-10 opacity-40">
                {[...Array(48)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`absolute w-0.5 h-2 rounded-full transition-colors duration-500 ${i % 4 === 0 ? 'bg-brand-500/40' : 'bg-white/10'}`}
                    style={{ 
                      top: '50%', left: '50%', 
                      transform: `rotate(${i * 7.5}deg) translate(0, -164px)` 
                    }}
                  />
                ))}
              </div>

              {/* The Spinning Core */}
              <div 
                className="w-full h-full relative"
                style={{ 
                  transform: `rotate(${rotation}deg)`, 
                  transition: 'transform 4.5s cubic-bezier(0.1, 0, 0, 1)'
                }}
              >
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                  <defs>
                    <filter id="inner-glow">
                      <feFlood floodColor="black" floodOpacity="0.5"/>
                      <feComposite in2="SourceGraphic" operator="out"/>
                      <feGaussianBlur stdDeviation="2" result="blur"/>
                      <feComposite operator="atop" in2="SourceGraphic"/>
                    </filter>
                    {CHALLENGE_TOPICS.map((_, i) => (
                      <linearGradient id={`grad-${i}`} key={i} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="white" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="white" stopOpacity="0" />
                      </linearGradient>
                    ))}
                  </defs>

                  {/* Wheel Segments */}
                  {CHALLENGE_TOPICS.map((topic, i) => {
                    const count = CHALLENGE_TOPICS.length;
                    const angle = 360 / count;
                    const startAngle = i * angle;
                    const endAngle = (i + 1) * angle;
                    const x1 = 50 + 50 * Math.cos((Math.PI * (startAngle - 90)) / 180);
                    const y1 = 50 + 50 * Math.sin((Math.PI * (startAngle - 90)) / 180);
                    const x2 = 50 + 50 * Math.cos((Math.PI * (endAngle - 90)) / 180);
                    const y2 = 50 + 50 * Math.sin((Math.PI * (endAngle - 90)) / 180);
                    
                    const COLORS = [
                      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
                      '#06b6d4', '#ec4899', '#f97316', '#14b8a6', '#6366f1'
                    ];
                    const color = COLORS[i % COLORS.length];

                    return (
                      <g key={i} className="group/segment">
                        <path
                          d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                          fill={color}
                          className="opacity-95 dark:opacity-70"
                        />
                        {/* Shimmer Overlay */}
                        <path
                          d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                          fill={`url(#grad-${i})`}
                        />
                        {/* Segment Separator */}
                        <line x1="50" y1="50" x2={x1} y2={y1} stroke="white" strokeOpacity="0.1" strokeWidth="0.2" />

                        {/* Text Label */}
                        <g transform={`rotate(${startAngle + angle / 2} 50 50)`}>
                           <text
                             x="48"
                             y="50"
                             className="fill-white font-outfit font-black uppercase text-[1.4px] tracking-[0.08em]"
                             style={{ dominantBaseline: 'middle', textAnchor: 'end' }}
                           >
                             {topic}
                           </text>
                        </g>
                      </g>
                    );
                  })}
                  
                  {/* Inner Glass Ring Shadow */}
                  <circle cx="50" cy="50" r="49.5" fill="none" stroke="white" strokeOpacity="0.05" strokeWidth="1" />
                </svg>

                {/* Glass Overlayer (Shine) */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 to-transparent pointer-events-none opacity-30" />
              </div>

              {/* Sophisticated Center Module (Stationary) */}
              <div className="absolute z-40">
                {/* Multi-layered Backglow */}
                <div className="absolute inset-[-20px] rounded-full bg-brand-500/20 blur-2xl animate-pulse" />
                
                <button 
                  onClick={handleSpin}
                  disabled={isSpinning}
                  className={`relative w-28 h-28 rounded-full bg-slate-900 border-[1px] border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.1)] flex flex-col items-center justify-center transition-all duration-500 ${isSpinning ? 'scale-90 opacity-90' : 'hover:scale-105 active:scale-95 group'}`}
                >
                  {/* Button Content */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/[0.08] to-transparent" />
                  
                  <div className="text-[10px] font-black text-brand-400 uppercase tracking-[0.4em] mb-1 group-hover:text-brand-300 transition-colors">
                    {isSpinning ? 'SPINNING' : 'COMMAND'}
                  </div>
                  <div className="text-2xl font-black text-white font-outfit tracking-tighter">
                    {isSpinning ? '...' : 'SPIN'}
                  </div>
                  
                  {/* Glowing Orbit */}
                  {!isSpinning && (
                    <div className="absolute inset-[-8px] rounded-full border border-brand-500/20 animate-[spin_10s_linear_infinite]" />
                  )}
                  {isSpinning && (
                    <div className="absolute inset-[-4px] rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
                  )}
                </button>
              </div>

              {/* The "Blade" Pointer (Stationary top) */}
              <div className="absolute top-[-32px] z-50">
                 <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-white shadow-[0_10px_30px_rgba(59,130,246,0.4)] rotate-45 rounded-[6px] border-[6px] border-slate-950 relative overflow-hidden flex items-center justify-center">
                       <div className="absolute inset-0 bg-brand-500 opacity-20" />
                       <div className="w-2 h-2 bg-brand-500 rounded-full shadow-[0_0_15px_#3b82f6] animate-pulse" />
                    </div>
                    {/* Visual Connector Tip */}
                    <div className="w-0.5 h-6 bg-gradient-to-b from-brand-500 to-transparent -mt-2" />
                 </div>
              </div>

            </div>

            <div className="space-y-4">
               <div className="flex items-center justify-center gap-2">
                 <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-white/10" />
                 <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Initialize Draw</span>
                 <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-white/10" />
               </div>
            </div>
          </div>
        ) : challengeState?.isCompleted && !forceNewSpin ? (
          <div className="space-y-6 pt-4 animate-fadeIn">
             <div className="flex justify-center">
               <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-500/10">
                 <CheckCircle2 size={32} strokeWidth={2.5} />
               </div>
             </div>
             <div>
               <p className="text-emerald-400 font-black text-xl font-outfit">Today's Topic Cleared!</p>
               <p className="text-slate-400 text-[10px] mt-1">Solved <span className="text-white font-bold">{currentTopic}</span> successfully.</p>
             </div>

             <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3 text-center">
               <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Solution Authenticated</p>
               <p className="font-black text-emerald-400 text-xs mt-0.5">+1 GD Point Awarded</p>
             </div>

             <button 
               onClick={() => {
                 setForceNewSpin(true);
                 setSpinResult(null);
               }}
               className="px-5 py-3 rounded-2xl bg-white/5 text-white font-black text-xs uppercase tracking-widest shadow-lg hover:bg-white/10 transition-all w-full flex items-center justify-center gap-2 border border-white/5"
             >
               Spin Again for Practice <Sparkles size={14} />
             </button>
          </div>
        ) : (
          <div className="space-y-6 pt-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Selected Topic</p>
            <div className="inline-block px-5 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-lg tracking-tight">
              {currentTopic}
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-left">
              <p className="text-xs text-slate-300 leading-relaxed">
                1. Solve any problem containing the topic <span className="font-bold text-emerald-400">"{currentTopic}"</span> today on any platform.
              </p>
              <p className="text-xs text-slate-300 leading-relaxed mt-2">
                2. Use the <span className="font-bold text-brand-400">Log Problem</span> button below to save it with AI suggestions.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setLogModalOpen(true)}
                className="px-4 py-3 rounded-xl bg-brand-500 text-white font-bold text-xs uppercase tracking-widest hover:bg-brand-600 transition-all flex items-center justify-center gap-2"
              >
                Log Problem
              </button>
              <button 
                onClick={() => {
                  window.open('https://leetcode.com/problemset/all/', '_blank');
                }}
                className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/[0.05] text-slate-300 font-bold text-xs uppercase tracking-widest hover:bg-white/[0.1] transition-all flex items-center justify-center gap-2 border border-transparent hover:border-white/10"
              >
                Go Solve <Globe size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ProblemModal 
        open={logModalOpen} 
        onClose={() => setLogModalOpen(false)} 
        initialData={modalInitialData} 
      />
    </div>
  );
}
