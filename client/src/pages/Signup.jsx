import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, ArrowRight, Sparkles, User, Mail, Lock, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../store/AuthContext.jsx';
import toast from 'react-hot-toast';
import ModernLogoBackground from '../components/ModernLogoBackground.jsx';
import Logo from '../components/Logo.jsx';

function PasswordStrengthBar({ password }) {
  const checks = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Contains a letter', ok: /[a-zA-Z]/.test(password) },
    { label: 'Contains a number', ok: /\d/.test(password) },
  ];
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1">
      {checks.map(c => (
        <div key={c.label} className="flex items-center gap-1.5">
          {c.ok
            ? <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
            : <XCircle size={11} className="text-rose-400 shrink-0" />}
          <span className={`text-[10px] font-semibold ${c.ok ? 'text-emerald-500' : 'text-slate-400'}`}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { signup } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!name.trim() || name.trim().length < 2)
      errs.name = 'Name must be at least 2 characters';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = 'Please enter a valid email address';
    if (!password || password.length < 8)
      errs.password = 'Password must be at least 8 characters';
    else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password))
      errs.password = 'Password must contain at least one letter and one number';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const res = await signup(name.trim(), email.toLowerCase(), password);

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Account created successfully!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Signup submit failed:', error);
      toast.error('Signup failed. Please try again.');
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
              Begin your path to <br />
              <span className="bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">technical mastery.</span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              Track custom solve durations, save multiple optimized solutions, and receive automated analytics on your active study logs.
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
                {`// Your progress milestone tracker\nconst targetMilestone = {\n  solved: 500,\n  daysRemaining: 30,\n  targetStatus: "On Target"\n};\n\nif (targetMilestone.targetStatus === "On Target") {\n  console.log("Ready to excel!");\n}`}
              </code>
            </pre>
          </div>
        </div>

        {/* Testimonial / Footer */}
        <div className="relative z-10">
          <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">
            Start tracking today. Build your profile.
          </p>
        </div>
      </div>

      {/* Right Pane - Form Card */}
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
              Join the Elite
            </div>
          </div>

          {/* Logo on Mobile */}
          <div className="flex flex-col items-center mb-8 animate-fade-in group cursor-pointer lg:hidden">
            <Logo layout="col" title="DSA" highlight="Tracker" />
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center max-w-xs mt-2">
              Start your journey today. Build your profile and track every milestone.
            </p>
          </div>

          <div className="lg:mb-6 hidden lg:block">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={11} /> Onboarding
            </span>
            <h1 className="text-3xl font-extrabold font-outfit text-slate-900 dark:text-white mt-3">Create your workspace</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Set up your profile to start tracking solves.</p>
          </div>

          {/* Signup Card Container */}
          <div className="bg-white/80 dark:bg-[#090e1a]/85 backdrop-blur-xl border border-white dark:border-white/[0.08] shadow-2xl rounded-3xl p-6 sm:p-10 animate-slide-up relative overflow-hidden group/card">
            
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-50" />
            
            <form onSubmit={handleSubmit} className="space-y-4 relative z-10" noValidate>
              
              {/* Name */}
              <div className="space-y-1.5">
                <label className="label ml-1">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    className={`input-field pl-10 h-11 ${errors.name ? 'border-rose-400 dark:border-rose-500/60' : ''}`}
                    placeholder="Future Engineer"
                    value={name}
                    onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(p => ({...p, name: ''})); }}
                  />
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                {errors.name && <p className="text-[11px] text-rose-500 font-semibold ml-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="label ml-1">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    className={`input-field pl-10 h-11 ${errors.email ? 'border-rose-400 dark:border-rose-500/60' : ''}`}
                    placeholder="name@dreamcompany.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(p => ({...p, email: ''})); }}
                  />
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                {errors.email && <p className="text-[11px] text-rose-500 font-semibold ml-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="label ml-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`input-field pl-10 pr-10 h-11 ${errors.password ? 'border-rose-400 dark:border-rose-500/60' : ''}`}
                    placeholder="Min. 8 chars with a number"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(p => ({...p, password: ''})); }}
                  />
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-[11px] text-rose-500 font-semibold ml-1">{errors.password}</p>}
                <PasswordStrengthBar password={password} />
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
                      <UserPlus size={20} />
                      Begin Journey
                      <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </form>

            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-200 dark:border-white/[0.08]"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-[#090e1a] px-2 text-slate-500 tracking-wider font-semibold">Registered?</span>
              </div>
            </div>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                Sign in to workspace
              </Link>
            </p>
          </div>

          {/* Footer info */}
          <p className="text-center mt-6 text-xs text-slate-400 dark:text-slate-600 font-medium">
            Join candidates preparing for world's top tech companies.
          </p>
        </div>
      </div>
    </div>
  );
}
