import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Sparkles, 
  Plus, 
  Check, 
  Eye, 
  Tv, 
  Star, 
  Filter, 
  Search,
  Flame,
  ArrowUpDown,
  Tag,
  Film,
  X,
  Layers,
  CloudRain,
  Sun,
  Snowflake,
  Flower2,
  Leaf,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ThisYearAiringSection = ({ onOpenDetail }) => {
  const { user, openAuthModal, watchlistMap, toggleWatchlistStatus } = useAuth();
  const [animeList, setAnimeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMoreSeason, setLoadingMoreSeason] = useState(false);
  const [seasonPages, setSeasonPages] = useState({
    SPRING: 1,
    SUMMER: 1,
    FALL: 1,
    WINTER: 1,
  });
  const [hasMoreSeason, setHasMoreSeason] = useState({
    SPRING: true,
    SUMMER: true,
    FALL: true,
    WINTER: true,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('All'); // 'All' | 'TV' | 'MOVIE' | 'ONA'
  
  // Seasonal split tab: 'all_split' | 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER'
  const [selectedSeason, setSelectedSeason] = useState('all_split');
  const [sortBy, setSortBy] = useState('month'); // 'month' | 'popularity' | 'rating'
  const [actionDone, setActionDone] = useState({});

  const SEASONS_CONFIG = [
    {
      id: 'SPRING',
      label: '🌸 Spring 2026',
      shortLabel: 'Spring',
      period: 'April – June',
      indianSeason: 'Vasant (Spring)',
      icon: Flower2,
      color: 'from-pink-500/20 to-rose-500/20 border-pink-500/40 text-pink-300',
      badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      accentColor: 'text-pink-300',
    },
    {
      id: 'SUMMER',
      label: '🌧️ Monsoon / Summer 2026',
      shortLabel: 'Monsoon / Summer',
      period: 'July – September',
      indianSeason: 'Varsha & Grishma (Monsoon / Summer)',
      icon: CloudRain,
      color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/40 text-cyan-300',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      accentColor: 'text-cyan-300',
    },
    {
      id: 'FALL',
      label: '🍂 Autumn / Fall 2026',
      shortLabel: 'Autumn / Fall',
      period: 'October – December',
      indianSeason: 'Sharad (Autumn / Fall)',
      icon: Leaf,
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-300',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      accentColor: 'text-amber-300',
    },
    {
      id: 'WINTER',
      label: '❄️ Winter 2026',
      shortLabel: 'Winter',
      period: 'January – March',
      indianSeason: 'Hemant & Shishir (Winter)',
      icon: Snowflake,
      color: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/40 text-indigo-300',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      accentColor: 'text-indigo-300',
    },
  ];

  useEffect(() => {
    fetchThisYearAnime();
  }, []);

  const fetchThisYearAnime = async () => {
    setLoading(true);
    try {
      const data = await api.getThisYearAnime({ year: 2026 });
      setAnimeList(data.anime || []);
    } catch (err) {
      console.error('Failed to load this year anime:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMoreSeason = async (seasonId) => {
    if (loadingMoreSeason) return;
    setLoadingMoreSeason(true);
    const nextPage = (seasonPages[seasonId] || 1) + 1;
    try {
      const data = await api.getThisYearAnime({ year: 2026, season: seasonId, page: nextPage, perPage: 50 });
      const newItems = data.anime || [];
      if (newItems.length > 0) {
        setAnimeList((prev) => {
          const existingMap = new Map(prev.map((a) => [a.id, a]));
          for (const item of newItems) {
            existingMap.set(item.id, item);
          }
          return Array.from(existingMap.values());
        });
        setSeasonPages((prev) => ({ ...prev, [seasonId]: nextPage }));
      }
      if (newItems.length < 50 || !data.pageInfo?.hasNextPage) {
        setHasMoreSeason((prev) => ({ ...prev, [seasonId]: false }));
      }
    } catch (err) {
      console.error(`Failed to load more ${seasonId} anime:`, err);
    } finally {
      setLoadingMoreSeason(false);
    }
  };

  // Helper to resolve an anime's season
  const resolveSeason = (item) => {
    if (item.season) return item.season;
    const m = item.startMonth;
    if ([4, 5, 6].includes(m)) return 'SPRING';
    if ([7, 8, 9].includes(m)) return 'SUMMER';
    if ([10, 11, 12].includes(m)) return 'FALL';
    if ([1, 2, 3].includes(m)) return 'WINTER';
    return 'FALL'; // default fallback for ongoing fall
  };

  // Search and format filter
  const filteredAnime = useMemo(() => {
    let result = [...animeList];

    // Search query filter (checks title, english, romaji, studio, genres, month, badge)
    if (searchQuery.trim()) {
      let rawQ = searchQuery.toLowerCase().trim();
      let q = rawQ.replace(/\b(upcoming|airing|new|latest|all|shows|anime|season|calendar)\b/gi, '').trim();
      if (!q) q = rawQ;

      if (q.includes('dragonboll')) q = q.replace(/dragonboll/g, 'dragon ball');
      if (q.includes('dragonball')) q = q.replace(/dragonball/g, 'dragon ball');
      if (q === 'tybw') q = 'thousand-year blood war';

      result = result.filter((item) => {
        const titleMatch = (item.title || '').toLowerCase().includes(q) ||
                           (item.englishTitle || '').toLowerCase().includes(q) ||
                           (item.romajiTitle || '').toLowerCase().includes(q) ||
                           (item.nativeTitle || '').toLowerCase().includes(q);
        const studioMatch = (item.studio || '').toLowerCase().includes(q);
        const genreMatch = (item.genres || []).some((g) => g.toLowerCase().includes(q));
        const monthMatch = (item.startMonthName || '').toLowerCase().includes(q);
        const badgeMatch = (item.airingMonthBadge || '').toLowerCase().includes(q);
        const seasonMatch = (item.season || '').toLowerCase().includes(q) ||
                            (q.includes('spring') && resolveSeason(item) === 'SPRING') ||
                            ((q.includes('monsoon') || q.includes('summer')) && resolveSeason(item) === 'SUMMER') ||
                            ((q.includes('fall') || q.includes('autumn')) && resolveSeason(item) === 'FALL') ||
                            (q.includes('winter') && resolveSeason(item) === 'WINTER');

        // Extra keyword tolerance for Bleach Calamity & Dragon Ball
        const calamityMatch = (q.includes('calamity') || rawQ.includes('calamity')) && ((item.title || '').toLowerCase().includes('calamity') || (item.englishTitle || '').toLowerCase().includes('calamity') || (item.title || '').toLowerCase().includes('bleach'));
        const dragonMatch = (q.includes('dragon') || q.includes('ball') || rawQ.includes('dragonboll')) && ((item.title || '').toLowerCase().includes('dragon') || (item.englishTitle || '').toLowerCase().includes('dragon'));

        return titleMatch || studioMatch || genreMatch || monthMatch || badgeMatch || seasonMatch || calamityMatch || dragonMatch;
      });
    }

    // Format filter
    if (selectedFormat !== 'All') {
      result = result.filter((item) => item.format === selectedFormat);
    }

    // Sort order
    result.sort((a, b) => {
      if (sortBy === 'month') {
        const mA = a.startMonth || 99;
        const mB = b.startMonth || 99;
        if (mA !== mB) return mA - mB;
        return (b.popularity || 0) - (a.popularity || 0);
      }
      if (sortBy === 'rating') {
        return parseFloat(b.imdbScore || 0) - parseFloat(a.imdbScore || 0);
      }
      return (b.popularity || 0) - (a.popularity || 0);
    });

    return result;
  }, [animeList, searchQuery, selectedFormat, sortBy]);

  // Group anime by season
  const seasonalGroups = useMemo(() => {
    const groups = {
      SPRING: [],
      SUMMER: [],
      FALL: [],
      WINTER: [],
    };

    for (const item of filteredAnime) {
      const seasonKey = resolveSeason(item);
      if (groups[seasonKey]) {
        groups[seasonKey].push(item);
      } else {
        groups.FALL.push(item);
      }
    }

    return groups;
  }, [filteredAnime]);

  // Seasonal counts
  const seasonCounts = useMemo(() => {
    return {
      SPRING: seasonalGroups.SPRING?.length || 0,
      SUMMER: seasonalGroups.SUMMER?.length || 0,
      FALL: seasonalGroups.FALL?.length || 0,
      WINTER: seasonalGroups.WINTER?.length || 0,
      TOTAL: filteredAnime.length,
    };
  }, [seasonalGroups, filteredAnime]);

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

  // Render an individual card
  const renderCard = (anime) => {
    const watchItem = safeWatchlistMap[anime.id];
    const isWatched = watchItem?.status === 'completed';
    const isToWatch = watchItem?.status === 'plan_to_watch';

    return (
      <div
        key={anime.id}
        className={`group relative rounded-2xl overflow-hidden liquid-glass-card flex flex-col justify-between border transition-all ${
          isWatched
            ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10'
            : isToWatch
            ? 'border-purple-500/50 shadow-lg shadow-purple-500/10'
            : 'border-white/10 hover:border-cyan-500/40'
        }`}
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

          {/* Top Badges: Format & IMDb Score */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none">
            <span className="px-2 py-0.5 rounded-lg bg-black/65 backdrop-blur-md border border-white/15 text-[10px] font-mono font-bold text-white uppercase">
              {anime.format || 'TV'}
            </span>

            {/* Official IMDb Rating Badge */}
            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-black/75 backdrop-blur-md border border-white/20 shadow-sm">
              <span className="px-1 py-0.2 rounded bg-[#f5c518] text-black font-black text-[9px] tracking-tight">
                IMDb
              </span>
              <span className="font-bold text-white text-[11px] font-mono">
                {anime.imdbScore || '8.3'}
              </span>
            </div>
          </div>

          {/* PROMINENT MONTH OF AIRING BADGE */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5">
            <div className="px-3 py-1.5 rounded-xl bg-[#090d1f]/90 backdrop-blur-md border border-cyan-400/50 shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 truncate">
                <Calendar className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span className="truncate">
                  {anime.airingMonthBadge || (anime.startMonthName ? `Airing in ${anime.startMonthName} 2026` : 'Airing in 2026')}
                </span>
              </div>
              {anime.season && (
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 flex-shrink-0 ml-1">
                  {anime.season}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1">
              <span className="font-semibold text-cyan-300">{anime.studio}</span>
              <span>•</span>
              <span>{anime.episodes ? `${anime.episodes} Eps` : 'Ongoing'}</span>
            </div>

            <h3
              onClick={() => onOpenDetail(anime.id)}
              className="font-bold text-sm text-white line-clamp-1 group-hover:text-cyan-300 transition-colors cursor-pointer"
              title={anime.title}
            >
              {anime.title}
            </h3>

            {anime.englishTitle && anime.englishTitle !== anime.title && (
              <p className="text-[11px] text-slate-400 line-clamp-1 italic">
                {anime.englishTitle}
              </p>
            )}

            {/* Genre tags */}
            <div className="flex flex-wrap gap-1 mt-2">
              {(anime.genres || []).slice(0, 3).map((g) => (
                <span
                  key={g}
                  className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] text-slate-300 font-medium"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* 1-Click Action Buttons */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-1.5">
            <button
              onClick={() => handleToggle(anime, 'plan_to_watch')}
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
              onClick={() => handleToggle(anime, 'completed')}
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
              onClick={() => onOpenDetail(anime.id)}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors"
              title="View Details"
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
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden liquid-glass border border-white/10 p-6 sm:p-8">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>2026 Seasonal Lineup • Spring, Monsoon, Autumn & Winter</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black font-heading tracking-tight text-white leading-tight">
            Airing This Year (2026 Season Showcase)
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Explore all 2026 anime split into seasonal broadcasts: Spring, Monsoon / Summer, Autumn, and Winter. 
            Search across any title, studio, or genre with real-time responsive filtering.
          </p>
        </div>
      </div>

      {/* FULLY VISIBLE, DEDICATED SEARCH BAR */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-xl space-y-4">
        {/* Search input line */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search this year's anime by title, English name, studio, month, or season..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Controls row: Format, Sort, Counter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/5 text-xs">
          {/* Format pills */}
          <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-xl border border-white/5">
            {['All', 'TV', 'MOVIE'].map((fmt) => (
              <button
                key={fmt}
                onClick={() => setSelectedFormat(fmt)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedFormat === fmt
                    ? 'bg-cyan-600 text-white font-semibold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {fmt === 'All' ? 'All Formats' : fmt}
              </button>
            ))}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/30 border border-white/5 text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="month" className="bg-[#0e1329] text-white">Sort by Air Month (Jan → Dec)</option>
              <option value="popularity" className="bg-[#0e1329] text-white">Sort by Popularity</option>
              <option value="rating" className="bg-[#0e1329] text-white">Sort by IMDb Rating</option>
            </select>
          </div>

          {/* Match counter */}
          <div className="text-slate-400">
            <span>Showing <strong>{filteredAnime.length}</strong> of {animeList.length} anime</span>
          </div>
        </div>
      </div>

      {/* SEASONAL SPLIT SELECTOR TABS (SPRING, MONSOON / SUMMER, AUTUMN, WINTER) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Split by Season:</span>
          </span>
          <span className="text-[11px] text-slate-500">2026 Seasonal Broadcasts</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {/* All Seasons (Split by Season View) */}
          <button
            onClick={() => setSelectedSeason('all_split')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all select-none flex items-center gap-1.5 ${
              selectedSeason === 'all_split'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30 border border-cyan-400/40'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Seasons (Split View)</span>
            <span className="px-1.5 py-0.2 rounded bg-black/40 text-[10px] font-mono">
              {seasonCounts.TOTAL}
            </span>
          </button>

          {/* Individual Season Tabs */}
          {SEASONS_CONFIG.map((s) => {
            const isSelected = selectedSeason === s.id;
            const count = seasonCounts[s.id] || 0;
            const Icon = s.icon;

            return (
              <button
                key={s.id}
                onClick={() => setSelectedSeason(s.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all select-none flex items-center gap-2 ${
                  isSelected
                    ? `bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40`
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{s.label}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-black/30 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RENDER CONTENT */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-80 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : filteredAnime.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-white/5 border border-dashed border-white/10 space-y-3">
          <Calendar className="w-10 h-10 text-slate-500 mx-auto" />
          <p className="text-sm text-slate-300">No 2026 anime found matching "{searchQuery}".</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedFormat('All');
              setSelectedSeason('all_split');
            }}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
          >
            Reset Search & Filters
          </button>
        </div>
      ) : selectedSeason === 'all_split' ? (
        /* =========================================================
           MODE 1: ALL SEASONS SPLIT INTO DEDICATED SEASON SECTIONS
           ========================================================= */
        <div className="space-y-12">
          {SEASONS_CONFIG.map((s) => {
            const list = seasonalGroups[s.id] || [];
            const Icon = s.icon;

            if (list.length === 0 && searchQuery) return null; // hide empty seasons during search

            return (
              <section key={s.id} className="space-y-4">
                {/* Seasonal Section Header */}
                <div className="p-4 rounded-2xl bg-gradient-to-r bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${s.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold font-heading text-white flex items-center gap-2">
                        <span>{s.label}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-normal">
                          {s.period}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        {s.indianSeason} • {list.length} anime broadcasting in this season
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedSeason(s.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border ${s.badgeColor} hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm`}
                    title={`Explore all ${s.shortLabel} anime`}
                  >
                    <span>{list.length} Shows</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Anime Cards Grid */}
                {list.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-white/5 border border-dashed border-white/10 text-xs text-slate-400">
                    No anime found for {s.shortLabel} matching your current filters.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {list.map(renderCard)}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        /* =========================================================
           MODE 2: SINGLE SEASON SELECTED VIEW
           ========================================================= */
        <div className="space-y-6">
          {(() => {
            const currentCfg = SEASONS_CONFIG.find((s) => s.id === selectedSeason) || SEASONS_CONFIG[0];
            const list = seasonalGroups[selectedSeason] || [];
            const Icon = currentCfg.icon;

            return (
              <>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${currentCfg.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold font-heading text-white">
                        {currentCfg.label}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {currentCfg.period} ({currentCfg.indianSeason})
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedSeason('all_split')}
                    className="text-xs text-cyan-300 hover:text-cyan-200 underline font-medium"
                  >
                    ← Back to All Seasons
                  </button>
                </div>

                {list.length === 0 ? (
                  <div className="py-16 text-center rounded-2xl bg-white/5 border border-dashed border-white/10 text-slate-400 text-xs space-y-2">
                    <p>No anime found in {currentCfg.shortLabel}.</p>
                    <button
                      onClick={() => setSelectedSeason('all_split')}
                      className="px-4 py-1.5 rounded-xl bg-cyan-600 text-white text-xs font-semibold"
                    >
                      View All Seasons
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {list.map(renderCard)}
                    </div>

                    {/* Load More Button for Selected Season */}
                    {!searchQuery && hasMoreSeason[selectedSeason] && (
                      <div className="pt-8 pb-4 text-center">
                        <button
                          onClick={() => handleLoadMoreSeason(selectedSeason)}
                          disabled={loadingMoreSeason}
                          className="px-8 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold tracking-wide transition-all shadow-lg hover:shadow-cyan-500/10 flex items-center gap-2 mx-auto disabled:opacity-50"
                        >
                          {loadingMoreSeason ? (
                            <>
                              <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                              <span>Loading more {currentCfg.shortLabel} anime...</span>
                            </>
                          ) : (
                            <>
                              <span>Load More {currentCfg.label} Anime ({list.length} showing)</span>
                              <ChevronRight className="w-4 h-4 text-cyan-300" />
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};
