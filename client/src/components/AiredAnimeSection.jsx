import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Plus, 
  Star, 
  Search, 
  Filter, 
  Eye, 
  Tv, 
  Sparkles, 
  Layers, 
  ArrowUpDown,
  CheckCircle2,
  Bookmark,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AiredAnimeSection = ({ onOpenDetail }) => {
  const { user, openAuthModal, watchlistMap, toggleWatchlistStatus } = useAuth();
  const [animeList, setAnimeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [sortBy, setSortBy] = useState('POPULARITY_DESC'); // POPULARITY_DESC | SCORE_DESC | START_DATE_DESC
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionDone, setActionDone] = useState({});

  const genres = [
    'All',
    'Action',
    'Adventure',
    'Psychological',
    'Mystery',
    'Fantasy',
    'Drama',
    'Sci-Fi',
    'Supernatural',
    'Comedy',
    'Romance',
    'Thriller',
  ];

  const sortOptions = [
    { label: '🔥 All-Time Popular', value: 'POPULARITY_DESC' },
    { label: '⭐ Top Rated Classics', value: 'SCORE_DESC' },
    { label: '📅 Recently Aired', value: 'START_DATE_DESC' },
  ];

  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    fetchAiredAnime(1, true);
  }, [sortBy, selectedGenre]);

  // Debounced search as user types
  useEffect(() => {
    const q = searchQuery.trim();
    if (q) {
      setHasSearched(true);
      const timer = setTimeout(() => {
        fetchAiredAnime(1, true, q);
      }, 400);
      return () => clearTimeout(timer);
    } else if (hasSearched) {
      setHasSearched(false);
      fetchAiredAnime(1, true, '');
    }
  }, [searchQuery]);

  const fetchAiredAnime = async (pageNum = 1, reset = false, query = searchQuery) => {
    setLoading(true);
    try {
      const data = await api.getAiredAnime({
        page: pageNum,
        perPage: 24,
        sort: sortBy,
        genre: selectedGenre,
        q: query,
      });

      if (reset) {
        setAnimeList(data.anime || []);
      } else {
        setAnimeList((prev) => [...prev, ...(data.anime || [])]);
      }

      setHasNextPage(data.pageInfo?.hasNextPage || false);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching aired anime:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    fetchAiredAnime(1, true, searchQuery.trim());
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-white">
            All Aired Anime (Finished Series & Classics)
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
            Complete Catalog
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Browse all finished anime of all time. Mark what you've already watched or add them to your watch list.
        </p>
      </div>

      {/* FULL-WIDTH PROMINENT SEARCH BAR */}
      <div className="p-3 sm:p-4 rounded-2xl bg-[#0d1226]/90 border border-emerald-500/30 backdrop-blur-md shadow-xl shadow-emerald-950/20 space-y-3">
        {/* Search Input Line */}
        <form onSubmit={handleSearch} className="relative w-full">
          <Search className="w-5 h-5 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search aired anime database by title (e.g. Death Note, Naruto, Attack on Titan, Hunter x Hunter)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-24 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner font-medium"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  fetchAiredAnime(1, true, '');
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors flex items-center gap-1"
            >
              <span>Search</span>
            </button>
          </div>
        </form>

        {/* Quick Find Tags */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <span className="text-slate-400 font-semibold flex-shrink-0 text-[11px]">Classics:</span>
            {['Death Note', 'Naruto', 'Attack on Titan', 'Fullmetal Alchemist', 'Steins;Gate', 'Hunter x Hunter'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setSearchQuery(tag);
                  fetchAiredAnime(1, true, tag);
                }}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all flex-shrink-0 ${
                  searchQuery.toLowerCase() === tag.toLowerCase()
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            {searchQuery ? (
              <span className="text-emerald-300 font-bold">Searching: "{searchQuery}"</span>
            ) : (
              <span>Catalog Page {page}</span>
            )}
          </div>
        </div>
      </div>

      {/* Filter & Sort Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
        {/* Sort Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/30 border border-white/10">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                sortBy === opt.value
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Active watch count helper */}
        {user && (
          <div className="text-xs text-slate-400 flex items-center gap-3">
            <span className="flex items-center gap-1 text-cyan-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Watched items marked in green</span>
            </span>
            <span className="flex items-center gap-1 text-purple-300">
              <Bookmark className="w-3.5 h-3.5" />
              <span>To-Watch items marked in purple</span>
            </span>
          </div>
        )}
      </div>

      {/* Genre Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {genres.map((g) => (
          <button
            key={g}
            onClick={() => setSelectedGenre(g)}
            className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              selectedGenre === g
                ? 'bg-purple-600/30 text-purple-200 border border-purple-500/50 shadow-md'
                : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/5'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Anime Grid */}
      {loading && animeList.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-72 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : animeList.length === 0 ? (
        <div className="p-12 text-center rounded-2xl liquid-glass-card border border-white/10 text-slate-400">
          <p className="text-sm font-semibold text-white">No aired anime found matching your query.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedGenre('All');
              fetchAiredAnime(1, true);
            }}
            className="mt-3 px-4 py-1.5 rounded-xl bg-purple-600 text-xs font-semibold text-white"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {animeList.map((anime) => {
            const safeWatchlistMap = watchlistMap || {};
            const watchItem = safeWatchlistMap[anime.id];
            const isWatched = watchItem?.status === 'completed';
            const isToWatch = watchItem?.status === 'plan_to_watch';
            const isWatching = watchItem?.status === 'watching';

            return (
              <div
                key={anime.id}
                className={`group rounded-2xl overflow-hidden liquid-glass-card flex flex-col justify-between border transition-all ${
                  isWatched
                    ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                    : isToWatch
                    ? 'border-purple-500/50 shadow-lg shadow-purple-500/10'
                    : 'border-white/10 hover:border-purple-500/30'
                }`}
              >
                {/* Poster Cover */}
                <div className="relative h-56 sm:h-64 overflow-hidden">
                  <img
                    src={anime.coverImage}
                    alt={anime.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e1329] via-transparent to-black/50 pointer-events-none" />

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-slate-300 border border-white/10">
                      {anime.episodes ? `${anime.episodes} ep` : 'Movie'}
                    </span>
                    
                    {/* IMDb Rating Badge */}
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-black/75 backdrop-blur-md border border-white/20 shadow-sm">
                      <span className="px-1 py-0.2 rounded bg-[#f5c518] text-black font-black text-[9px] tracking-tight">
                        IMDb
                      </span>
                      <span className="font-bold text-white text-[11px] font-mono">
                        {anime.imdbScore || '8.4'}
                      </span>
                    </div>
                  </div>

                  {/* User Status Ribbon (if watched or to-watch) */}
                  {isWatched && (
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="px-2 py-1 rounded-xl bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 text-[10px] font-bold text-emerald-300 flex items-center justify-center gap-1 shadow-md">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>WATCHED</span>
                        {watchItem.userScore > 0 && <span>({watchItem.userScore}★)</span>}
                      </div>
                    </div>
                  )}

                  {isToWatch && (
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="px-2 py-1 rounded-xl bg-purple-950/80 backdrop-blur-md border border-purple-500/40 text-[10px] font-bold text-purple-300 flex items-center justify-center gap-1 shadow-md">
                        <Bookmark className="w-3 h-3 text-purple-400" />
                        <span>IN TO WATCH</span>
                      </div>
                    </div>
                  )}

                  {/* Hover Quick Action Buttons */}
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

                {/* Details */}
                <div className="p-3 space-y-1">
                  <h3
                    onClick={() => onOpenDetail(anime.id)}
                    className="text-xs sm:text-sm font-bold font-heading text-white line-clamp-1 hover:text-purple-300 cursor-pointer transition-colors"
                    title={anime.title}
                  >
                    {anime.title}
                  </h3>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="truncate max-w-[85px]">{anime.studio || anime.genres?.[0]}</span>
                    <span>{anime.year || ''}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination / Load More */}
      {hasNextPage && (
        <div className="text-center pt-6">
          <button
            onClick={() => fetchAiredAnime(page + 1, false)}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold transition-all shadow-lg"
          >
            {loading ? 'Loading more anime...' : 'Load More Aired Anime'}
          </button>
        </div>
      )}
    </div>
  );
};
