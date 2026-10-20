import React, { useState } from 'react';
import { 
  Tv, 
  Flame, 
  Calendar, 
  Sparkles, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Check, 
  AlertCircle, 
  Database,
  Film,
  Zap,
  Star
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';

export const WelcomeLoginPage = ({ onContinueGuest }) => {
  const { loginWithEmail, registerWithEmail, loginWithGoogle } = useAuth();
  
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuth = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and password.');
      return;
    }

    if (mode === 'register' && password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email.trim(), password);
        setSuccessMsg('Welcome back! Loading your anime hub...');
      } else {
        await registerWithEmail(email.trim(), password, displayName.trim());
        setSuccessMsg('Account created! Welcome to AniSphere!');
      }

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      // The auth state change in AuthContext will automatically transition to MainLayout
    } catch (err) {
      console.error('Auth error:', err);
      let msg = err.message || 'Authentication failed. Please verify your credentials.';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
        msg = 'Invalid email or password. Please try again or use the demo login.';
      } else if (msg.includes('auth/email-already-in-use')) {
        msg = 'This email is already registered. Please switch to Sign In.';
      } else if (msg.includes('auth/weak-password')) {
        msg = 'Password is too weak. Please use at least 6 characters.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setMode('login');
    setError('');
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between selection:bg-purple-500/30 selection:text-purple-200 bg-[#070913] text-slate-100 overflow-x-hidden">
      {/* Background Liquid Ambient Orbs */}
      <div className="liquid-orb-1" />
      <div className="liquid-orb-2" />

      {/* Top Banner Navigation */}
      <header className="relative z-20 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-[1.5px] shadow-lg shadow-purple-500/25">
            <div className="w-full h-full bg-[#090d1e] rounded-[10px] flex items-center justify-center">
              <span className="font-heading font-black text-transparent bg-clip-text bg-gradient-to-tr from-purple-400 to-cyan-300 text-xl">
                亞
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-xl tracking-tight text-white">
                AniSphere
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                IST Live Hub
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Liquid Glass Anime Watchlist & Live Broadcasts</p>
          </div>
        </div>

        <button
          onClick={onContinueGuest}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all group"
        >
          <span>Explore as Guest</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </header>

      {/* Main Container: Split Guidance & Login Card */}
      <main className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 md:py-12 my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Left Column: Feature Highlights & Value Guidance */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Step 1: Sign in once • Auto-loads automatically every time</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black font-heading tracking-tight text-white leading-tight">
            Your Ultimate Anime Radar & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-300">
              Liquid Watchlist Platform
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
            Login with your email for the first time. Your preferences, watched episodes, and custom watchlist are permanently synchronized with Google Firebase. No need to log in each time you visit!
          </p>

          {/* Highlights feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-purple-500/30 transition-all">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center">
                  <Tv className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-white">Live IST Airing Schedule</h2>
              </div>
              <p className="text-[11px] text-slate-400">
                Weekly broadcast calendar mapped to Indian Standard Time (Asia/Kolkata UTC+5:30).
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-orange-500/30 transition-all">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-300 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-white">Crunchyroll Top 5 & IMDb</h2>
              </div>
              <p className="text-[11px] text-slate-400">
                Live rankings, official trailers, and certified IMDb community scores.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/30 transition-all">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-white">2026 Seasonal Showcase</h2>
              </div>
              <p className="text-[11px] text-slate-400">
                Split by Winter, Spring, Summer, and Fall with comprehensive anime coverage.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 transition-all">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-white">Gemini AI Anime Chatbot</h2>
              </div>
              <p className="text-[11px] text-slate-400">
                Multi-turn intelligent recommender powered by Google Gemini AI with memory.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Google Firebase Email Login / Register Card */}
        <div className="lg:col-span-5">
          <div className="relative rounded-3xl liquid-glass-nav bg-[#0e1329]/90 border border-white/15 p-6 sm:p-8 shadow-2xl shadow-purple-950/50">
            {/* Header Tabs */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black font-heading text-white">
                  {mode === 'login' ? 'Sign In to AniSphere' : 'Create Account'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {mode === 'login' 
                    ? 'Enter your email to unlock your watchlist & profile' 
                    : 'Register with your email to start tracking anime'}
                </p>
              </div>

              <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/10">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    mode === 'login'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(''); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    mode === 'register'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {/* Error & Success Messages */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="flex-1 leading-relaxed">{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="flex-1 leading-relaxed">{successMsg}</span>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleAuth} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Satoru Gojo"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500/60 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500/60 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500/60 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-purple-600/30 border border-white/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Sign In & Enter Dashboard' : 'Create Account & Enter'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Test Accounts */}
            <div className="mt-5 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                <span>1-Click Quick Demo Sign In:</span>
                <span className="text-[10px] text-purple-400 font-mono">Instant Test</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('demo@anisphere.com', 'animefan123')}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors"
                >
                  <p className="text-[11px] font-semibold text-slate-200">Demo User</p>
                  <p className="text-[9px] text-slate-400 font-mono truncate">demo@anisphere.com</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('otaku@anisphere.com', 'animefan123')}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors"
                >
                  <p className="text-[11px] font-semibold text-slate-200">Otaku Fan</p>
                  <p className="text-[9px] text-slate-400 font-mono truncate">otaku@anisphere.com</p>
                </button>
              </div>
            </div>

            {/* Persistence Guarantee Badge */}
            <div className="mt-4 p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20 flex items-center gap-2 text-[10px] text-purple-200">
              <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>
                <strong>Auto-Load Active:</strong> Sign in once and you stay logged in permanently. No repeated logins required!
              </span>
            </div>

            {/* Guest Action */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={onContinueGuest}
                className="text-xs text-slate-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1.5"
              >
                <span>Or explore the anime catalog as Guest</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-[#070913]/90 py-4 px-4 sm:px-6 text-center text-xs text-slate-500">
        AniSphere • Single Localhost: http://localhost:5173 • Live Indian Standard Time (IST) & Firebase Sync
      </footer>
    </div>
  );
};
