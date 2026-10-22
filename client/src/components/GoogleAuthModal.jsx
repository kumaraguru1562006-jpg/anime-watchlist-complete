import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle,
  Settings,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  initGoogleIdentity, 
  renderGoogleButton, 
  triggerGooglePopup, 
  getGoogleClientId, 
  setGoogleClientId 
} from '../services/googleAuth';

export const GoogleAuthModal = () => {
  const { isAuthModalOpen, closeAuthModal, loginWithGoogle } = useAuth();
  
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfig, setShowConfig] = useState(!getGoogleClientId());
  const [clientIdInput, setClientIdInput] = useState(getGoogleClientId());

  const activeClientId = getGoogleClientId();

  useEffect(() => {
    if (isAuthModalOpen && activeClientId) {
      initGoogleIdentity(activeClientId, async (userData) => {
        setGoogleLoading(true);
        try {
          await loginWithGoogle(userData);
          closeAuthModal();
        } catch (err) {
          setError(err.message || 'Google login failed');
        } finally {
          setGoogleLoading(false);
        }
      });
      setTimeout(() => {
        renderGoogleButton('googleBtnContainerModal', { width: 320 });
      }, 150);
    }
  }, [isAuthModalOpen, activeClientId]);

  const handleGoogleSignIn = () => {
    setError('');
    const id = getGoogleClientId();
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
          closeAuthModal();
        } catch (err) {
          setError(err.message || 'Google sign-in failed');
        } finally {
          setGoogleLoading(false);
        }
      },
      (err) => {
        setGoogleLoading(false);
        if (err.message === 'NO_CLIENT_ID') {
          setShowConfig(true);
        } else {
          setError(err.message || 'Google authentication was cancelled.');
        }
      }
    );
  };

  const handleSaveClientId = (e) => {
    e.preventDefault();
    const cleanId = clientIdInput.trim();
    if (!cleanId || !cleanId.includes('.apps.googleusercontent.com')) {
      setError('Invalid format! Must end with .apps.googleusercontent.com');
      return;
    }
    setGoogleClientId(cleanId);
    setShowConfig(false);
    setError('');
    handleGoogleSignIn();
  };

  if (!isAuthModalOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={closeAuthModal}
    >
      <div 
        className="relative w-full max-w-md liquid-glass-nav bg-[#0e1329]/95 rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/20 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow lights inside modal */}
        <div className="absolute -top-16 -left-16 w-36 h-36 rounded-full bg-purple-500/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 rounded-full bg-cyan-500/20 blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          title="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-cyan-500/30 border border-white/15 mb-3 shadow-lg">
            <svg className="w-7 h-7" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-white">
            Sign In with Google
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
            Log in exclusively with your verified Google / Gmail account to sync your watchlist to MongoDB.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* PRIMARY: Google Sign-In */}
        <div className="space-y-3 mb-5">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2.5 border border-slate-200 active:scale-[0.99] disabled:opacity-60"
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-slate-400 border-t-purple-600 rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            )}
            <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google (Gmail)'}</span>
          </button>

          <div id="googleBtnContainerModal" className="flex justify-center empty:hidden" />
        </div>

        {/* Config Toggle */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            MongoDB Cloud Auth
          </span>
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
          >
            <Settings className="w-3 h-3" />
            {showConfig ? 'Hide Settings' : 'Configure Google ID'}
          </button>
        </div>

        {/* Client ID Config */}
        {showConfig && (
          <form onSubmit={handleSaveClientId} className="mt-3 pt-3 border-t border-white/10 space-y-2.5">
            <label className="block text-[11px] font-semibold text-slate-300">
              Google Cloud OAuth Client ID:
            </label>
            <input
              type="text"
              required
              value={clientIdInput}
              onChange={(e) => setClientIdInput(e.target.value)}
              placeholder="xxxx.apps.googleusercontent.com"
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
            />
            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md transition-all"
            >
              Save & Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
};