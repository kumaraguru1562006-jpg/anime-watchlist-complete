import React, { useState, useEffect } from 'react';
import { 
  Pin, 
  Tv, 
  Plus, 
  Minus, 
  ExternalLink, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Play, 
  X,
  Flame,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const PinnedOngoingShelf = ({ onOpenDetail, onBrowseAiring, className = '' }) => {
  const { user, watchlistMap, togglePinAnime, updateEpisodeProgress } = useAuth();
  const [pinnedList, setPinnedList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sync pinned list directly from reactive watchlistMap
  useEffect(() => {
    if (!user) {
      setPinnedList([]);
      return;
    }

    const items = Object.values(watchlistMap || {}).filter((i) => i.isPinned);
    // Sort by recently updated
    items.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    setPinnedList(items);
  }, [watchlistMap, user]);

  // If user is not logged in or has 0 pinned anime, we don't render clutter,
  // OR we can render a sleek prompt if user is logged in and wants to pin
  if (!user || pinnedList.length === 0) {
    return null;
  }

  return (
    <section className={`space-y-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-300 ${className}`}>
      {/* Shelf Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-[#0d1226] to-rose-950/40 border border-amber-500/30 shadow-xl shadow-amber-950/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 p-[1.5px] shadow-lg shadow-amber-500/25 flex-shrink-0">
            <div className="w-full h-full bg-[#0a0e24] rounded-[10px] flex items-center justify-center">
              <Pin className="w-5 h-5 text-amber-400 rotate-45" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black font-heading text-white flex items-center gap-1.5">
                <span>Pinned Ongoing Anime</span>
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-mono font-bold">
                {pinnedList.length} Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Your highest priority ongoing shows. Track episode progress and next IST airings in 1-click.
            </p>
          </div>
        </div>

        {onBrowseAiring && (
          <button
            onClick={onBrowseAiring}
            className="text-xs text-amber-300 hover:text-amber-200 font-medium inline-flex items-center gap-1 transition-colors self-end sm:self-auto"
          >
            <span>Browse Airing Schedule</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Responsive Grid of Pinned Anime Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pinnedList.map((item) => {
          const episodesWatched = item.episodesWatched || 0;
          const totalEpisodes = item.totalEpisodes || 0;
          const progressPercent = totalEpisodes > 0 
            ? Math.min(100, Math.round((episodesWatched / totalEpisodes) * 100))
            : null;

          return (
            <div
              key={item.animeId}
              className="group relative rounded-2xl liquid-glass-card border border-amber-500/30 hover:border-amber-400/60 p-3.5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 bg-gradient-to-b from-[#101530]/90 to-[#090d20]/90"
            >
              {/* Unpin Button Floating on Top-Right */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePinAnime(item, false);
                }}
                className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-lg bg-black/60 hover:bg-rose-600/80 text-amber-300 hover:text-white border border-amber-500/30 hover:border-rose-400 transition-all shadow-md group/unpin"
                title="Unpin from top shelf"
              >
                <Pin className="w-3.5 h-3.5 fill-amber-400 group-hover/unpin:fill-transparent rotate-45" />
              </button>

              {/* Main Card Content */}
              <div className="flex gap-3.5">
                {/* Poster Thumbnail */}
                <div 
                  onClick={() => onOpenDetail(item.animeId)}
                  className="relative w-20 sm:w-24 h-28 sm:h-32 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer ring-1 ring-white/10 group-hover:ring-amber-400/40 transition-all shadow-lg"
                >
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Pinned pill tag */}
                  <div className="absolute top-1.5 left-1.5">
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-500/90 text-black text-[9px] font-black uppercase tracking-tight flex items-center gap-0.5 shadow-sm">
                      <Pin className="w-2.5 h-2.5 fill-black rotate-45" />
                      Pinned
                    </span>
                  </div>

                  {/* Format tag */}
                  <div className="absolute bottom-1.5 left-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-black/70 border border-white/15 text-[9px] font-mono font-bold text-white">
                      {item.format || 'TV'}
                    </span>
                  </div>
                </div>

                {/* Details Section */}
                <div className="flex-1 min-w-0 pr-6 flex flex-col justify-between">
                  <div>
                    <h3
                      onClick={() => onOpenDetail(item.animeId)}
                      className="text-sm font-bold font-heading text-white line-clamp-2 cursor-pointer hover:text-amber-300 transition-colors leading-snug"
                      title={item.title}
                    >
                      {item.title}
                    </h3>

                    {item.englishTitle && item.englishTitle !== item.title && (
                      <p className="text-[11px] text-slate-400 line-clamp-1 italic mt-0.5">
                        {item.englishTitle}
                      </p>
                    )}

                    {/* Status & Genre pill */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {item.status === 'completed' ? 'Watched' : 'Watching'}
                      </span>
                      {item.genres?.[0] && (
                        <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                          {item.genres[0]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Episode Progress Section */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Episode Progress</span>
                      <span className="font-mono font-bold text-amber-300">
                        {episodesWatched} <span className="text-slate-500">/</span> {totalEpisodes || '?'}
                        {progressPercent !== null && ` (${progressPercent}%)`}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-500 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent !== null ? progressPercent : 25}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                {/* 1-Click +1 Episode Progress */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateEpisodeProgress(item.animeId, -1)}
                    disabled={episodesWatched <= 0}
                    className="p-1.5 rounded-lg bg-black/40 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Previous Episode (-1)"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => updateEpisodeProgress(item.animeId, 1)}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-black font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1"
                    title="Mark Next Episode Watched (+1)"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>+1 Ep</span>
                  </button>
                </div>

                {/* View Details button */}
                <button
                  onClick={() => onOpenDetail(item.animeId)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Details</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
