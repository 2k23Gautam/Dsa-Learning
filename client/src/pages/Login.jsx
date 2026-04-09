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
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center p-4 selection:bg-brand-500/20 relative overflow-hidden bg-placement-gradient">
      
      {/* Dynamic Background */}
      <ModernLogoBackground />

      <div className="w-full max-w-md relative z-10">
        
        {/* Placement Ready Badge */}
        <div className="flex justify-center mb-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-bold uppercase tracking-widest">
            <Sparkles size={12} />
            Elevate Your Career
          </div>
        </div>

        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8 animate-fade-in group cursor-pointer">
          <Logo layout="col" title="Placement Prep" highlight="Hub" />
          <p className="text-slate-500 dark:text-slate-400 text-sm text-center max-w-xs">
            Unlock your potential at FAANG and beyond. Track your DSA progress with precision.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 dark:bg-[#090e1a]/80 backdrop-blur-xl border border-white dark:border-white/[0.08] shadow-2xl rounded-3xl p-6 sm:p-10 animate-slide-up relative overflow-hidden group/card">
          
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
              <span className="bg-white dark:bg-[#090e1a] px-2 text-slate-500 tracking-wider font-semibold">Ready to start?</span>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            New aspirant?{' '}
            <Link to="/signup" className="font-bold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Create your profile
            </Link>
          </p>
        </div>

        {/* Footer info */}
        <p className="text-center mt-8 text-xs text-slate-400 dark:text-slate-600 font-medium">
          Top candidates track their progress. Start your journey today.
        </p>
      </div>
    </div>
  );
}
