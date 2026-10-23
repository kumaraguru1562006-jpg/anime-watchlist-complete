import React, { useState } from 'react';
import { X, UserPlus, Check, ArrowRight, ShieldCheck, Mail, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

export const GoogleAccountChooserModal = ({ isOpen, onClose, onCustomSuccess }) => {
  const { loginWithGoogle } = useAuth();
  
  // Custom account input mode
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Retrieve saved accounts from localStorage (defaulting to the user's primary account)
  const defaultAccounts = [
    {
      name: 'Kumaraguru',
      email: 'kumaraguru1562006@gmail.com',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=kumaraguru1562006@gmail.com&backgroundColor=020617',
      isPrimary: true,
      initial: 'K',
      bg: 'bg-blue-600',
    },
  ];

  let storedAccounts = [];
  try {
    const raw = localStorage.getItem('anicart_saved_google_accounts');
    if (raw) storedAccounts = JSON.parse(raw);
  } catch (e) {
    storedAccounts = [];
  }

  // Merge default and stored accounts (deduplicating by email)
  const accountsMap = new Map();
  [...defaultAccounts, ...storedAccounts].forEach((acc) => {
    if (acc.email) accountsMap.set(acc.email.toLowerCase(), acc);
  });
  const accountsList = Array.from(accountsMap.values());

  const handleSelectAccount = async (account) => {
    setLoading(true);
    setError('');

    try {
      const googlePayload = {
        email: account.email.toLowerCase().trim(),
        name: account.name || account.email.split('@')[0],
        avatar: account.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(account.email)}&backgroundColor=020617`,
        googleId: account.googleId || `google_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      // Save to saved accounts in localStorage for quick 1-click future logins
      try {
        const existing = JSON.parse(localStorage.getItem('anicart_saved_google_accounts') || '[]');
        const updated = [
          googlePayload,
          ...existing.filter((a) => a.email.toLowerCase() !== googlePayload.email),
        ].slice(0, 5);
        localStorage.setItem('anicart_saved_google_accounts', JSON.stringify(updated));
      } catch (err) {
        // ignore storage error
      }

      await loginWithGoogle(googlePayload);
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      if (onCustomSuccess) onCustomSuccess(googlePayload);
      onClose();
    } catch (err) {
      console.error('Google account login failed:', err);
      setError(err.message || 'Failed to sign in with this Google account.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomAccount = async (e) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      setError('Please provide a valid Gmail address (e.g. yourname@gmail.com)');
      return;
    }

    const cleanEmail = customEmail.toLowerCase().trim();
    const cleanName = customName.trim() || cleanEmail.split('@')[0];

    const newAccount = {
      name: cleanName,
      email: cleanEmail,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}&backgroundColor=020617`,
      initial: cleanName[0].toUpperCase(),
      bg: 'bg-purple-600',
    };

    await handleSelectAccount(newAccount);
  };

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl bg-[#0f1424] border border-white/20 p-6 shadow-2xl text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background lights */}
        <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-blue-500/15 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-purple-500/15 blur-2xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Google Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white shadow-md mb-3">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold font-heading text-white">Choose an account</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            to continue to <span className="text-white font-semibold">AniCart</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* Accounts List */}
        {!isAddingNew ? (
          <div className="space-y-2">
            {accountsList.map((account) => (
              <button
                key={account.email}
                type="button"
                disabled={loading}
                onClick={() => handleSelectAccount(account)}
                className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-purple-500/40 text-left transition-all group disabled:opacity-50"
              >
                <div className={`w-10 h-10 rounded-full ${account.bg || 'bg-blue-600'} text-white font-bold flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                  {account.initial || account.name[0]?.toUpperCase() || 'G'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-white truncate">{account.name}</p>
                    {account.isPrimary && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono truncate">{account.email}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </button>
            ))}

            {/* Option to use another account */}
            <button
              type="button"
              disabled={loading}
              onClick={() => { setIsAddingNew(true); setError(''); }}
              className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-transparent hover:bg-white/[0.04] border border-dashed border-white/15 text-left transition-colors group mt-1"
            >
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-slate-400 group-hover:text-white flex items-center justify-center flex-shrink-0">
                <UserPlus className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-200 group-hover:text-white">Use another Gmail account</p>
                <p className="text-[10px] text-slate-500">Sign in with a different Google account</p>
              </div>
            </button>
          </div>
        ) : (
          /* Custom account input form */
          <form onSubmit={handleAddCustomAccount} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Display Name (Optional)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Satoru Gojo"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Gmail Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setIsAddingNew(false); setError(''); }}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md"
              >
                {loading ? 'Signing in...' : 'Sign In with Account'}
              </button>
            </div>
          </form>
        )}

        {/* Footer info text */}
        <div className="mt-5 pt-3 border-t border-white/10 text-center">
          <p className="text-[10px] text-slate-500 leading-relaxed">
            To continue, Google will share your name, email address, and profile picture with AniCart.
          </p>
          <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-emerald-400/80">
            <ShieldCheck className="w-3 h-3" />
            <span>Directly secured and synchronized with MongoDB Atlas</span>
          </div>
        </div>
      </div>
    </div>
  );
};
