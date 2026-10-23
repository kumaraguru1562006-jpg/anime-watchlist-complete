import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Sparkles, 
  Plus, 
  Check, 
  Eye, 
  Tv, 
  Star, 
  Play, 
  Globe,
  Layers,
  Search,
  Calendar,
  ChevronRight,
  Flame,
  LayoutGrid,
  ListFilter,
  X,
  Pin
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AiringScheduleIST = ({ onOpenDetail }) => {
  const { user, openAuthModal, watchlistMap, toggleWatchlistStatus, togglePinAnime } = useAuth();
  
  // Synchronous cache hydration for instant zero-wait initial paint
  const [schedules, setSchedules] = useState(() => {
    try {
      const cached = localStorage.getItem('anicart_cache_airing_schedules');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('anicart_cache_airing_schedules');
      return !cached || JSON.parse(cached).length === 0;
    } catch {
      return true;
    }
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalWorldwide, setTotalWorldwide] = useState(0);
  const [error, setError] = useState('');
  
  // Day filter: 'all_day_wise' | 'Today' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'
  const [selectedDay, setSelectedDay] = useState('all_day_wise');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTimeIST, setCurrentTimeIST] = useState('');
  const [currentDateIST, setCurrentDateIST] = useState('');
  const [actionDone, setActionDone] = useState({});

  const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Current weekday in Indian Standard Time
  const todayDayIST = useMemo(() => {
    return new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long' });
  }, []);

  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    fetchAiring(1, true);
  }, []);

  // Automatic debounced search across worldwide airing database
  useEffect(() => {
    const q = searchQuery.trim();
    if (q) {
      setHasSearched(true);
      const timer = setTimeout(() => {
        fetchAiring(1, true, q);
      }, 400);
      return () => clearTimeout(timer);
    } else if (hasSearched) {
      setHasSearched(false);
      fetchAiring(1, true, '');
    }
  }, [searchQuery]);

  const fetchAiring = async (pageNum = 1, reset = false, search = '') => {
    if (reset) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = { page: pageNum, perPage: 50 };
      if (search.trim()) params.search = search.trim();
      
      const data = await api.getAiringIST(params);
      const incoming = data.schedules || [];
      
      if (reset) {
        const uniqueMap = new Map();
        for (const item of incoming) {
          if (!uniqueMap.has(item.animeId)) uniqueMap.set(item.animeId, item);
        }
        const list = Array.from(uniqueMap.values());
        setSchedules(list);
        if (!search.trim() && pageNum === 1 && list.length > 0) {
          try {
            localStorage.setItem('anicart_cache_airing_schedules', JSON.stringify(list));
          } catch (e) {}
        }
      } else {
        setSchedules((prev) => {
          const uniqueMap = new Map();
          for (const item of prev) uniqueMap.set(item.animeId, item);
          for (const item of incoming) {
            if (!uniqueMap.has(item.animeId)) uniqueMap.set(item.animeId, item);
          }
          return Array.from(uniqueMap.values());
        });
      }

      setHasNextPage(data.pageInfo?.hasNextPage || false);
      setPage(pageNum);
      setTotalWorldwide(data.totalWorldwideAiring || (data.schedules?.length || 0));
      setCurrentTimeIST(data.currentTimeIST || '');
      setCurrentDateIST(data.currentDateIST || '');
    } catch (err) {
      setError(err.message || 'Failed to load airing schedules');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Filter schedules by search query with typo tolerance & modifier stripping
  const searchedSchedules = useMemo(() => {
    if (!searchQuery.trim()) return schedules;
    let rawQ = searchQuery.toLowerCase().trim();
    let q = rawQ.replace(/\b(upcoming|airing|new|latest|all|shows|anime|season)\b/gi, '').trim();
    if (!q) q = rawQ;

    if (q.includes('dragonboll')) q = q.replace(/dragonboll/g, 'dragon ball');
    if (q.includes('dragonball')) q = q.replace(/dragonball/g, 'dragon ball');
    if (q === 'tybw') q = 'thousand-year blood war';

    return schedules.filter((item) => {
      const titleLower = (item.title || '').toLowerCase();
      const engLower = (item.englishTitle || '').toLowerCase();
      const romLower = (item.romajiTitle || '').toLowerCase();
      const studioLower = (item.studio || '').toLowerCase();

      const matchTitle = titleLower.includes(q) || engLower.includes(q) || romLower.includes(q);
      const matchStudio = studioLower.includes(q);
      const matchGenre = (item.genres || []).some((g) => g.toLowerCase().includes(q));

      // Extra keyword mappings for Bleach Calamity / Dragon Ball
      const matchCalamity = (q.includes('calamity') || rawQ.includes('calamity')) && (titleLower.includes('calamity') || titleLower.includes('bleach') || engLower.includes('calamity'));
      const matchBleach = (q.includes('bleach') || rawQ.includes('bleach')) && (titleLower.includes('bleach') || engLower.includes('bleach') || romLower.includes('bleach'));
      const matchDragon = (q.includes('dragon') || q.includes('ball') || rawQ.includes('dragonboll')) && (titleLower.includes('dragon') || engLower.includes('dragon'));

      return matchTitle || matchStudio || matchGenre || matchCalamity || matchBleach || matchDragon;
    });
  }, [schedules, searchQuery]);

  // Group anime day-wise (Monday to Sunday)
  const dayWiseGroups = useMemo(() => {
    const groups = {};
    for (const d of DAYS_ORDER) {
      groups[d] = [];
    }

    for (const item of searchedSchedules) {
      let day = item.ist?.dayIST;
      if (!day && item.ist?.timestamp) {
        day = new Date(item.ist.timestamp * 1000).toLocaleDateString('en-IN', {
          timeZone: 'Asia/Kolkata',
          weekday: 'long',
        });
      }
      if (day && groups[day]) {
        groups[day].push(item);
      }
    }

    // Sort each day chronologically by timestamp
    for (const d of DAYS_ORDER) {
      groups[d].sort((a, b) => (a.ist?.timestamp || 0) - (b.ist?.timestamp || 0));
    }

    return groups;
  }, [searchedSchedules]);

  // Compute day counts
  const dayCounts = useMemo(() => {
    const counts = {};
    for (const d of DAYS_ORDER) {
      counts[d] = dayWiseGroups[d]?.length || 0;
    }
    return counts;
  }, [dayWiseGroups]);

  const handleToggle = async (anime, targetStatus) => {
    if (!user) {
      openAuthModal();
      return;
    }

    const success = await toggleWatchlistStatus(anime, targetStatus);
    if (success) {
      setActionDone((prev) => ({ ...prev, [`${anime.animeId}_${targetStatus}`]: true }));

      if (targetStatus === 'completed') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00f2fe', '#8b5cf6', '#10b981'],
        });
      }

      setTimeout(() => {
        setActionDone((prev) => ({ ...prev, [`${anime.animeId}_${targetStatus}`]: false }));
      }, 2000);
    }
  };

  const safeWatchlistMap = watchlistMap || {};
  const featured = schedules && schedules.length > 0 ? schedules[0] : null;

  // Render an individual anime card
  const renderAnimeCard = (item) => {
    const watchItem = safeWatchlistMap[item.animeId];
    const isWatched = watchItem?.status === 'completed';
    const isToWatch = watchItem?.status === 'plan_to_watch';
    const isPinned = Boolean(watchItem?.isPinned);

    return (
      <div
        key={item.animeId}
        className={`group relative rounded-2xl overflow-hidden liquid-glass-card flex flex-col justify-between border transition-all ${
          isPinned
            ? 'border-amber-500/60 shadow-lg shadow-amber-500/20 ring-1 ring-amber-500/30'
            : isWatched
            ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10'
            : isToWatch
            ? 'border-purple-500/50 shadow-lg shadow-purple-500/10'
            : 'border-white/10 hover:border-purple-500/30'
        }`}
      >
        {/* Cover Image */}
        <div className="relative h-56 overflow-hidden">
          <img
            src={item.coverImage}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e1329] via-transparent to-black/60 pointer-events-none" />

          {/* Top Badges: EP and IMDb Rating */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-mono font-bold text-white flex items-center gap-1">
                <span className="text-purple-400">EP</span> {item.episode}
              </span>
              {isPinned && (
                <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-black text-[10px] font-black uppercase tracking-tight flex items-center gap-0.5 shadow-md">
                  <Pin className="w-2.5 h-2.5 fill-black rotate-45" />
                  Pinned
                </span>
              )}
            </div>

            {/* IMDb Rating Badge */}
            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-black/75 backdrop-blur-md border border-white/20 shadow-sm">
              <span className="px-1 py-0.2 rounded bg-[#f5c518] text-black font-black text-[9px] tracking-tight">
                IMDb
              </span>
              <span className="font-bold text-white text-[11px] font-mono">
                {item.imdbScore || '8.2'}
              </span>
            </div>
          </div>

          {/* Indian Standard Time Pill overlay */}
          <div className="absolute bottom-2 left-2.5 right-2.5">
            <div className="px-2.5 py-1.5 rounded-xl bg-purple-950/90 backdrop-blur-md border border-purple-500/40 text-[11px] font-mono flex items-center justify-between shadow-lg">
              <span className="text-amber-300 font-bold flex items-center gap-1">
                <span>🇮🇳</span> {item.ist?.dayIST || 'IST'} • {item.ist?.timeIST}
              </span>
              <span className="text-cyan-300 font-semibold">{item.ist?.shortCountdown || item.ist?.countdown}</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1">
              <span className="font-semibold text-purple-300">{item.studio}</span>
              <span>•</span>
              <span>{item.format}</span>
            </div>

            <h3
              onClick={() => onOpenDetail(item.animeId)}
              className="font-bold text-sm text-white line-clamp-1 group-hover:text-purple-300 transition-colors cursor-pointer"
              title={item.title}
            >
              {item.title}
            </h3>

            {item.englishTitle && item.englishTitle !== item.title && (
              <p className="text-[11px] text-slate-400 line-clamp-1 italic">
                {item.englishTitle}
              </p>
            )}

            {/* Genre Tags */}
            <div className="flex flex-wrap gap-1 mt-2">
              {(item.genres || []).slice(0, 3).map((g) => (
                <span
                  key={g}
                  className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] text-slate-300 font-medium"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-1.5">
            <button
              onClick={() => handleToggle(item, 'plan_to_watch')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-medium transition-all flex items-center justify-center gap-1 ${
                isToWatch
                  ? 'bg-purple-600/30 border border-purple-500/50 text-purple-300'
                  : 'bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300'
              }`}
            >
              {isToWatch ? <Check className="w-3 h-3 text-emerald-400" /> : <Plus className="w-3 h-3" />}
              <span>{isToWatch ? 'In List' : '+ To Watch'}</span>
            </button>

            <button
              onClick={() => handleToggle(item, 'completed')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-medium transition-all flex items-center justify-center gap-1 ${
                isWatched
                  ? 'bg-emerald-600/30 border border-emerald-500/50 text-emerald-300'
                  : 'bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300'
              }`}
            >
              {isWatched ? <Check className="w-3 h-3 text-cyan-400" /> : <Check className="w-3 h-3" />}
              <span>{isWatched ? 'Watched' : 'Mark Watched'}</span>
            </button>

            <button
              onClick={() => togglePinAnime(item)}
              className={`p-1.5 rounded-xl border transition-all ${
                isPinned
                  ? 'bg-amber-500/25 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/20'
                  : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-400 hover:text-white'
              }`}
              title={isPinned ? 'Unpin ongoing anime' : 'Pin ongoing anime to top shelf'}
            >
              <Pin className={`w-3.5 h-3.5 rotate-45 ${isPinned ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>

            <button
              onClick={() => onOpenDetail(item.animeId)}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white transition-colors"
              title="View Anime Details"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Featured Spotlight Airing Banner */}
      {featured && (
        <div className="relative rounded-3xl overflow-hidden liquid-glass border border-white/10 p-6 sm:p-8">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-25 filter blur-sm scale-105 pointer-events-none"
            style={{ backgroundImage: `url(${featured.bannerImage || featured.coverImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070913] via-[#090d1f]/90 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070913] via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Currently Airing Worldwide
                </span>

                {/* IMDb Rating Badge */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-black/70 border border-white/20">
                  <span className="px-1 py-0.2 rounded bg-[#f5c518] text-black font-black text-[10px] tracking-tight">
                    IMDb
                  </span>
                  <span className="font-bold text-white text-xs font-mono">
                    {featured.imdbScore || '8.8'}
                  </span>
                </div>

                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-semibold">
                  Episode {featured.episode}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black font-heading tracking-tight text-white leading-tight">
                {featured.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-mono">
                <span className="text-amber-300 font-bold flex items-center gap-1.5">
                  <span>🇮🇳</span> {featured.ist?.dayIST} at {featured.ist?.timeIST} IST
                </span>
                <span>•</span>
                <span className="text-cyan-300 font-bold">{featured.ist?.countdown}</span>
                <span>•</span>
                <span className="text-purple-300">{featured.studio}</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 max-w-xl font-normal leading-relaxed">
                {featured.description ? featured.description.replace(/<[^>]*>/g, '') : 'Catch the latest episode broadcasting worldwide in Indian Standard Time.'}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-3">
                <button
                  onClick={() => handleToggle(featured, 'plan_to_watch')}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2"
                >
                  {safeWatchlistMap[featured.animeId]?.status === 'plan_to_watch' ? (
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
                  onClick={() => handleToggle(featured, 'completed')}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold transition-all flex items-center gap-2"
                >
                  {safeWatchlistMap[featured.animeId]?.status === 'completed' ? (
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
                  onClick={() => togglePinAnime(featured)}
                  className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    safeWatchlistMap[featured.animeId]?.isPinned
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-black font-extrabold shadow-md shadow-amber-500/25'
                      : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-300'
                  }`}
                  title={safeWatchlistMap[featured.animeId]?.isPinned ? 'Unpin ongoing anime' : 'Pin ongoing anime to top shelf'}
                >
                  <Pin className={`w-3.5 h-3.5 rotate-45 ${safeWatchlistMap[featured.animeId]?.isPinned ? 'fill-black' : 'fill-amber-400'}`} />
                  <span>{safeWatchlistMap[featured.animeId]?.isPinned ? 'Pinned' : 'Pin Ongoing'}</span>
                </button>

                <button
                  onClick={() => onOpenDetail(featured.animeId)}
                  className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4" />
                  <span>Details</span>
                </button>
              </div>
            </div>

            {/* Poster Thumbnail */}
            <div className="hidden md:block flex-shrink-0 relative group">
              <img
                src={featured.coverImage}
                alt={featured.title}
                className="w-40 h-56 rounded-2xl object-cover shadow-2xl ring-2 ring-white/15 transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div className="space-y-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono mb-2">
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
            <span>Weekly Airing Schedule • Day-by-Day (IST)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-white flex items-center gap-3">
            <span>Weekly Airing Anime (Day Wise)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Live broadcast schedule converted to Indian Standard Time (UTC+5:30). Explore shows day-by-day throughout the week.
          </p>
        </div>

        {/* FULLY VISIBLE PROMINENT SEARCH BAR */}
        <div className="p-3 sm:p-4 rounded-2xl bg-[#0d1226]/90 border border-purple-500/30 backdrop-blur-md shadow-xl shadow-purple-950/20 space-y-3">
          {/* Search Input Line */}
          <div className="relative w-full">
            <Search className="w-5 h-5 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search weekly schedule worldwide by title (e.g. Tougen Anki, Bleach, Solo Leveling), studio, or genre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchAiring(1, true, searchQuery);
                }
              }}
              className="w-full pl-11 pr-24 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner font-medium"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    fetchAiring(1, true, '');
                  }}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => fetchAiring(1, true, searchQuery)}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-colors flex items-center gap-1"
                title="Search Global Airing Database"
              >
                <span>Search</span>
              </button>
            </div>
          </div>

          {/* Quick Search Chips & Search Status */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              <span className="text-slate-400 font-semibold flex-shrink-0 text-[11px]">Quick Find:</span>
              {['Tougen Anki', 'Bleach', 'DanDaDan', 'Solo Leveling', 'One Piece', 'Blue Lock'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSearchQuery(tag);
                    fetchAiring(1, true, tag);
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all flex-shrink-0 ${
                    searchQuery.toLowerCase() === tag.toLowerCase()
                      ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Showing count indicator */}
            <div className="text-[11px] text-slate-400 font-mono">
              {searchQuery ? (
                <span className="text-purple-300 font-bold">
                  Found {searchedSchedules.length} match{searchedSchedules.length === 1 ? '' : 'es'}
                </span>
              ) : (
                <span>{totalWorldwide} Airing Worldwide</span>
              )}
            </div>
          </div>
        </div>

        {/* DAY SELECTOR & VIEW MODE BAR */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Day Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {/* All Days (Grouped Day-Wise) Option */}
            <button
              onClick={() => setSelectedDay('all_day_wise')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 select-none flex items-center gap-1.5 ${
                selectedDay === 'all_day_wise'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>All Days (Day Wise)</span>
            </button>

            {/* Quick Filter: Today's IST Broadcasts */}
            <button
              onClick={() => setSelectedDay(todayDayIST)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 select-none flex items-center gap-1.5 ${
                selectedDay === todayDayIST
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/40'
                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Today ({todayDayIST})</span>
              <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-black/40 text-emerald-200">
                {dayCounts[todayDayIST] || 0}
              </span>
            </button>

            {/* Individual Day Buttons: Monday to Sunday */}
            {DAYS_ORDER.map((day) => {
              const isSelected = selectedDay === day;
              const isToday = day.toLowerCase() === todayDayIST.toLowerCase();
              const count = dayCounts[day] || 0;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 select-none flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/30'
                      : isToday
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/5'
                  }`}
                >
                  {isToday && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                  <span>{day}</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-black/30 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Current Live Time Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-xs font-mono text-purple-300">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            <span>Today is <strong>{todayDayIST}</strong> (IST)</span>
          </div>
        </div>
      </div>

      {/* RENDER CONTENT */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-72 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : searchQuery.trim() ? (
        /* =========================================================
           DIRECT SEARCH & PREMIERES (Includes Bleach Calamity, Dragon Ball, etc.)
           ========================================================= */
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold font-heading text-white flex items-center gap-2">
                <span>Search Results for "{searchQuery}"</span>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold">
                  {searchedSchedules.length} Shows Found
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Displaying worldwide broadcast schedules, upcoming premier blockbusters, and franchise titles
              </p>
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-purple-300 hover:text-purple-200 underline font-medium"
            >
              Clear Search
            </button>
          </div>

          {searchedSchedules.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-white/5 border border-dashed border-white/10 space-y-3">
              <Search className="w-10 h-10 text-slate-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No shows found matching "{searchQuery}"</p>
              <p className="text-xs text-slate-500">Try searching "Bleach", "Dragon Ball", "Jujutsu Kaisen", or "Solo Leveling"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {searchedSchedules.map(renderAnimeCard)}
            </div>
          )}
        </div>
      ) : selectedDay === 'all_day_wise' ? (
        /* =========================================================
           MODE 1: ALL DAYS GROUPED IN DAY-WISE SECTIONS (MONDAY TO SUNDAY)
           ========================================================= */
        <div className="space-y-10">
          {DAYS_ORDER.map((day) => {
            const dayAnime = dayWiseGroups[day] || [];
            const isToday = day.toLowerCase() === todayDayIST.toLowerCase();

            if (dayAnime.length === 0 && searchQuery) return null; // hide empty days during active search

            return (
              <section key={day} className="space-y-4">
                {/* Day Header Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${
                      isToday 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                        : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                    }`}>
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold font-heading text-white flex items-center gap-2">
                        <span>{day}</span>
                        {isToday && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-wider animate-pulse">
                            🇮🇳 Today's Broadcasts
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {dayAnime.length} {dayAnime.length === 1 ? 'anime' : 'animes'} airing on {day} in Indian Standard Time
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-mono font-bold text-slate-300">
                    {dayAnime.length} Shows
                  </span>
                </div>

                {/* Grid for this Day */}
                {dayAnime.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center text-slate-400 text-xs">
                    No worldwide broadcasts scheduled for {day} on this page.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {dayAnime.map(renderAnimeCard)}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        /* =========================================================
           MODE 2: SINGLE DAY VIEW
           ========================================================= */
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h3 className="text-2xl font-bold font-heading text-white flex items-center gap-2">
                <span>{selectedDay} Airing Lineup</span>
                {selectedDay.toLowerCase() === todayDayIST.toLowerCase() && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-wider animate-pulse">
                    🇮🇳 Today's Lineup
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Displaying all anime scheduled for {selectedDay} in Indian Standard Time (IST).
              </p>
            </div>
            <button
              onClick={() => setSelectedDay('all_day_wise')}
              className="text-xs text-purple-300 hover:text-purple-200 underline font-medium"
            >
              ← Back to All Days
            </button>
          </div>

          {(dayWiseGroups[selectedDay] || []).length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-white/5 border border-dashed border-white/10 space-y-3">
              <Tv className="w-10 h-10 text-slate-500 mx-auto" />
              <p className="text-sm text-slate-300">No scheduled anime found for {selectedDay}.</p>
              <button
                onClick={() => setSelectedDay('all_day_wise')}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
              >
                View Full Weekly Schedule
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {(dayWiseGroups[selectedDay] || []).map(renderAnimeCard)}
            </div>
          )}
        </div>
      )}

      {/* Pagination Load More */}
      {hasNextPage && !loading && (
        <div className="pt-8 text-center">
          <button
            onClick={() => fetchAiring(page + 1, false, searchQuery)}
            disabled={loadingMore}
            className="px-8 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold tracking-wide transition-all shadow-lg hover:shadow-purple-500/10 flex items-center gap-2 mx-auto disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                <span>Loading more airing anime...</span>
              </>
            ) : (
              <>
                <span>Load More Airing Anime ({schedules.length} loaded)</span>
                <ChevronRight className="w-4 h-4 text-purple-300" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
