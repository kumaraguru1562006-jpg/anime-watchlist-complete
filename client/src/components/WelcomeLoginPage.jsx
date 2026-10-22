import React, { useState, useEffect } from 'react';
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
  Star,
  Settings,
  HelpCircle,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { 
  initGoogleIdentity, 
  renderGoogleButton, 
  triggerGooglePopup, 
  getGoogleClientId, 
  setGoogleClientId 
} from '../services/googleAuth';

export const WelcomeLoginPage = ({ onContinueGuest }) => {
  const { loginWithEmail, registerWithEmail, loginWithGoogle } = useAuth();
  
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal for configuring Google Cloud OAuth Client ID
  const [showClientIdModal, setShowClientIdModal] = useState(false);
  const [clientIdInput, setClientIdInput] = useState(getGoogleClientId());

  // Initialize official Google Identity Services button on mount
  useEffect(() => {
    const activeClientId = getGoogleClientId();
    if (activeClientId) {
      const initialized = initGoogleIdentity(activeClientId, async (userData) => {
        setGoogleLoading(true);
        setError('');
        try {
          await loginWithGoogle(userData);
          setSuccessMsg('Welcome back! Signed in with Google.');
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } catch (err) {
          setError(err.message || 'Google authentication failed.');
        } finally {
          setGoogleLoading(false);
        }
      });

      if (initialized) {
        setTimeout(() => {
          renderGoogleButton('googleBtnContainerWelcome', { width: 340 });
        }, 200);
      }
    }
  }, []);

  const handleGoogleClick = () => {
    setError('');
    const activeClientId = getGoogleClientId();
    if (!activeClientId) {
      setShowClientIdModal(true);
      return;
    }

    setGoogleLoading(true);
    triggerGooglePopup(
      activeClientId,
      async (googleUserData) => {
        try {
          await loginWithGoogle(googleUserData);
          setSuccessMsg('Welcome! Signed in with Google account.');
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } catch (err) {
          setError(err.message || 'Google authentication failed.');
        } finally {
          setGoogleLoading(false);
        }
      },
      (err) => {
        setGoogleLoading(false);
        if (err.message === 'NO_CLIENT_ID') {
          setShowClientIdModal(true);
        } else {
          setError(err.message || 'Google Sign-In failed or was closed.');
        }
      }
    );
  };

  const handleSaveClientId = (e) => {
    e.preventDefault();
    if (!clientIdInput.trim()) {
      setError('Please provide a valid Google Cloud Client ID.');
      return;
    }
    setGoogleClientId(clientIdInput.trim());
    setShowClientIdModal(false);
    setError('');
    setSuccessMsg('Google Client ID saved! Initializing Google Sign-In...');

    setTimeout(() => {
      initGoogleIdentity(clientIdInput.trim(), async (userData) => {
        setGoogleLoading(true);
        try {
          await loginWithGoogle(userData);
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } catch (err) {
          setError(err.message || 'Google authentication failed.');
        } finally {
          setGoogleLoading(false);
        }
      });
      renderGoogleButton('googleBtnContainerWelcome', { width: 340 });
      handleGoogleClick();
    }, 300);
  };

  const handleAuth = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim() || !password.trim()) {
      setError('Please provide both your email address and password.');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
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
        setSuccessMsg('Account created successfully! Welcome to AniCart!');
      }

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed. Please verify your credentials.');
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
                AniCart
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
            <span>Sign in once • Stay permanently synchronized across devices</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black font-heading tracking-tight text-white leading-tight">
            Your Ultimate Anime Radar & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-300">
              Liquid Watchlist Platform
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
            Log in securely with your Google / Gmail account or email. Your watchlist, watched episodes, and custom ratings are backed up directly to MongoDB.
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
                <h2 className="text-xs font-bold text-white">Top Monthly Anime & IMDb</h2>
              </div>
              <p className="text-[11px] text-slate-400">
                Live rankings, official trailers, and certified community ratings.
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
                All 4 seasons with batch-dropped ONAs (like Cyberpunk 2) and TV series.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 transition-all">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-white">AniChat AI Recommender</h2>
              </div>
              <p className="text-[11px] text-slate-400">
                Personalized AI assistant powered by Google Gemini with live web grounding.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Google & Email Authentication Card */}
        <div className="lg:col-span-5">
          <div className="relative rounded-3xl liquid-glass-nav bg-[#0e1329]/90 border border-white/15 p-6 sm:p-8 shadow-2xl shadow-purple-950/50">
            
            {/* Header Tabs */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-black font-heading text-white">
                  {mode === 'login' ? 'Welcome to AniCart' : 'Create Free Account'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {mode === 'login' 
                    ? 'Sign in to access your synchronized watchlist' 
                    : 'Register to start tracking your anime progress'}
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

            {/* PRIMARY: Google Official Sign-In Button */}
            <div className="space-y-2 mb-5">
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={loading || googleLoading}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 border border-slate-200 group active:scale-[0.99] disabled:opacity-60"
              >
                {googleLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-purple-600 rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>
                  {googleLoading ? 'Connecting to Google...' : 'Continue with Google (Gmail)'}
                </span>
              </button>

              {/* Native Google Identity rendered button container */}
              <div id="googleBtnContainerWelcome" className="flex justify-center empty:hidden" />

              <div className="flex items-center justify-between px-1 text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Official Google OAuth
                </span>
                <button
                  type="button"
                  onClick={() => setShowClientIdModal(true)}
                  className="hover:text-purple-300 transition-colors flex items-center gap-1"
                >
                  <Settings className="w-3 h-3" />
                  Configure Google ID
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-[#0e1329] px-3 text-[10px] text-slate-400 uppercase tracking-wider font-mono absolute">
                Or with Email & Password
              </span>
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleAuth} className="space-y-3.5">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="At least 6 characters"
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
                disabled={loading || googleLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-purple-600/30 border border-white/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Sign In' : 'Create My Account'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Test Logins */}
            <div className="mt-4 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                <span>1-Click Test Accounts:</span>
                <span className="text-[10px] text-purple-400 font-mono">Instant Preview</span>
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

      {/* Google Client ID Configuration Modal */}
      {showClientIdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md liquid-glass-nav bg-[#0e1329] rounded-2xl p-6 border border-white/20 shadow-2xl">
            <button
              onClick={() => setShowClientIdModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                <Settings className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">Google OAuth Client ID</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              To enable authentic Google / Gmail sign-in with your Google Cloud account, paste your Web OAuth Client ID below:
            </p>

            <form onSubmit={handleSaveClientId} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Google Client ID (e.g. 12345...apps.googleusercontent.com)
                </label>
                <input
                  type="text"
                  required
                  placeholder="xxxx.apps.googleusercontent.com"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/20 text-xs text-white placeholder-slate-500 font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-[11px] text-purple-200 space-y-1">
                <p className="font-semibold text-purple-100">Quick Setup Instructions:</p>
                <p>1. Open Google Cloud Console: <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline">Credentials</a></p>
                <p>2. Create OAuth Client ID &rarr; Web Application</p>
                <p>3. Add Authorized Origins:</p>
                <code className="block bg-black/50 p-1.5 rounded text-[10px] text-cyan-300 font-mono">
                  https://anime-watchlist-complete.vercel.app<br />
                  http://localhost:5173
                </code>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClientIdModal(false)}
                  className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg"
                >
                  Save & Connect Google
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-[#070913]/90 py-4 px-4 sm:px-6 text-center text-xs text-slate-500">
        AniCart • Live Indian Standard Time (IST) • MongoDB Cloud Database
      </footer>
    </div>
  );
};