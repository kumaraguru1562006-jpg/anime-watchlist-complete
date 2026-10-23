import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  UserCheck, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GoogleAccountChooserModal } from './GoogleAccountChooserModal';

export const GoogleAuthModal = () => {
  const { isAuthModalOpen, closeAuthModal, loginWithEmail, registerWithEmail } = useAuth();
  
  // Auth mode: 'login' | 'signup'
  const [authMode, setAuthMode] = useState('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAccountChooser, setShowAccountChooser] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address');
      return;
    }
    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (authMode === 'signup') {
        await registerWithEmail(email, password, displayName);
      } else {
        await loginWithEmail(email, password);
      }
      closeAuthModal();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthModalOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
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
        <div className="text-center mb-5">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-cyan-500/30 border border-white/15 mb-2.5 shadow-lg">
            <User className="w-6 h-6 text-purple-300" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-white">
            {authMode === 'login' ? 'Sign In to AniCart' : 'Create Free Account'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Log in with your email and password to sync your watchlist to MongoDB.
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="flex rounded-xl bg-black/40 p-1 border border-white/10 mb-4">
          <button
            type="button"
            onClick={() => { setAuthMode('login'); setError(''); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              authMode === 'login'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('signup'); setError(''); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              authMode === 'signup'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {authMode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Your Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Satoru Gojo"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 focus:outline-none text-xs text-white placeholder-slate-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                placeholder="yourname@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 focus:outline-none text-xs text-white placeholder-slate-500 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 4 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-9 py-2 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 focus:outline-none text-xs text-white placeholder-slate-500 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 font-semibold text-xs text-white shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>{authMode === 'login' ? 'Sign In & Enter' : 'Create Account'}</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-3.5 flex items-center justify-center">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-[#0e1329] px-2.5 text-[10px] text-slate-400 uppercase tracking-wider font-mono absolute">
            Or
          </span>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={() => setShowAccountChooser(true)}
          className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 border border-slate-200"
        >
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Google Account Chooser Modal */}
        <GoogleAccountChooserModal
          isOpen={showAccountChooser}
          onClose={() => setShowAccountChooser(false)}
          onCustomSuccess={() => closeAuthModal()}
        />

        {/* Security Footer */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>MongoDB Cloud Database • Persistent User Session</span>
        </div>
      </div>
    </div>
  );
};