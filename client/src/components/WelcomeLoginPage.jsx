import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Flame, 
  Calendar, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Check, 
  AlertCircle, 
  Zap,
  Settings,
  HelpCircle,
  ExternalLink,
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
  const { loginWithGoogle } = useAuth();
  
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Configuration state for Google Cloud OAuth Web Client ID
  const [clientIdInput, setClientIdInput] = useState(getGoogleClientId());
  const [showConfig, setShowConfig] = useState(!getGoogleClientId());

  const activeClientId = getGoogleClientId();

  // Initialize official Google Identity Services button on mount
  useEffect(() => {
    if (activeClientId) {
      const initialized = initGoogleIdentity(activeClientId, async (userData) => {
        setGoogleLoading(true);
        setError('');
        try {
          await loginWithGoogle(userData);
          setSuccessMsg('Welcome! Signed in with Google account.');
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
  }, [activeClientId]);

  const handleGoogleClick = () => {
    setError('');
    const id = getGoogleClientId();

    // Validate client ID format (must end with apps.googleusercontent.com)
    if (!id || !id.includes('.apps.googleusercontent.com')) {
      setShowConfig(true);
      setError('Please provide your Google Cloud OAuth Web Client ID (ends with .apps.googleusercontent.com).');
      return;
    }

    setGoogleLoading(true);
    triggerGooglePopup(
      id,
      async (googleUserData) => {
        try {
          await loginWithGoogle(googleUserData);
          setSuccessMsg('Welcome! Signed in with your verified Gmail account.');
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
          setShowConfig(true);
        } else {
          setError(err.message || 'Google Sign-In failed or was closed.');
        }
      }
    );
  };

  const handleSaveClientId = (e) => {
    e.preventDefault();
    const cleanId = clientIdInput.trim();
    if (!cleanId) {
      setError('Please enter a Google Cloud OAuth Client ID.');
      return;
    }

    if (!cleanId.includes('.apps.googleusercontent.com')) {
      setError('Invalid Client ID format! A Google OAuth Client ID must look like: 1234567890-xxxx.apps.googleusercontent.com (not a project name).');
      return;
    }

    setGoogleClientId(cleanId);
    setShowConfig(false);
    setError('');
    setSuccessMsg('Google Client ID saved! Connecting to Google...');

    setTimeout(() => {
      initGoogleIdentity(cleanId, async (userData) => {
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

  return (
    <div className="relative min-h-screen flex flex-col justify-between selection:bg-purple-500/30 selection:text-purple-200 bg-[#070913] text-slate-100 overflow-x-hidden">
      {/* Background Ambient Orbs */}
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

      {/* Main Container */}
      <main className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 md:py-12 my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Left Column: Feature Highlights */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Official Google Sign-In • Permanent Cloud Watchlist Sync</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black font-heading tracking-tight text-white leading-tight">
            Your Ultimate Anime Radar & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-300">
              Liquid Watchlist Platform
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
            Log in exclusively with your verified Google / Gmail account. Your watchlist, watched episodes, and ratings are automatically backed up to MongoDB.
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

        {/* Right Column: Google Sign-In Card */}
        <div className="lg:col-span-5">
          <div className="relative rounded-3xl liquid-glass-nav bg-[#0e1329]/95 border border-white/15 p-6 sm:p-8 shadow-2xl shadow-purple-950/50">
            
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-cyan-500/30 border border-white/15 mb-3 shadow-lg">
                <svg className="w-7 h-7" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black font-heading text-white">
                Sign In with Google
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                Only authentic Google / Gmail accounts are supported for verified personal synchronization.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="flex-1 leading-relaxed">{error}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="flex-1 leading-relaxed">{successMsg}</span>
              </div>
            )}

            {/* Google Action Button */}
            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={googleLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 border border-slate-200 group active:scale-[0.98] disabled:opacity-60"
              >
                {googleLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-purple-600 rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                <span>
                  {googleLoading ? 'Connecting with Google...' : 'Continue with Google (Gmail)'}
                </span>
              </button>

              {/* Native Google Identity rendered button */}
              <div id="googleBtnContainerWelcome" className="flex justify-center empty:hidden" />
            </div>

            {/* Google OAuth Setup / Status Panel */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Google OAuth Status
                </span>
                <button
                  type="button"
                  onClick={() => setShowConfig(!showConfig)}
                  className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 text-[11px]"
                >
                  <Settings className="w-3.5 h-3.5" />
                  {showConfig ? 'Hide Settings' : 'Configure Client ID'}
                </button>
              </div>

              {showConfig ? (
                <form onSubmit={handleSaveClientId} className="space-y-3 pt-2 border-t border-white/10">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Paste your <strong>Google OAuth Web Client ID</strong> from Google Cloud Console:
                  </p>
                  <input
                    type="text"
                    required
                    placeholder="xxxx.apps.googleusercontent.com"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white placeholder-slate-500 font-mono focus:border-purple-500 focus:outline-none"
                  />
                  <div className="p-2.5 rounded-xl bg-purple-950/50 border border-purple-500/20 text-[10px] text-purple-200 space-y-1">
                    <p className="font-semibold text-purple-100">How to get a Client ID (60 seconds):</p>
                    <p>1. Open <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline font-semibold">Google Cloud Credentials</a></p>
                    <p>2. Create Credentials &rarr; <strong>OAuth client ID</strong> &rarr; <strong>Web application</strong></p>
                    <p>3. In Authorized JavaScript Origins, add:</p>
                    <code className="block bg-black/60 p-1.5 rounded text-[10px] text-cyan-300 font-mono">
                      https://anime-watchlist-complete.vercel.app<br />
                      http://localhost:5173
                    </code>
                    <p>4. Copy the Client ID ending with <code>.apps.googleusercontent.com</code></p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg transition-all"
                  >
                    Save & Activate Google Sign-In
                  </button>
                </form>
              ) : (
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {activeClientId ? (
                    <span className="text-emerald-400">
                      ✓ Google Client ID configured ({activeClientId.slice(0, 16)}...)
                    </span>
                  ) : (
                    <span>Click "Configure Client ID" to connect your Google Cloud OAuth project.</span>
                  )}
                </p>
              )}
            </div>

            {/* Guest Action */}
            <div className="mt-5 text-center">
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
        AniCart • Official Google OAuth • MongoDB Cloud Database
      </footer>
    </div>
  );
};