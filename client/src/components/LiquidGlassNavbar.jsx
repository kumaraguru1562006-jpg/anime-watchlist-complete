import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Bookmark, 
  CheckCircle2, 
  Newspaper, 
  Search, 
  Clock, 
  LogOut, 
  LogIn,
  User as UserIcon, 
  UserCircle2,
  Sparkles,
  ChevronDown,
  Menu,
  X,
  Film,
  Flame,
  Calendar,
  RefreshCw,
  Check,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const LiquidGlassNavbar = ({ 
  activeTab, 
  setActiveTab, 
  onOpenSearch, 
  onOpenStats, 
  onGoToLogin 
}) => {
  const { user, logout, openAuthModal, openProfileModal, stats } = useAuth();
  const [istTime, setIstTime] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState('');

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await api.triggerSyncNow();
      setSyncFeedback('Synced');
      setTimeout(() => setSyncFeedback(''), 2500);
      window.location.reload();
    } catch (err) {
      console.error('Failed to trigger sync:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Live ticking Indian Standard Time (IST) Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      setIstTime(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    {
      id: 'airing',
      label: 'Discover',
      fullLabel: 'Discover',
      icon: Tv,
      badge: 'Live',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'news',
      label: 'Anime News',
      fullLabel: 'Anime News',
      icon: Newspaper,
      badge: 'Hot',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    },
    {
      id: 'this_year',
      label: 'Seasonal Anime',
      fullLabel: 'Seasonal Anime (2026)',
      icon: Calendar,
    },
    {
      id: 'aired',
      label: 'Manga',
      fullLabel: 'Manga & Catalog',
      icon: Film,
    },
    {
      id: 'towatch',
      label: 'To Watch',
      fullLabel: 'To Watch',
      icon: Bookmark,
      badge: stats.planToWatchCount > 0 ? stats.planToWatchCount : null,
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
    {
      id: 'watched',
      label: 'Watched',
      fullLabel: 'Watched',
      icon: CheckCircle2,
      badge: stats.completedCount > 0 ? stats.completedCount : null,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-2 sm:px-4 lg:px-6 pt-2.5 sm:pt-3 pointer-events-none">
      <div 
        className={`pointer-events-auto max-w-7xl mx-auto rounded-2xl transition-all duration-300 liquid-glass-nav px-2.5 sm:px-4 py-1.5 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-3 ${
          isScrolled ? 'shadow-2xl shadow-purple-950/50 bg-[#0d1122]/90' : 'bg-[#0d1122]/75'
        }`}
      >
        {/* Brand / Logo */}
        <div 
          onClick={() => setActiveTab('news')}
          className="flex items-center gap-2 cursor-pointer group select-none flex-shrink-0"
        >
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-[1.5px] transition-transform duration-300 group-hover:scale-105 shadow-md shadow-purple-500/25">
            <div className="w-full h-full bg-[#090d1e] rounded-[10px] flex items-center justify-center overflow-hidden relative">
              <span className="font-heading font-black text-transparent bg-clip-text bg-gradient-to-tr from-purple-400 to-cyan-300 text-base sm:text-lg">
                氣
              </span>
              <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent pointer-events-none" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400 blur-[2px] animate-pulse" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-heading font-extrabold text-sm sm:text-base tracking-tight bg-gradient-to-r from-white via-purple-100 to-cyan-200 bg-clip-text text-transparent">
                AniCart
              </span>
              <span className="hidden xs:inline-block text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Live
              </span>
            </div>
            <span className="hidden sm:inline-block text-[9px] text-slate-400 -mt-1 tracking-wider uppercase font-medium">
              Anime & Intelligence
            </span>
          </div>
        </div>

        {/* Center Desktop Navigation Links: Responsive & Sleek */}
        <nav className="hidden lg:flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/5 flex-shrink">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-2.5 xl:px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 select-none ${
                  isActive
                    ? 'text-white nav-active-pill font-semibold shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
                title={item.fullLabel}
              >
                <Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-purple-300' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[9px] font-bold px-1 rounded-full border ${item.badgeColor || 'bg-white/10 text-white'}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Island: Utility Capsule (IST + Daily Sync + Search) & Auth Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          
          {/* Unified Tool Capsule: Keeps IST, Daily Sync, and Search Perfectly in Box */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/10">
            {/* IST Clock (Always Visible on Mobile and Desktop) */}
            <div 
              title="Indian Standard Time (IST UTC+5:30) Live Clock"
              className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-200 text-[10px] sm:text-[11px] font-mono select-none flex-shrink-0"
            >
              <div className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </div>
              <span className="text-[10px] font-bold text-amber-300">🇮🇳</span>
              <span className="font-semibold">{istTime || 'IST Live'}</span>
            </div>

            {/* Daily Auto-Sync Button */}
            <button
              onClick={handleSync}
              disabled={isSyncing}
              title="Daily Auto-Sync: Updates schedule & database every 24h. Click for instant sync."
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-950/30 hover:bg-emerald-900/50 border border-emerald-500/20 text-emerald-300 text-[11px] font-mono transition-all group disabled:opacity-60"
            >
              <RefreshCw className={`w-3 h-3 text-emerald-400 ${isSyncing ? 'animate-spin text-cyan-400' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              <span className="hidden md:inline font-semibold">
                {isSyncing ? 'Syncing...' : syncFeedback || 'Daily Sync'}
              </span>
            </button>

            {/* Search Button in Box */}
            <button
              onClick={onOpenSearch}
              title="Quick Search (Press '/' or click)"
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-[11px] transition-all group"
            >
              <Search className="w-3 h-3 text-slate-400 group-hover:text-purple-400 transition-colors" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden lg:inline text-[9px] font-mono px-1 py-0.2 rounded bg-black/60 text-slate-400 border border-white/5">
                /
              </kbd>
            </button>
          </div>

          {/* Profile Picture: Click Directly to Open User Interface (No text, No navbar logout) */}
          {user ? (
            <button
              onClick={openProfileModal}
              title={`${user.name || 'User'} - Click to open profile`}
              className="relative group p-0.5 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 hover:scale-105 transition-all duration-300 shadow-md shadow-purple-500/25 flex-shrink-0 focus:outline-none"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] overflow-hidden bg-[#090d1e] ring-2 ring-purple-500/40 group-hover:ring-cyan-300 transition-all">
                <img
                  src={user.avatar || 'https://s4.anilist.co/file/anilistcdn/character/large/b127691-9zqh1xpIubn7.png'}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#090d1e]" />
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              {/* Dedicated Login Button with explicit Login Icon */}
              <button
                onClick={() => {
                  if (onGoToLogin) {
                    onGoToLogin();
                  } else {
                    openAuthModal();
                  }
                }}
                title="Sign In with Email"
                className="relative group overflow-hidden px-3 py-1 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 border border-white/20 transition-all flex items-center gap-1.5 select-none"
              >
                <LogIn className="w-3.5 h-3.5 text-cyan-300" />
                <span>Login</span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
              </button>
            </div>
          )}

          {/* Mobile hamburger menu */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden mt-2 max-w-7xl mx-auto rounded-2xl liquid-glass-nav bg-[#0e1329]/95 p-3 shadow-2xl border border-white/15 animate-in slide-in-from-top-4 duration-200 pointer-events-auto">
          {/* Quick info in drawer */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 mb-2 text-xs">
            <span className="text-purple-300 font-mono">🇮🇳 IST: {istTime}</span>
            <button
              onClick={handleSync}
              className="flex items-center gap-1 text-emerald-300 font-mono text-[11px]"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`p-2 rounded-xl text-xs font-medium flex items-center justify-between ${
                    isActive
                      ? 'nav-active-pill text-white'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-purple-400" />
                    <span>{item.fullLabel || item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* User Profile / Login row in Mobile Drawer */}
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
            {user ? (
              <button
                onClick={() => {
                  openProfileModal();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-purple-900/30 border border-purple-500/20 text-xs text-white"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={user.avatar || 'https://s4.anilist.co/file/anilistcdn/character/large/b127691-9zqh1xpIubn7.png'}
                    alt={user.name}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-purple-400/40"
                  />
                  <span className="font-semibold">{user.name}</span>
                </div>
                <span className="text-[10px] text-cyan-300 font-mono">Open Profile →</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (onGoToLogin) {
                    onGoToLogin();
                  } else {
                    openAuthModal();
                  }
                }}
                className="w-full py-2 rounded-xl bg-purple-600 text-white font-semibold text-xs flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In / Login with Email</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
