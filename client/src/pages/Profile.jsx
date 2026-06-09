import { useState, useRef } from 'react';
import { User, Mail, Globe, Save, RefreshCw, CheckCircle2, AlertCircle, Camera, Upload, Settings, Link } from 'lucide-react';
import { useAuth } from '../store/AuthContext.jsx';
import { buildApiUrl, buildAssetUrl, useStore } from '../store/StoreContext.jsx';
import toast from 'react-hot-toast';

export default function Profile() {
  const { authUser, token, updateAuthUser, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const [lcHandle, setLcHandle] = useState(authUser?.leetcodeUsername || '');
  const [cfHandle, setCfHandle] = useState(authUser?.codeforcesHandle || '');
  const [geminiKey, setGeminiKey] = useState(authUser?.geminiApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [groqKey, setGroqKey] = useState(authUser?.groqApiKey || '');
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [aiModel, setAiModel] = useState(authUser?.preferredAiModel || '');

  const handleUpdateHandles = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl('/api/users/update-handles'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          leetcodeUsername: lcHandle,
          codeforcesHandle: cfHandle,
          geminiApiKey: geminiKey,
          groqApiKey: groqKey,
          preferredAiModel: aiModel,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      updateAuthUser(data.user);
      toast.success('Profile preferences & API Key updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return toast.error('File size must be less than 2MB');
    }

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    try {
      const res = await fetch(buildApiUrl('/api/users/profile-image'), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataUpload
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      await refreshUser();
      toast.success('Profile image updated!');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const { checkGlobalSubmissions, syncAllPlatformStats } = useStore();

  const handleGlobalSync = async () => {
    setSyncing(true);
    try {
      await syncAllPlatformStats();
      await checkGlobalSubmissions();
      toast.success('All platform stats refreshed!');
    } catch (err) {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      
      {/* Profile Banner / Avatar Section */}
      <div className="glass-card p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="relative group">
          <div className="w-32 h-32 rounded-3xl bg-brand-500 flex items-center justify-center text-white text-4xl font-black border-4 border-white dark:border-slate-800 shadow-2xl relative z-10 overflow-hidden">
            {authUser?.profileImage ? (
              <img src={buildAssetUrl(authUser.profileImage)} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              authUser?.name?.[0]?.toUpperCase()
            )}
            {uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                    <RefreshCw className="text-white animate-spin" size={24} />
                </div>
            )}
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-lg hover:bg-brand-700 transition-all z-20 group-hover:scale-110 active:scale-95"
          >
            <Camera size={18} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            className="hidden" 
            accept="image/*"
          />
        </div>

        <div className="text-center md:text-left space-y-2 relative z-10">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {authUser?.name}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2 justify-center md:justify-start">
            <Mail size={14} /> {authUser?.email}
          </p>
          <div className="flex flex-wrap gap-2 pt-2 justify-center md:justify-start">
            <span className="px-3 py-1 rounded-full bg-brand-500/10 text-brand-500 text-[10px] font-black uppercase tracking-wider border border-brand-500/20">Student</span>
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 text-[10px] font-black uppercase tracking-wider border border-slate-200 dark:border-white/10">Active Tracker</span>
          </div>
        </div>

        <div className="absolute -right-20 -top-20 w-80 h-80 bg-brand-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Platform Connections Card */}
          <div className="gradient-glass p-8 space-y-8">
            <h2 className="text-sm font-black text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-white/5 pb-4 uppercase tracking-[0.2em] flex items-center gap-2">
              <Link size={16} className="text-brand-500" /> Platform Connections
            </h2>

            <form onSubmit={handleUpdateHandles} className="space-y-6">
              <p className="text-xs text-slate-400 mb-2">Link your coding profiles to automate tracking.</p>

              <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] group focus-within:border-brand-500/50 transition-all">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">LeetCode Username</label>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
                    <Globe size={16} />
                  </div>
                  <input
                    type="text"
                    value={lcHandle}
                    onChange={(e) => setLcHandle(e.target.value)}
                    placeholder="e.g. leetcode_user"
                    className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] group focus-within:border-brand-500/50 transition-all">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Codeforces Handle</label>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Globe size={16} />
                  </div>
                  <input
                    type="text"
                    value={cfHandle}
                    onChange={(e) => setCfHandle(e.target.value)}
                    placeholder="e.g. tourist"
                    className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-200 dark:border-white/5 pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50"
                >
                  {loading ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Connections
                </button>
              </div>
            </form>
          </div>

          {/* AI Settings Card */}
          <div className="gradient-glass p-8 space-y-8 relative overflow-hidden mt-6 border border-emerald-500/20">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
            <h2 className="text-sm font-black text-emerald-600 dark:text-emerald-400 border-b border-emerald-200 dark:border-emerald-500/20 pb-4 uppercase tracking-[0.2em] flex items-center gap-2 relative z-10">
              <Settings size={16} /> AI Configuration
            </h2>

            <form onSubmit={handleUpdateHandles} className="space-y-6 relative z-10">
              <p className="text-xs text-slate-400 mb-2">Power your problem-solving with custom AI models. Provide your own API keys for unlimited usage.</p>

              <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] group focus-within:border-emerald-500/50 transition-all">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Gemini API Key</label>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Settings size={16} />
                  </div>
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="e.g. AIzaSy..."
                    className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-300"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-xs text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
                  >
                    {showApiKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Provides custom answering capabilities for your profile.</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] group focus-within:border-indigo-500/50 transition-all">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Groq API Key</label>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <Settings size={16} />
                  </div>
                  <input
                    type={showGroqKey ? "text" : "password"}
                    value={groqKey}
                    onChange={(e) => setGroqKey(e.target.value)}
                    placeholder="e.g. gsk_..."
                    className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-300"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowGroqKey(!showGroqKey)}
                    className="text-xs text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                  >
                    {showGroqKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Provides Groq-powered AI capabilities.</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] group focus-within:border-purple-500/50 transition-all">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Preferred AI Model</label>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                    <Settings size={16} />
                  </div>
                  <select
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-900 dark:text-white [&>option]:text-slate-900 cursor-pointer"
                  >
                    <option value="">Default (Gemini Pro/Flash)</option>
                    <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                    <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview</option>
                    <option value="openai/gpt-oss-20b">Groq - openai/gpt-oss-20b</option>
                    <option value="llama3-8b-8192">Groq - llama3-8b-8192</option>
                    <option value="llama3-70b-8192">Groq - llama3-70b-8192</option>
                    <option value="mixtral-8x7b-32768">Groq - mixtral-8x7b</option>
                    <option value="google/gemini-3.1-pro-preview">OpenRouter - Gemini 3.1 Pro</option>
                  </select>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Select the specific model to be used when analyzing solutions. Ensure you have the corresponding API key configured above.</p>
              </div>

              <div className="flex justify-end border-t border-slate-200 dark:border-emerald-500/20 pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {loading ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                  Save AI Config
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sync Center */}
        <div className="space-y-6">
          <div className="gradient-glass p-8 space-y-6">
             <h2 className="text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em]">Platform Status</h2>
             
             <div className="space-y-4">
                {[
                  { label: 'LeetCode', handle: authUser?.leetcodeUsername },
                  { label: 'Codeforces', handle: authUser?.codeforcesHandle },
                ].map((p) => (
                 <div key={p.label} className={`p-4 rounded-2xl border transition-all ${p.handle ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-slate-500/5 border-slate-500/10 opacity-60'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.handle ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-600'}`}>
                           {p.handle ? <CheckCircle2 size={20} /> : < Globe size={20} />}
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">{p.label}</p>
                          <p className={`text-[10px] font-bold ${p.handle ? 'text-emerald-500' : 'text-slate-600'} uppercase`}>{p.handle || 'Not Linked'}</p>
                        </div>
                      </div>
                      {p.handle && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                    </div>
                 </div>
               ))}
             </div>

             <button
               onClick={handleGlobalSync}
               disabled={syncing}
               className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-white/[0.05] hover:bg-brand-500 hover:text-white text-xs font-black text-slate-300 transition-all flex items-center justify-center gap-2 border border-white/[0.08]"
             >
               <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} /> 
               {syncing ? 'Syncing...' : 'Force Global Refresh'}
             </button>
          </div>

          <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 flex gap-4">
            <AlertCircle className="text-amber-500 shrink-0 mt-1" size={18} />
            <p className="text-[10px] leading-relaxed text-amber-500/70 font-bold uppercase tracking-wide">
              Data privacy is key. Only public LeetCode stats are retrieved through our secure proxy bridge.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

