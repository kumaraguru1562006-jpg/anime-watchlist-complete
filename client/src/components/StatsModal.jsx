import React from 'react';
import { X, Trophy, Sparkles, CheckCircle2, Bookmark, Tv, Star, Award, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const StatsModal = ({ isOpen, onClose }) => {
  const { user, stats } = useAuth();

  if (!isOpen || !user) return null;

  const watchedCount = stats.completedCount || 0;
  const epCount = stats.totalEpisodesWatched || 0;
  const toWatchCount = stats.planToWatchCount || 0;

  const badges = [
    {
      title: 'Anime Initiate',
      desc: 'Added first title to watchlist',
      unlocked: stats.total > 0,
      icon: Sparkles,
      color: 'from-purple-500 to-indigo-500',
    },
    {
      title: 'Series Finisher',
      desc: 'Completed at least 1 anime',
      unlocked: watchedCount >= 1,
      icon: CheckCircle2,
      color: 'from-cyan-500 to-blue-500',
    },
    {
      title: 'Binge Titan',
      desc: 'Watched 20+ episodes',
      unlocked: epCount >= 20,
      icon: Tv,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      title: 'Master Critic',
      desc: 'Rated titles with high precision',
      unlocked: parseFloat(stats.averageScore || 0) > 0,
      icon: Star,
      color: 'from-amber-500 to-orange-500',
    },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md liquid-glass-nav bg-[#0e1329]/95 rounded-3xl p-6 shadow-2xl border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white bg-white/5"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Profile Card */}
        <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-white/10">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-purple-500/50 shadow-lg"
          />
          <div>
            <h3 className="text-lg font-bold font-heading text-white">{user.name}</h3>
            <p className="text-xs text-slate-400 font-mono">{user.email}</p>
            <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              MongoDB Cloud Profile
            </span>
          </div>
        </div>

        {/* Watch Stats Matrix */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Watched Anime</span>
            <p className="text-2xl font-extrabold font-heading text-cyan-300 mt-0.5">
              {watchedCount}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Episodes</span>
            <p className="text-2xl font-extrabold font-heading text-purple-300 mt-0.5">
              {epCount}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">In Backlog</span>
            <p className="text-2xl font-extrabold font-heading text-indigo-300 mt-0.5">
              {toWatchCount}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Mean Score</span>
            <p className="text-2xl font-extrabold font-heading text-amber-300 mt-0.5">
              {stats.averageScore || '0.0'} ★
            </p>
          </div>
        </div>

        {/* Badges */}
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Otaku Badges & Milestones</span>
        </h4>

        <div className="space-y-2">
          {badges.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                  b.unlocked
                    ? 'bg-white/5 border-purple-500/30'
                    : 'bg-black/20 border-white/5 opacity-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      b.unlocked
                        ? `bg-gradient-to-tr ${b.color} text-white shadow-md`
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{b.title}</p>
                    <p className="text-[10px] text-slate-400">{b.desc}</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    b.unlocked
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {b.unlocked ? 'Unlocked' : 'Locked'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
