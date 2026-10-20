import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Star, 
  Sparkles, 
  Plus, 
  Check, 
  Eye, 
  Play, 
  Tv, 
  Clock, 
  TrendingUp, 
  Award,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Top5MonthlyAnime = ({ onOpenDetail }) => {
  const { user, openAuthModal, watchlistMap, toggleWatchlistStatus } = useAuth();
  const [top5, setTop5] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionDone, setActionDone] = useState({});

  useEffect(() => {
    fetchTopMonthly();
  }, []);

  const fetchTopMonthly = async () => {
    setLoading(true);
    try {
      const data = await api.getTopMonthlyAnime();
      setTop5(data.top5 || []);
    } catch (err) {
      console.error('Error fetching top monthly:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (anime, targetStatus) => {
    if (!user) {
      openAuthModal();
      return;
    }

    const success = await toggleWatchlistStatus(anime, targetStatus);
    if (success) {
      setActionDone((prev) => ({ ...prev, [`${anime.id}_${targetStatus}`]: true }));

      if (targetStatus === 'completed') {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#f47521', '#fbbf24', '#8b5cf6'],
        });
      }

      setTimeout(() => {
        setActionDone((prev) => ({ ...prev, [`${anime.id}_${targetStatus}`]: false }));
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-80 rounded-3xl bg-white/5 animate-pulse border border-white/10" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
          ))}
        </div>
      </div>
    );
  }

  const safeWatchlistMap = watchlistMap || {};
  const numberOne = top5 && top5.length > 0 ? top5[0] : null;
  const others = top5 && top5.length > 1 ? top5.slice(1) : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Crunchyroll Style Section Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-[#f47521] text-black font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-orange-500/20">
              <Flame className="w-3.5 h-3.5 fill-black" />
              CRUNCHYROLL CHARTS
            </span>
            <h2 className="text-xl sm:text-2xl font-black font-heading text-white tracking-tight">
              Top 5 Anime of the Month
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            The highest streamed and rated anime across the globe this month.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Updated for October 2026</span>
        </div>
      </div>

      {/* RANK #1 HERO SPOTLIGHT */}
      {numberOne && (
        <div className="relative rounded-3xl overflow-hidden liquid-glass-card border border-orange-500/40 p-6 sm:p-10 shadow-2xl bg-gradient-to-br from-[#120f24] via-[#0d1124] to-[#070913]">
          {/* Background backdrop banner */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30 filter blur-xs scale-105 pointer-events-none"
            style={{ backgroundImage: `url(${numberOne.bannerImage || numberOne.coverImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070913] via-[#090d1f]/90 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070913] via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              {/* Badges Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#f47521] text-black font-black text-xs tracking-wider flex items-center gap-1 shadow-lg">
                  <Flame className="w-3.5 h-3.5 fill-black" />
                  #01 TOP ANIME OF THE MONTH
                </span>

                {/* IMDb Rating Badge */}
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-black/70 border border-white/20">
                  <span className="px-1 py-0.2 rounded bg-[#f5c518] text-black font-black text-[10px] tracking-tight">
                    IMDb
                  </span>
                  <span className="font-bold text-white text-xs font-mono">
                    {numberOne.imdbScore}
                  </span>
                </div>

                <span className="px-2.5 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-semibold">
                  {numberOne.format || 'TV'}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-4xl font-black font-heading tracking-tight text-white leading-tight">
                {numberOne.title}
              </h1>

              {/* Next Airing in Indian Standard Time (IST) if available */}
              {numberOne.nextAiring?.ist && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/80 border border-purple-500/40 text-xs font-mono">
                  <span className="text-amber-300 font-bold">🇮🇳 Airs in India:</span>
                  <span className="text-white font-bold">{numberOne.nextAiring.ist.timeIST}</span>
                  <span className="text-cyan-300 font-semibold">({numberOne.nextAiring.ist.countdown})</span>
                </div>
              )}

              {/* Description */}
              {numberOne.description && (
                <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed">
                  {numberOne.description.replace(/<[^>]*>?/gm, '')}
                </p>
              )}

              {/* Genres & Studio */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {numberOne.studio && (
                  <span className="text-xs font-semibold text-orange-400 mr-2">
                    Studio: {numberOne.studio}
                  </span>
                )}
                {numberOne.genres?.slice(0, 4).map((g) => (
                  <span
                    key={g}
                    className="text-[11px] px-2.5 py-0.5 rounded-lg bg-white/5 text-slate-300 border border-white/10"
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                <button
                  onClick={() => handleToggle(numberOne, 'plan_to_watch')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-purple-600 hover:from-orange-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-orange-600/30 transition-all flex items-center gap-2"
                >
                  {safeWatchlistMap[numberOne.id]?.status === 'plan_to_watch' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>In To Watch List</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>+ Add To Watch List</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleToggle(numberOne, 'completed')}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold transition-all flex items-center gap-2"
                >
                  {safeWatchlistMap[numberOne.id]?.status === 'completed' ? (
                    <>
                      <Check className="w-4 h-4 text-cyan-300" />
                      <span>✓ Watched</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-slate-400" />
                      <span>Mark as Watched</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onOpenDetail(numberOne.id)}
                  className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4" />
                  <span>Details</span>
                </button>
              </div>
            </div>

            {/* Poster Card with big stylized #01 */}
            <div className="hidden md:block relative flex-shrink-0">
              <div className="absolute -top-6 -left-6 z-20 text-6xl font-black font-heading text-white/10 select-none pointer-events-none">
                01
              </div>
              <img
                src={numberOne.coverImage}
                alt={numberOne.title}
                className="w-44 h-64 rounded-2xl object-cover shadow-2xl ring-2 ring-orange-500/40 transition-transform duration-300 hover:scale-105"
              />
            </div>
          </div>
        </div>
      )}

      {/* RANKS #2, #3, #4, #5 CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {others.map((anime) => {
          const watchItem = safeWatchlistMap[anime.id];
          const isWatched = watchItem?.status === 'completed';
          const isToWatch = watchItem?.status === 'plan_to_watch';

          return (
            <div
              key={anime.id}
              className="group relative rounded-2xl overflow-hidden liquid-glass-card border border-white/10 hover:border-orange-500/40 transition-all flex flex-col justify-between"
            >
              {/* Poster Cover */}
              <div className="relative h-60 overflow-hidden">
                <img
                  src={anime.coverImage}
                  alt={anime.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e1329] via-transparent to-black/60 pointer-events-none" />

                {/* Big Rank Number Tag (Crunchyroll Style) */}
                <div className="absolute top-2 left-2 z-10">
                  <div className="w-9 h-9 rounded-xl bg-black/80 backdrop-blur-md border border-orange-500/50 flex items-center justify-center shadow-lg">
                    <span className="font-heading font-black text-orange-400 text-sm">
                      #{anime.rank}
                    </span>
                  </div>
                </div>

                {/* IMDb Rating Badge Top Right */}
                <div className="absolute top-2 right-2 z-10 pointer-events-none">
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-black/75 backdrop-blur-md border border-white/15">
                    <span className="px-1 py-0.2 rounded bg-[#f5c518] text-black font-black text-[9px] tracking-tight">
                      IMDb
                    </span>
                    <span className="font-bold text-white text-[11px] font-mono">
                      {anime.imdbScore}
                    </span>
                  </div>
                </div>

                {/* Spotlight Badge */}
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-orange-500/30 text-[10px] font-bold text-orange-300 truncate">
                    {anime.spotlightBadge}
                  </div>
                </div>

                {/* Hover overlay quick buttons */}
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                  <button
                    onClick={() => handleToggle(anime, 'completed')}
                    className={`w-full py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all flex items-center justify-center gap-1 shadow-lg ${
                      isWatched
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/40'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isWatched ? '✓ Watched' : 'Mark Watched'}</span>
                  </button>

                  <button
                    onClick={() => handleToggle(anime, 'plan_to_watch')}
                    className={`w-full py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all flex items-center justify-center gap-1 shadow-lg ${
                      isToWatch
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isToWatch ? '✓ In To Watch' : '+ To Watch'}</span>
                  </button>

                  <button
                    onClick={() => onOpenDetail(anime.id)}
                    className="w-full py-1.5 px-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-medium transition-all flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Details</span>
                  </button>
                </div>
              </div>

              {/* Title & Info */}
              <div className="p-3.5 space-y-1">
                <h3
                  onClick={() => onOpenDetail(anime.id)}
                  className="text-xs sm:text-sm font-bold font-heading text-white line-clamp-1 hover:text-orange-300 cursor-pointer transition-colors"
                  title={anime.title}
                >
                  {anime.title}
                </h3>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="truncate max-w-[120px]">{anime.studio || anime.genres?.[0]}</span>
                  <span>{anime.episodes ? `${anime.episodes} ep` : ''}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
