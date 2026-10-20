import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Star, 
  Plus, 
  Check, 
  Eye, 
  Play, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Safe default top 5 in case of network latency
const defaultTop5 = [
  {
    rank: 1,
    id: 21,
    title: 'ONE PIECE',
    imdbScore: '8.9',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-YCDoj1EkASI2.jpg',
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/21-wf37VakJ2afL.jpg',
    format: 'TV',
    studio: 'Toei Animation',
    description: 'Monkey D. Luffy sets sail with his crew to uncover the legendary treasure and claim the title of Pirate King.',
    genres: ['Action', 'Adventure', 'Fantasy'],
    nextAiring: {
      ist: {
        timeIST: '06:30 AM IST',
        countdown: 'In 2 days',
      }
    }
  },
  {
    rank: 2,
    id: 142838,
    title: 'BLEACH: Thousand-Year Blood War',
    imdbScore: '9.0',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx142838-ECx0pZ3zImsq.jpg',
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/142838-8c1qf4F1i4fO.jpg',
    format: 'TV',
    studio: 'Studio Pierrot',
    description: 'The Soul Reapers defend the Soul Society against the ruthless Quincy invasion.',
    genres: ['Action', 'Supernatural'],
  },
  {
    rank: 3,
    id: 163132,
    title: 'Solo Leveling: Season 2',
    imdbScore: '8.4',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx163132-jP4G1H5rA87L.jpg',
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/163132-5J4kF3a9g1L0.jpg',
    format: 'TV',
    studio: 'A-1 Pictures',
    description: 'Sung Jinwoo faces off against S-rank dungeon bosses with his army of Shadows.',
    genres: ['Action', 'Fantasy'],
  },
  {
    rank: 4,
    id: 171010,
    title: 'DanDaDan',
    imdbScore: '8.6',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx171010-WwB0e4T3fXyZ.jpg',
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/171010-8L1mK3b2a4F0.jpg',
    format: 'TV',
    studio: 'Science SARU',
    description: 'Momo and Okarun battle spirits and extraterrestrial forces in pure animated madness.',
    genres: ['Action', 'Comedy', 'Supernatural'],
  },
  {
    rank: 5,
    id: 154587,
    title: 'Frieren: Beyond Journey\'s End',
    imdbScore: '9.0',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-n6onjzA1na7K.jpg',
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/154587-4VPANptsiLR6.jpg',
    format: 'TV',
    studio: 'Madhouse',
    description: 'The elf mage reflects on human connections in an emotional fantasy journey.',
    genres: ['Adventure', 'Drama', 'Fantasy'],
  },
];

export const CrunchyrollTopHero = ({ onOpenDetail }) => {
  const auth = useAuth() || {};
  const { user, openAuthModal, watchlistMap = {}, toggleWatchlistStatus } = auth;
  const [top5, setTop5] = useState(defaultTop5);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let mounted = true;
    api.getTopMonthlyAnime()
      .then((data) => {
        if (mounted && data?.top5 && Array.isArray(data.top5) && data.top5.length > 0) {
          setTop5(data.top5);
        }
      })
      .catch((err) => {
        console.warn('Using default top monthly anime:', err);
      });
    return () => { mounted = false; };
  }, []);

  // Auto-slide carousel like Crunchyroll every 6 seconds
  useEffect(() => {
    if (!top5 || top5.length === 0 || isPaused) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % top5.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [top5, isPaused]);

  const safeIndex = (activeIndex >= 0 && activeIndex < top5.length) ? activeIndex : 0;
  const current = top5[safeIndex] || defaultTop5[0];

  const safeWatchlistMap = watchlistMap || {};
  const watchItem = current?.id ? safeWatchlistMap[current.id] : null;
  const isWatched = watchItem?.status === 'completed';
  const isToWatch = watchItem?.status === 'plan_to_watch';

  const handleToggle = async (anime, targetStatus) => {
    if (!user) {
      if (openAuthModal) openAuthModal();
      return;
    }

    if (toggleWatchlistStatus) {
      const success = await toggleWatchlistStatus(anime, targetStatus);
      if (success && targetStatus === 'completed') {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#f47521', '#fbbf24', '#8b5cf6'],
        });
      }
    }
  };

  return (
    <div 
      className="relative w-full rounded-3xl overflow-hidden liquid-glass-card border border-orange-500/30 shadow-2xl mb-10 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Cinematic Full-Bleed Background Art */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 filter brightness-90 scale-105 pointer-events-none"
        style={{ backgroundImage: `url(${current.bannerImage || current.coverImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#070913] via-[#090d1f]/85 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070913] via-[#070913]/40 to-transparent pointer-events-none" />

      {/* Main Spotlight Content */}
      <div className="relative z-10 p-6 sm:p-10 md:p-12 flex flex-col justify-between min-h-[420px] sm:min-h-[460px]">
        {/* Top Header Tag */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-[#f47521] text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-orange-500/30">
              <Flame className="w-3.5 h-3.5 fill-black" />
              CRUNCHYROLL TOP OF THE MONTH
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-orange-500/40 text-orange-400 font-heading font-black text-xs">
              RANK #{current.rank || 1}
            </span>
          </div>

          {/* Carousel Arrows */}
          <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveIndex((prev) => (prev - 1 + top5.length) % top5.length)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="Previous Anime"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-slate-200 px-2">
              {safeIndex + 1} / {top5.length}
            </span>
            <button
              onClick={() => setActiveIndex((prev) => (prev + 1) % top5.length)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="Next Anime"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Body Content */}
        <div className="max-w-2xl space-y-3 py-4">
          {/* Metadata Chips: IMDb, Format, Studio */}
          <div className="flex flex-wrap items-center gap-2">
            {/* IMDb Rating Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 shadow-md">
              <span className="px-1.5 py-0.5 rounded bg-[#f5c518] text-black font-black text-[10px] tracking-tight">
                IMDb
              </span>
              <span className="font-bold text-white text-xs font-mono">
                {current.imdbScore || '8.8'}
              </span>
            </div>

            <span className="px-2.5 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-semibold">
              {current.format || 'TV'}
            </span>

            {current.studio && (
              <span className="text-xs font-bold text-orange-400">
                {current.studio}
              </span>
            )}
          </div>

          {/* Big Title */}
          <h1 className="text-3xl sm:text-5xl font-black font-heading tracking-tight text-white leading-tight drop-shadow-md">
            {current.title}
          </h1>

          {/* Indian Standard Time Airing info if releasing */}
          {current.nextAiring?.ist && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/80 border border-purple-500/40 text-xs font-mono shadow-md">
              <span className="text-amber-300 font-bold">🇮🇳 Airs in India:</span>
              <span className="text-white font-bold">{current.nextAiring.ist.timeIST}</span>
              <span className="text-cyan-300 font-semibold">({current.nextAiring.ist.countdown})</span>
            </div>
          )}

          {/* Description */}
          {current.description && (
            <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 sm:line-clamp-3 leading-relaxed max-w-xl">
              {typeof current.description === 'string' ? current.description.replace(/<[^>]*>?/gm, '') : ''}
            </p>
          )}

          {/* Genre Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {current.genres?.slice(0, 4).map((g) => (
              <span
                key={g}
                className="text-[11px] px-2.5 py-0.5 rounded-lg bg-white/10 text-slate-200 border border-white/10"
              >
                {g}
              </span>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={() => handleToggle(current, 'plan_to_watch')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg ${
                isToWatch
                  ? 'bg-purple-600 text-white shadow-purple-600/30'
                  : 'bg-gradient-to-r from-orange-600 via-amber-600 to-purple-600 hover:from-orange-500 hover:to-purple-500 text-white shadow-orange-600/30'
              }`}
            >
              {isToWatch ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{isToWatch ? 'In To Watch List' : '+ Add To Watch List'}</span>
            </button>

            <button
              onClick={() => handleToggle(current, 'completed')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                isWatched
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white/10 hover:bg-white/15 border border-white/20 text-white'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{isWatched ? '✓ Watched' : 'Mark Watched'}</span>
            </button>

            {onOpenDetail && (
              <button
                onClick={() => onOpenDetail(current.id)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-slate-200 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <Eye className="w-4 h-4" />
                <span>Details</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Thumbnail Selector Dock (The 5 Anime of the Month) */}
        <div className="pt-4 border-t border-white/10 mt-2">
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {top5.map((anime, idx) => {
              const isSelected = idx === safeIndex;
              return (
                <button
                  key={anime.id || idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`relative p-1.5 sm:p-2 rounded-2xl text-left transition-all flex items-center gap-2 sm:gap-3 group/item ${
                    isSelected
                      ? 'bg-black/80 border-2 border-orange-500 shadow-xl shadow-orange-500/20 scale-[1.02]'
                      : 'bg-black/40 hover:bg-black/60 border border-white/10 hover:border-white/25 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={anime.coverImage}
                    alt={anime.title}
                    className="w-8 h-10 sm:w-11 sm:h-14 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="min-w-0 hidden md:block flex-1">
                    <span className="text-[10px] font-black text-orange-400 font-mono">
                      #{anime.rank || (idx + 1)} SPOTLIGHT
                    </span>
                    <p className="text-xs font-bold text-white truncate">
                      {anime.title}
                    </p>
                    <span className="text-[10px] text-amber-300 font-mono font-semibold">
                      IMDb {anime.imdbScore}
                    </span>
                  </div>

                  {/* Active Indicator Bar */}
                  {isSelected && (
                    <div className="absolute -top-1 left-3 right-3 h-0.5 bg-gradient-to-r from-orange-500 to-amber-400 rounded-full animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
