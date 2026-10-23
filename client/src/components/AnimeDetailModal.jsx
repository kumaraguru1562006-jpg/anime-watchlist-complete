import React, { useState, useEffect } from 'react';
import { 
  X, 
  Star, 
  Clock, 
  Calendar, 
  Tv, 
  Building2, 
  Plus, 
  Check, 
  Play, 
  ExternalLink,
  Sparkles,
  Share2,
  Pin
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AnimeDetailModal = ({ animeId, onClose, onActionSuccess }) => {
  const { user, openAuthModal, refreshStats, togglePinAnime, watchlistMap } = useAuth();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionDone, setActionDone] = useState('');

  useEffect(() => {
    if (animeId) {
      loadDetail();
    }
  }, [animeId]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const data = await api.getAnimeDetail(animeId);
      setDetail(data);
    } catch (err) {
      console.error('Error fetching detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (status) => {
    if (!user) {
      openAuthModal();
      return;
    }
    if (!detail) return;

    try {
      await api.addToWatchlist({
        animeId: detail.id,
        title: detail.title,
        englishTitle: detail.englishTitle,
        romajiTitle: detail.romajiTitle,
        coverImage: detail.coverImage,
        bannerImage: detail.bannerImage,
        format: detail.format,
        totalEpisodes: detail.episodes,
        status: status,
        genres: detail.genres,
        airingStatus: detail.status,
      });

      setActionDone(status);
      await refreshStats();
      if (onActionSuccess) onActionSuccess();

      setTimeout(() => setActionDone(''), 3000);
    } catch (err) {
      alert(`Could not save: ${err.message}`);
    }
  };

  if (!animeId) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="relative w-full max-w-3xl my-8 liquid-glass-nav bg-[#0e1329]/95 rounded-3xl overflow-hidden shadow-2xl border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-xl text-slate-300 hover:text-white bg-black/50 backdrop-blur-md border border-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading anime details...</p>
          </div>
        ) : !detail ? (
          <div className="p-8 text-center text-slate-400">
            <p>Could not retrieve anime information.</p>
          </div>
        ) : (
          <div>
            {/* Banner Backdrop */}
            <div className="relative h-48 sm:h-64 overflow-hidden bg-slate-900">
              <img
                src={detail.bannerImage || detail.coverImage}
                alt={detail.title}
                className="w-full h-full object-cover filter brightness-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e1329] via-[#0e1329]/40 to-transparent" />
            </div>

            {/* Main Content Area */}
            <div className="relative px-6 sm:px-8 pb-8 -mt-24 sm:-mt-28 space-y-6">
              {/* Header Profile Section */}
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <img
                  src={detail.coverImage}
                  alt={detail.title}
                  className="w-28 sm:w-36 h-40 sm:h-52 rounded-2xl object-cover ring-2 ring-white/20 shadow-2xl flex-shrink-0"
                />

                <div className="space-y-2 flex-1 pt-2 sm:pt-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-mono font-bold">
                      {detail.format || 'TV'}
                    </span>

                    {Boolean(watchlistMap?.[detail.id]?.isPinned) && (
                      <span className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-bold flex items-center gap-1 shadow-sm">
                        <Pin className="w-3 h-3 fill-amber-400 rotate-45" />
                        Pinned Ongoing
                      </span>
                    )}
                    
                    {/* IMDb Rating Badge */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-black/70 border border-white/20">
                      <span className="px-1 py-0.2 rounded bg-[#f5c518] text-black font-black text-[10px] tracking-tight">
                        IMDb
                      </span>
                      <span className="font-bold text-white text-xs font-mono">
                        {detail.imdbScore || '8.8'}
                      </span>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-lg bg-white/5 text-slate-300 border border-white/10 text-[11px]">
                      {detail.status}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black font-heading text-white leading-tight">
                    {detail.title}
                  </h2>

                  {detail.romajiTitle && detail.romajiTitle !== detail.title && (
                    <p className="text-xs text-slate-400 font-medium">
                      {detail.romajiTitle}
                    </p>
                  )}

                  {/* Indian Standard Time Airing info if releasing */}
                  {detail.nextAiring?.ist && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/80 border border-purple-500/40 text-xs font-mono">
                      <span className="text-amber-300 font-bold">🇮🇳 Airs at:</span>
                      <span className="text-white font-bold">{detail.nextAiring.ist.timeIST}</span>
                      <span className="text-cyan-300">({detail.nextAiring.ist.countdown})</span>
                    </div>
                  )}

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-1 font-medium">
                    {detail.studio && (
                      <span className="flex items-center gap-1 text-purple-300">
                        <Building2 className="w-3.5 h-3.5" /> {detail.studio}
                      </span>
                    )}
                    {detail.episodes && (
                      <span className="flex items-center gap-1">
                        <Tv className="w-3.5 h-3.5" /> {detail.episodes} Episodes
                      </span>
                    )}
                    {detail.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {detail.duration} mins/ep
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {/* Pin Ongoing Button */}
                <button
                  onClick={async () => {
                    if (!user) {
                      openAuthModal();
                      return;
                    }
                    await togglePinAnime(detail);
                    setActionDone('pinned');
                    if (onActionSuccess) onActionSuccess();
                    setTimeout(() => setActionDone(''), 2500);
                  }}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 ${
                    Boolean(watchlistMap?.[detail.id]?.isPinned)
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-black font-extrabold shadow-lg shadow-amber-500/25'
                      : 'bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300'
                  }`}
                  title={Boolean(watchlistMap?.[detail.id]?.isPinned) ? "Unpin anime" : "Pin ongoing anime to your separate showcase shelf"}
                >
                  <Pin className={`w-4 h-4 rotate-45 ${Boolean(watchlistMap?.[detail.id]?.isPinned) ? 'fill-black' : 'fill-amber-400'}`} />
                  <span>
                    {Boolean(watchlistMap?.[detail.id]?.isPinned) ? 'Pinned Ongoing' : 'Pin Ongoing Anime'}
                  </span>
                </button>

                <button
                  onClick={() => handleAdd('plan_to_watch')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2"
                >
                  {actionDone === 'plan_to_watch' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Added to Watchlist!</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add to Plan to Watch</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleAdd('completed')}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-200 font-semibold text-xs transition-all flex items-center gap-2"
                >
                  {actionDone === 'completed' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Marked as Watched!</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Mark as Watched</span>
                    </>
                  )}
                </button>

                {detail.trailer?.site === 'youtube' && (
                  <a
                    href={`https://www.youtube.com/watch?v=${detail.trailer.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-200 font-semibold text-xs transition-all flex items-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-rose-300" />
                    <span>Watch Trailer</span>
                  </a>
                )}
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-1.5">
                {detail.genres?.map((g) => (
                  <span
                    key={g}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300"
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Synopsis */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold font-heading text-white">Synopsis</h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-h-48 overflow-y-auto pr-2">
                  {detail.description?.replace(/<[^>]*>?/gm, '') || 'No synopsis provided.'}
                </p>
              </div>

              {/* Characters Preview */}
              {detail.characters?.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <h4 className="text-sm font-bold font-heading text-white">Main Characters</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {detail.characters.slice(0, 6).map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5"
                      >
                        <img
                          src={c.image?.medium}
                          alt={c.name?.full}
                          className="w-8 h-8 rounded-lg object-cover ring-1 ring-white/10"
                        />
                        <span className="text-xs text-slate-200 truncate">{c.name?.full}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
