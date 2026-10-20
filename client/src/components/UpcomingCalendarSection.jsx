import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Sparkles, 
  Plus, 
  Check, 
  Clock, 
  Tv, 
  Filter, 
  Search, 
  Film, 
  ChevronRight,
  Flame,
  Globe
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const UpcomingCalendarSection = ({ onOpenDetail }) => {
  const { user, openAuthModal, watchlistMap, toggleWatchlistStatus } = useAuth();
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(null); // null = all months, or 1..12
  const [selectedFormat, setSelectedFormat] = useState('All'); // 'All' | 'TV' | 'MOVIE' | 'ONA'
  const [searchQuery, setSearchQuery] = useState('');
  const [actionDone, setActionDone] = useState({});

  const currentYear = 2026;
  const currentMonthNum = 10; // October 2026 (Active Fall Season)

  const [monthCache, setMonthCache] = useState({});

  useEffect(() => {
    fetchCalendar(selectedMonth);
  }, [selectedMonth]);

  const fetchCalendar = async (monthNum) => {
    const cacheKey = monthNum === null ? 'all' : String(monthNum);
    if (monthCache[cacheKey]) {
      setCalendarData(monthCache[cacheKey]);
      return;
    }

    setLoading(true);
    try {
      const params = { year: currentYear };
      if (monthNum !== null) params.month = monthNum;
      const data = await api.getUpcomingCalendar(params);
      setCalendarData(data);
      setMonthCache((prev) => ({ ...prev, [cacheKey]: data }));
    } catch (err) {
      console.error('Failed to load upcoming calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  const months = [
    { num: null, label: 'All 2026', short: 'All' },
    { num: 1, label: 'January', short: 'Jan' },
    { num: 2, label: 'February', short: 'Feb' },
    { num: 3, label: 'March', short: 'Mar' },
    { num: 4, label: 'April', short: 'Apr' },
    { num: 5, label: 'May', short: 'May' },
    { num: 6, label: 'June', short: 'Jun' },
    { num: 7, label: 'July', short: 'Jul' },
    { num: 8, label: 'August', short: 'Aug' },
    { num: 9, label: 'September', short: 'Sep' },
    { num: 10, label: 'October', short: 'Oct', isCurrent: true },
    { num: 11, label: 'November', short: 'Nov' },
    { num: 12, label: 'December', short: 'Dec' },
  ];

  const animeList = calendarData?.anime || [];
  const monthCounts = calendarData?.monthCounts || {};

  // Filter items
  const filteredAnime = animeList.filter((item) => {
    // Format filter
    if (selectedFormat !== 'All' && item.format !== selectedFormat) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (item.title || '').toLowerCase().includes(q) ||
                         (item.englishTitle || '').toLowerCase().includes(q) ||
                         (item.romajiTitle || '').toLowerCase().includes(q);
      const matchStudio = (item.studio || '').toLowerCase().includes(q);
      const matchGenre = (item.genres || []).some(g => g.toLowerCase().includes(q));
      if (!matchTitle && !matchStudio && !matchGenre) return false;
    }
    return true;
  });

  const handleToggle = async (anime, targetStatus) => {
    if (!user) {
      openAuthModal();
      return;
    }

    const payload = {
      animeId: anime.id,
      title: anime.title,
      englishTitle: anime.englishTitle,
      romajiTitle: anime.romajiTitle,
      coverImage: anime.coverImage,
      bannerImage: anime.bannerImage,
      format: anime.format,
      totalEpisodes: anime.episodes,
      imdbScore: anime.imdbScore,
      genres: anime.genres,
      studio: anime.studio,
    };

    const success = await toggleWatchlistStatus(payload, targetStatus);
    if (success) {
      setActionDone((prev) => ({ ...prev, [`${anime.id}_${targetStatus}`]: true }));

      if (targetStatus === 'completed') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00f2fe', '#8b5cf6', '#10b981'],
        });
      }

      setTimeout(() => {
        setActionDone((prev) => ({ ...prev, [`${anime.id}_${targetStatus}`]: false }));
      }, 2000);
    }
  };

  const safeWatchlistMap = watchlistMap || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Section Header */}
      <div className="relative rounded-3xl overflow-hidden liquid-glass-card border border-purple-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              <span>{currentYear} Global Broadcast Calendar</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
              Anime Airing This Year <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">({currentYear})</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Explore all upcoming premieres and scheduled broadcasts month by month, converted directly to Indian Standard Time (IST) with official IMDb ratings and 1-click watchlist tracking.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 p-4 rounded-2xl bg-black/40 border border-white/10 flex-shrink-0">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Total Releases</span>
            <div className="text-2xl sm:text-3xl font-black font-heading text-cyan-300">
              {monthCounts.total || animeList.length}+
            </div>
            <span className="text-[10px] text-purple-300 font-mono">Worldwide in {currentYear}</span>
          </div>
        </div>
      </div>

      {/* Month Selector Dock */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span>Select Broadcast Month</span>
          </div>
          {selectedMonth && (
            <button
              onClick={() => setSelectedMonth(null)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
            >
              Show All Months
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {months.map((m) => {
            const isSelected = selectedMonth === m.num;
            const count = m.num === null ? (monthCounts.total || animeList.length) : (monthCounts[m.num] || 0);
            const isHighlighted = m.num === currentMonthNum;

            return (
              <button
                key={m.label}
                onClick={() => setSelectedMonth(m.num)}
                className={`relative px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 select-none ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40 scale-105'
                    : isHighlighted
                    ? 'bg-orange-500/20 text-orange-200 border border-orange-500/40 hover:bg-orange-500/30'
                    : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/5'
                }`}
              >
                <span>{m.short}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isSelected
                      ? 'bg-black/30 text-white'
                      : isHighlighted
                      ? 'bg-orange-500/30 text-orange-300'
                      : 'bg-white/10 text-slate-400'
                  }`}>
                    {count}
                  </span>
                )}
                {isHighlighted && !isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping absolute -top-1 -right-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl liquid-glass-card border border-white/10">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search upcoming titles (e.g., Tougen Anki, Solo Leveling, Bleach)..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {/* Format Selector */}
        <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-xl border border-white/5 self-start sm:self-auto">
          {['All', 'TV', 'MOVIE', 'ONA'].map((fmt) => (
            <button
              key={fmt}
              onClick={() => setSelectedFormat(fmt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedFormat === fmt
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Anime Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-80 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : filteredAnime.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-white/5 border border-white/10 text-slate-400 space-y-3">
          <Calendar className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-white font-heading">No anime found for selected filters</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try switching the month filter to "All" or clearing your search term to view all scheduled releases.
          </p>
          <button
            onClick={() => { setSelectedMonth(null); setSelectedFormat('All'); setSearchQuery(''); }}
            className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-200 text-xs font-semibold border border-purple-500/40 transition-all"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAnime.map((item) => {
            const watchItem = safeWatchlistMap[item.id];
            const isWatched = watchItem?.status === 'completed';
            const isToWatch = watchItem?.status === 'plan_to_watch';

            return (
              <div
                key={item.id}
                className={`group relative rounded-2xl overflow-hidden liquid-glass-card flex flex-col justify-between border transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 ${
                  isWatched
                    ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                    : isToWatch
                    ? 'border-purple-500/50 shadow-lg shadow-purple-500/10'
                    : 'border-white/10 hover:border-purple-500/40'
                }`}
              >
                {/* High-Resolution Poster Container */}
                <div className="relative h-60 overflow-hidden bg-slate-900">
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                    style={{ imageRendering: 'auto' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e1329] via-black/20 to-black/60 pointer-events-none" />

                  {/* Top Badges: Format and Official Yellow IMDb Badge */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1 pointer-events-none">
                    <span className="px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/20 text-[10px] font-mono font-bold text-white uppercase tracking-wider">
                      {item.format || 'TV'}
                    </span>

                    {/* Official Yellow IMDb Badge */}
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/20 shadow-md">
                      <span className="px-1 py-0.2 rounded bg-[#f5c518] text-black font-black text-[9px] tracking-tight">
                        IMDb
                      </span>
                      <span className="font-bold text-white text-[11px] font-mono">
                        {item.imdbScore || '8.2'}
                      </span>
                    </div>
                  </div>

                  {/* Month & Airing Date in IST Badge */}
                  <div className="absolute bottom-2.5 left-3 right-3">
                    <div className="px-2.5 py-1.5 rounded-xl bg-purple-950/90 backdrop-blur-md border border-purple-500/40 text-[11px] font-mono flex items-center justify-between shadow-xl">
                      <span className="text-amber-300 font-bold flex items-center gap-1 truncate">
                        <span>🇮🇳</span> {item.releaseDateIST}
                      </span>
                      <span className="text-cyan-300 font-semibold text-[10px] uppercase ml-1 flex-shrink-0">
                        {item.startMonthName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="font-semibold text-purple-400 truncate max-w-[140px]">{item.studio}</span>
                      <span className="font-mono text-slate-400">{item.seasonYear}</span>
                    </div>

                    <h3
                      onClick={() => onOpenDetail(item.id)}
                      className="text-sm font-bold font-heading text-white line-clamp-2 hover:text-purple-300 cursor-pointer transition-colors"
                      title={item.title}
                    >
                      {item.title}
                    </h3>

                    {/* Synopsis snippet */}
                    {item.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                        {item.description.replace(/<[^>]*>/g, '')}
                      </p>
                    )}

                    {/* Genres */}
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {item.genres?.slice(0, 3).map((g) => (
                        <span
                          key={g}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/5"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Watchlist Actions */}
                  <div className="pt-2.5 border-t border-white/10 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleToggle(item, 'plan_to_watch')}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all flex items-center justify-center gap-1 ${
                        isToWatch
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-200'
                      }`}
                    >
                      {isToWatch ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>In Plan</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ To Watch</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleToggle(item, 'completed')}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all flex items-center justify-center gap-1 ${
                        isWatched
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-200'
                      }`}
                    >
                      {isWatched ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Watched</span>
                        </>
                      ) : (
                        <span>Mark Watched</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
