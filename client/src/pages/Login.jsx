import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, ArrowRight, Sparkles, Building2, Target } from 'lucide-react';
import { useAuth } from '../store/AuthContext.jsx';
import toast from 'react-hot-toast';
import ModernLogoBackground from '../components/ModernLogoBackground.jsx';
import Logo from '../components/Logo.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await login(email, password);

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login submit failed:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex relative overflow-hidden selection:bg-brand-500/20">
      
      {/* Left Pane - Brand Promo (desktop only) */}
      <div className="relative hidden lg:flex flex-col justify-between w-1/2 p-16 bg-[#030712] border-r border-white/[0.04] overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full bg-brand-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
        
        {/* Logo */}
        <div className="relative z-10">
          <Logo layout="row" title="DSA" highlight="Tracker" />
        </div>

        {/* Feature showcase */}
        <div className="relative z-10 space-y-8 my-auto max-w-lg">
          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold font-outfit text-white tracking-tight leading-tight">
              Master the coding interview. <br />
              <span className="bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">Track progress with precision.</span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              Consolidate your LeetCode, GFG, and Codeforces solves, maintain study streaks, and structure approaches all in one workspace.
            </p>
          </div>

          {/* Floating Glass Code Card */}
          <div className="gradient-glass p-5 border-white/10 dark:border-white/[0.08] backdrop-blur-xl relative shadow-2xl shadow-brand-500/5 max-w-sm rounded-2xl select-none">
            <div className="flex gap-1.5 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <pre className="text-xs font-mono text-slate-300">
              <code>
                {`const candidate = {\n  solved: 345,\n  accuracy: "78.4%",\n  streak: "14 days",\n  target: "FAANG Hub"\n};\n\n// Keep pushing forward!\nconsole.log(candidate.streak);`}
              </code>
            </pre>
          </div>
        </div>

        {/* Testimonial / Footer */}
        <div className="relative z-10">
          <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">
            Designed for software engineers.
          </p>
        </div>
      </div>

      {/* Right Pane - Form Card (mobile full-width, desktop centered right) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-placement-gradient">
        
        {/* Dynamic Background on Mobile */}
        <div className="lg:hidden absolute inset-0 z-0">
          <ModernLogoBackground />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Badge */}
          <div className="flex justify-center mb-6 animate-fade-in lg:hidden">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-bold uppercase tracking-widest">
              <Sparkles size={12} />
              Elevate Your Career
            </div>
          </div>

          {/* Logo on Mobile */}
          <div className="flex flex-col items-center mb-8 animate-fade-in group cursor-pointer lg:hidden">
            <Logo layout="col" title="DSA" highlight="Tracker" />
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center max-w-xs mt-2">
              Track your coding problems, schedule revisions, and achieve your career goals.
            </p>
          </div>

          <div className="lg:mb-6 hidden lg:block">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={11} /> Welcome back
            </span>
            <h1 className="text-3xl font-extrabold font-outfit text-slate-900 dark:text-white mt-3">Sign in to workspace</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Enter your details to access your dashboard.</p>
          </div>

          {/* Login Card Container */}
          <div className="bg-white/80 dark:bg-[#090e1a]/85 backdrop-blur-xl border border-white dark:border-white/[0.08] shadow-2xl rounded-3xl p-6 sm:p-10 animate-slide-up relative overflow-hidden group/card">
            
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-50" />
            
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              
              <div className="space-y-2">
                <label className="label ml-1">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    className="input-field pl-10 h-11"
                    placeholder="name@dreamcompany.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Target size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="label !mb-0">Password</label>
                  <a href="#" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                    Forgot?
                  </a>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    required
                    className="input-field pl-10 h-11"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:shadow-lg hover:shadow-brand-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 group/btn relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-indigo-600 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn size={20} />
                      Enter Workspace
                      <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </form>

            <div className="relative mt-8">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-200 dark:border-white/[0.08]"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-[#090e1a] px-2 text-slate-500 tracking-wider font-semibold">New here?</span>
              </div>
            </div>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
              New aspirant?{' '}
              <Link to="/signup" className="font-bold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                Create an account
              </Link>
            </p>
          </div>

          {/* Footer info */}
          <p className="text-center mt-8 text-xs text-slate-400 dark:text-slate-600 font-medium">
            Top candidates track their progress. Start your journey today.
          </p>
        </div>
      </div>
    </div>
  );
}
