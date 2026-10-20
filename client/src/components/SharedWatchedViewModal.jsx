import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Tv, 
  Star, 
  Sparkles, 
  Bookmark, 
  Check, 
  ExternalLink,
  Share2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const SharedWatchedViewModal = ({ onOpenDetail }) => {
  const { user, addToWatchlist, watchlistMap } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sharedData, setSharedData] = useState(null);
  const [addedMap, setAddedMap] = useState({});

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const sharedWatchedUserId = urlParams.get('sharedWatched');

    if (sharedWatchedUserId) {
      setIsOpen(true);
      fetchSharedWatchlist(sharedWatchedUserId);
    }
  }, []);

  const fetchSharedWatchlist = async (userId) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getPublicWatchlist(userId);
      if (res.success && res.items) {
        setSharedData(res);
      } else {
        setError('No completed anime found for this user, or the list is currently private.');
      }
    } catch (err) {
      console.error('Failed to load shared watched list:', err);
      // Fallback: check if we have query params for name
      const urlParams = new URLSearchParams(window.location.search);
      const name = urlParams.get('name') || 'Anime Fan';
      setError(`Unable to load shared records for ${name}. The list may be empty or the link has expired.`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Remove query params from URL without full reload
    if (typeof window !== 'undefined') {
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', newUrl);
    }
  };

  const handleQuickAdd = async (item) => {
    try {
      await addToWatchlist({
        animeId: item.animeId,
        title: item.title,
        englishTitle: item.englishTitle,
        romajiTitle: item.romajiTitle,
        coverImage: item.coverImage,
        format: item.format,
        status: 'plan_to_watch',
        totalEpisodes: item.totalEpisodes,
        genres: item.genres,
      });
      setAddedMap((prev) => ({ ...prev, [item.animeId]: true }));
      setTimeout(() => {
        setAddedMap((prev) => ({ ...prev, [item.animeId]: false }));
      }, 3000);
    } catch (err) {
      alert(`Could not add to watchlist: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  const targetUser = sharedData?.user;
  const stats = sharedData?.stats || {};
  const items = sharedData?.items || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl liquid-glass-card bg-[#080c1f]/95 rounded-3xl p-6 sm:p-8 shadow-2xl border border-cyan-500/30 max-h-[92vh] flex flex-col overflow-hidden space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors z-20"
          title="Close Showcase"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Top Profile Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <img
              src={targetUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
              alt={targetUser?.name || 'User'}
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-500/20"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-semibold">
                  Verified Watched Showcase
                </span>
                <span className="text-[10px] text-purple-300 font-mono">AniCart Community</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-heading text-white mt-0.5">
                {targetUser?.name ? `${targetUser.name}'s Watched List` : 'Anime Watched Showcase'}
              </h2>
            </div>
          </div>

          {/* Quick Statistics Strip */}
          <div className="flex items-center gap-3 sm:gap-4 bg-white/5 p-2.5 rounded-2xl border border-white/10 text-xs">
            <div className="text-center px-2">
              <span className="font-extrabold font-heading text-cyan-300 text-base sm:text-lg block">
                {stats.completedCount || items.length || 0}
              </span>
              <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider block">
                Finished
              </span>
            </div>

            <div className="w-[1px] h-6 bg-white/10" />

            <div className="text-center px-2">
              <span className="font-extrabold font-heading text-indigo-300 text-base sm:text-lg block">
                {stats.totalEpisodesWatched || 0}
              </span>
              <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider block">
                Episodes
              </span>
            </div>

            <div className="w-[1px] h-6 bg-white/10" />

            <div className="text-center px-2">
              <span className="font-extrabold font-heading text-amber-300 text-base sm:text-lg block">
                {stats.averageScore || '0.0'}
              </span>
              <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider block">
                Avg Rating
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-mono">Loading verified anime watched records...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
            <p className="text-sm font-semibold text-white">{error}</p>
            <button
              onClick={handleClose}
              className="mt-2 px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white"
            >
              Back to AniCart Home
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {items.map((item) => {
                const isAlreadyInWatchlist = watchlistMap && watchlistMap[item.animeId];
                const isJustAdded = addedMap[item.animeId];

                return (
                  <div
                    key={item.animeId}
                    className="p-3 rounded-2xl bg-black/40 border border-white/10 hover:border-cyan-500/40 transition-all flex gap-3.5 group shadow-inner"
                  >
                    {/* Poster Image */}
                    <div 
                      onClick={() => onOpenDetail && onOpenDetail(item.animeId)}
                      className="relative w-20 h-28 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer bg-[#050814]"
                    >
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {item.userScore > 0 && (
                        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-bold text-amber-300 flex items-center gap-0.5 border border-amber-500/30">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          <span>{item.userScore}</span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-mono mb-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Finished • {item.episodesWatched || item.totalEpisodes || '?'} eps</span>
                        </div>

                        <h4 
                          onClick={() => onOpenDetail && onOpenDetail(item.animeId)}
                          className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1 cursor-pointer"
                        >
                          {item.title}
                        </h4>

                        {item.englishTitle && item.englishTitle !== item.title && (
                          <p className="text-[11px] text-slate-400 line-clamp-1">
                            {item.englishTitle}
                          </p>
                        )}

                        {item.genres && item.genres.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {item.genres.slice(0, 3).map((g) => (
                              <span
                                key={g}
                                className="px-1.5 py-0.2 rounded bg-white/5 text-[9px] text-slate-300"
                              >
                                {g}
                              </span>
                            ))}
                          </div>
                        )}

                        {item.notes && (
                          <p className="text-[10px] text-purple-300/90 italic line-clamp-1 mt-1.5 bg-purple-950/20 px-2 py-0.5 rounded border border-purple-500/20">
                            "{item.notes}"
                          </p>
                        )}
                      </div>

                      {/* Action Button: Add to My Watchlist */}
                      {user && (
                        <div className="pt-2">
                          <button
                            onClick={() => handleQuickAdd(item)}
                            disabled={isAlreadyInWatchlist || isJustAdded}
                            className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-all flex items-center gap-1 ${
                              isAlreadyInWatchlist || isJustAdded
                                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                                : 'bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 hover:text-white border border-purple-500/40'
                            }`}
                          >
                            {isAlreadyInWatchlist || isJustAdded ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>In Your Watchlist</span>
                              </>
                            ) : (
                              <>
                                <Bookmark className="w-3 h-3 text-purple-400" />
                                <span>Add to My List</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AniCart Liquid Glass Anime Hub</span>
          </div>

          <button
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all"
          >
            Explore AniCart
          </button>
        </div>
      </div>
    </div>
  );
};
