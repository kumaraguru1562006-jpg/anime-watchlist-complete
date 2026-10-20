import React, { useState, useEffect } from 'react';
import { Search, Star, Plus, Check, Eye, Compass, Sparkles, Filter } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const DiscoverSection = ({ onOpenDetail, onAnimeAction }) => {
  const { user, openAuthModal, refreshStats } = useAuth();
  const [animeList, setAnimeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [actionSuccess, setActionSuccess] = useState({});

  const genres = [
    'All',
    'Action',
    'Adventure',
    'Comedy',
    'Drama',
    'Fantasy',
    'Romance',
    'Sci-Fi',
    'Supernatural',
    'Mystery',
    'Slice of Life',
  ];

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      const data = await api.getTrendingAnime();
      setAnimeList(data.anime || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      if (!searchQuery && selectedGenre === 'All') {
        await fetchTrending();
        return;
      }
      const data = await api.searchAnime({
        q: searchQuery,
        genre: selectedGenre,
      });
      setAnimeList(data.anime || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenreClick = async (genre) => {
    setSelectedGenre(genre);
    setLoading(true);
    try {
      if (genre === 'All' && !searchQuery) {
        await fetchTrending();
      } else {
        const data = await api.searchAnime({
          q: searchQuery,
          genre: genre,
        });
        setAnimeList(data.anime || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (anime, status) => {
    if (!user) {
      openAuthModal();
      return;
    }

    try {
      await api.addToWatchlist({
        animeId: anime.id,
        title: anime.title,
        englishTitle: anime.englishTitle,
        romajiTitle: anime.romajiTitle,
        coverImage: anime.coverImage,
        bannerImage: anime.bannerImage,
        format: anime.format,
        totalEpisodes: anime.episodes,
        status: status,
        genres: anime.genres,
        airingStatus: anime.status,
      });

      setActionSuccess((prev) => ({
        ...prev,
        [`${anime.id}_${status}`]: true,
      }));

      await refreshStats();
      if (onAnimeAction) onAnimeAction();

      setTimeout(() => {
        setActionSuccess((prev) => ({
          ...prev,
          [`${anime.id}_${status}`]: false,
        }));
      }, 2500);
    } catch (err) {
      alert(`Could not add anime: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-white flex items-center gap-2">
            <span>Discover Top & Trending Anime</span>
            <Compass className="w-5 h-5 text-purple-400" />
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Search thousands of anime titles and populate your MongoDB watchlists.
          </p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="relative flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search anime (e.g. Demon Slayer, Attack on Titan)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all whitespace-nowrap"
          >
            Search
          </button>
        </form>
      </div>

      {/* Genre Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {genres.map((genre) => (
          <button
            key={genre}
            onClick={() => handleGenreClick(genre)}
            className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              selectedGenre === genre
                ? 'bg-purple-600/30 text-purple-200 border border-purple-500/50 shadow-md'
                : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/5'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* Anime Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : animeList.length === 0 ? (
        <div className="p-12 text-center rounded-2xl liquid-glass-card border border-white/10 text-slate-400">
          <p className="text-sm font-semibold text-white">No anime found matching your query.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedGenre('All');
              fetchTrending();
            }}
            className="mt-3 px-4 py-1.5 rounded-xl bg-purple-600 text-xs font-semibold text-white"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {animeList.map((anime) => (
            <div
              key={anime.id}
              className="group rounded-2xl overflow-hidden liquid-glass-card flex flex-col justify-between border border-white/10 hover:border-purple-500/40 transition-all"
            >
              <div className="relative h-56 sm:h-64 overflow-hidden">
                <img
                  src={anime.coverImage}
                  alt={anime.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e1329] via-transparent to-black/40 pointer-events-none" />

                {/* Badges */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-slate-300 border border-white/10">
                    {anime.format || 'TV'}
                  </span>
                  {anime.score && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-amber-300 border border-white/10 flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-300" />
                      {anime.score}
                    </span>
                  )}
                </div>

                {/* Hover overlay quick buttons */}
                <div className="absolute inset-0 bg-black/75 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                  <button
                    onClick={() => handleAdd(anime, 'plan_to_watch')}
                    className="w-full py-1.5 px-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold transition-all flex items-center justify-center gap-1 shadow-lg"
                  >
                    {actionSuccess[`${anime.id}_plan_to_watch`] ? (
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>To Watch</span>
                  </button>

                  <button
                    onClick={() => handleAdd(anime, 'completed')}
                    className="w-full py-1.5 px-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold transition-all flex items-center justify-center gap-1 shadow-lg"
                  >
                    {actionSuccess[`${anime.id}_completed`] ? (
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Watched</span>
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
              <div className="p-3 space-y-1">
                <h3
                  onClick={() => onOpenDetail(anime.id)}
                  className="text-xs sm:text-sm font-bold font-heading text-white line-clamp-1 hover:text-purple-300 cursor-pointer transition-colors"
                  title={anime.title}
                >
                  {anime.title}
                </h3>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="truncate max-w-[80px]">{anime.genres?.[0] || 'Anime'}</span>
                  <span>{anime.year || anime.episodes ? `${anime.episodes || '?'} ep` : ''}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
