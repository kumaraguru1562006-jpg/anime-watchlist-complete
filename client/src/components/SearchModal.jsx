import React, { useState, useEffect } from 'react';
import { Search, X, Star, Plus, Check, Eye } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const SearchModal = ({ isOpen, onClose, onOpenDetail }) => {
  const { user, openAuthModal, refreshStats } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState({});

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.searchAnime({ q: query.trim() });
        setResults(data.anime || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const handleQuickAdd = async (anime, status) => {
    if (!user) {
      openAuthModal();
      return;
    }
    try {
      await api.addToWatchlist({
        animeId: anime.id,
        title: anime.title,
        coverImage: anime.coverImage,
        totalEpisodes: anime.episodes,
        status,
        genres: anime.genres,
      });
      setAddedIds((prev) => ({ ...prev, [anime.id]: true }));
      await refreshStats();
      setTimeout(() => {
        setAddedIds((prev) => ({ ...prev, [anime.id]: false }));
      }, 2000);
    } catch (err) {
      alert(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl liquid-glass-nav bg-[#0e1329]/95 rounded-3xl p-5 shadow-2xl border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-purple-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search any anime, movie, or studio..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3 rounded-2xl bg-black/50 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
          <button
            onClick={onClose}
            className="absolute right-3 p-1.5 rounded-xl text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Container */}
        <div className="mt-4 max-h-96 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Searching anime databases...</div>
          ) : results.length > 0 ? (
            results.map((anime) => (
              <div
                key={anime.id}
                className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between gap-3 transition-colors"
              >
                <div
                  onClick={() => {
                    onOpenDetail(anime.id);
                    onClose();
                  }}
                  className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
                >
                  <img
                    src={anime.coverImage}
                    alt={anime.title}
                    className="w-12 h-16 rounded-xl object-cover ring-1 ring-white/10 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-white truncate">{anime.title}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-mono">{anime.format || 'TV'}</span>
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-black/60 border border-white/10">
                        <span className="px-1 py-0.2 rounded bg-[#f5c518] text-black font-black text-[9px] tracking-tight">
                          IMDb
                        </span>
                        <span className="font-bold text-white text-[10px] font-mono">
                          {anime.imdbScore || (anime.score ? (anime.score / 10).toFixed(1) : '8.2')}
                        </span>
                      </div>
                      <span>{anime.genres?.[0]}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleQuickAdd(anime, 'plan_to_watch')}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 border border-purple-500/30 text-xs font-semibold flex items-center gap-1"
                  >
                    {addedIds[anime.id] ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>To Watch</span>
                  </button>
                </div>
              </div>
            ))
          ) : query ? (
            <div className="p-8 text-center text-xs text-slate-500">No matching anime found.</div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              Type anime title to search (e.g. "Jujutsu Kaisen", "One Piece", "Bleach")
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
