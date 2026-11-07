import React, { useState, useEffect, useMemo } from 'react';
import { 
  Pin, 
  Tv, 
  Plus, 
  Minus, 
  Trash2, 
  Star, 
  Edit3, 
  Sparkles, 
  ExternalLink, 
  Search, 
  X, 
  CheckCircle2, 
  Bookmark,
  Calendar,
  Clock,
  Flame,
  Check,
  ArrowUpDown,
  Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const PinnedAnimePage = ({ onOpenDetail, onBrowseAiring }) => {
  const { user, openAuthModal, watchlistMap, togglePinAnime, updateEpisodeProgress, refreshStats } = useAuth();
  const [pinnedItems, setPinnedItems] = useState([]);
  const [schedules, setSchedules] = useState({});
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('next_airing'); // 'next_airing' | 'pinned_recent' | 'release_date' | 'title'
  const [filterSchedule, setFilterSchedule] = useState('all'); // 'all' | 'airing_soon' | 'completed'
  const [editingNotesItem, setEditingNotesItem] = useState(null);
  const [tempNotes, setTempNotes] = useState('');

  // Hydrate pinned items reactively from watchlistMap
  useEffect(() => {
    if (!user) {
      setPinnedItems([]);
      return;
    }

    const items = Object.values(watchlistMap || {}).filter((i) => i.isPinned);
    items.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    setPinnedItems(items);
  }, [watchlistMap, user]);

  // Fetch real-time release dates & airing times (IST) for all pinned anime
  useEffect(() => {
    let isMounted = true;
    const loadSchedules = async () => {
      if (!user) return;
      try {
        const data = await api.getPinnedSchedule();
        if (isMounted && data?.schedules) {
          setSchedules(data.schedules);
        }
      } catch (err) {
        console.warn('Failed to load pinned schedules:', err);
      } finally {
        if (isMounted) setLoadingSchedules(false);
      }
    };

    loadSchedules();
    // Auto-refresh schedules every 60s for live IST countdowns
    const timer = setInterval(loadSchedules, 60000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [user, pinnedItems.length]);

  const handleStatusChange = async (item, newStatus) => {
    try {
      const isFinishing = newStatus === 'completed';
      const episodesWatched = isFinishing ? item.totalEpisodes || item.episodesWatched : item.episodesWatched;

      await api.updateWatchlistItem(item.animeId, {
        status: newStatus,
        episodesWatched,
      });

      if (isFinishing) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#ec4899', '#8b5cf6', '#00f2fe'],
        });
      }

      await refreshStats();
    } catch (err) {
      alert(`Could not update status: ${err.message}`);
    }
  };

  const handleScoreChange = async (item, score) => {
    try {
      await api.updateWatchlistItem(item.animeId, {
        userScore: Number(score),
      });
      await refreshStats();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveNotes = async () => {
    if (!editingNotesItem) return;
    try {
      await api.updateWatchlistItem(editingNotesItem.animeId, {
        notes: tempNotes,
      });
      setEditingNotesItem(null);
      await refreshStats();
    } catch (err) {
      alert(`Error saving notes: ${err.message}`);
    }
  };

  // Find the pinned anime whose next episode airs the soonest
  const soonestAiringShow = useMemo(() => {
    const upcoming = pinnedItems
      .map((item) => {
        const sched = schedules[item.animeId];
        const airingAt = sched?.nextAiring?.airingAt || item.nextEpisodeAiringAt;
        return { item, sched, airingAt };
      })
      .filter((x) => x.sched?.nextAiring && x.airingAt)
      .sort((a, b) => a.airingAt - b.airingAt);

    return upcoming[0] || null;
  }, [pinnedItems, schedules]);

  // Counts for filter pills
  const airingSoonCount = useMemo(() => {
    return pinnedItems.filter((i) => Boolean(schedules[i.animeId]?.nextAiring)).length;
  }, [pinnedItems, schedules]);

  const completedCount = useMemo(() => {
    return pinnedItems.filter((i) => i.status === 'completed' || schedules[i.animeId]?.airingStatus === 'FINISHED').length;
  }, [pinnedItems, schedules]);

  // Filter and Sort pinned anime list
  const processedItems = useMemo(() => {
    let list = [...pinnedItems];

    // Search query filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter((item) => {
        const sched = schedules[item.animeId];
        return (
          item.title?.toLowerCase().includes(term) ||
          item.englishTitle?.toLowerCase().includes(term) ||
          item.genres?.some((g) => g.toLowerCase().includes(term)) ||
          sched?.releaseDateText?.toLowerCase().includes(term) ||
          sched?.nextAiring?.ist?.dayIST?.toLowerCase().includes(term) ||
          sched?.nextAiring?.ist?.timeIST?.toLowerCase().includes(term)
        );
      });
    }

    // Schedule / Status category filter
    if (filterSchedule === 'airing_soon') {
      list = list.filter((item) => Boolean(schedules[item.animeId]?.nextAiring));
    } else if (filterSchedule === 'completed') {
      list = list.filter((item) => item.status === 'completed' || schedules[item.animeId]?.airingStatus === 'FINISHED');
    }

    // Sort order
    list.sort((a, b) => {
      const schedA = schedules[a.animeId];
      const schedB = schedules[b.animeId];

      if (sortOption === 'next_airing') {
        const airA = schedA?.nextAiring?.airingAt || a.nextEpisodeAiringAt || Infinity;
        const airB = schedB?.nextAiring?.airingAt || b.nextEpisodeAiringAt || Infinity;
        if (airA !== airB) return airA - airB;
      } else if (sortOption === 'release_date') {
        const yearA = schedA?.seasonYear || a.year || 0;
        const yearB = schedB?.seasonYear || b.year || 0;
        if (yearA !== yearB) return yearB - yearA;
      } else if (sortOption === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }

      // Default: recently updated
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });

    return list;
  }, [pinnedItems, schedules, searchTerm, filterSchedule, sortOption]);

  const totalEpisodesWatched = pinnedItems.reduce((acc, i) => acc + (i.episodesWatched || 0), 0);

  if (!user) {
    return (
      <div className="p-8 sm:p-12 text-center rounded-3xl liquid-glass-card max-w-xl mx-auto my-12 border border-amber-500/30">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 p-[2px] shadow-lg shadow-amber-500/25">
          <div className="w-full h-full bg-[#0a0e24] rounded-[14px] flex items-center justify-center">
            <Pin className="w-8 h-8 text-amber-400 rotate-45" />
          </div>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold font-heading text-white">
          Sign In to Access Your Pinned Anime
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
          Log in with your Google or verified email account to pin ongoing anime, view live episode progress, and track release dates & broadcast times in Indian Standard Time (IST).
        </p>
        <button
          onClick={openAuthModal}
          className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-black font-extrabold text-xs sm:text-sm shadow-xl shadow-amber-500/30 transition-all inline-flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Sign In to View Pinned Anime</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-950/40 via-[#0d1226] to-rose-950/40 border border-amber-500/30 shadow-2xl shadow-amber-950/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 p-[2px] shadow-xl shadow-amber-500/30 flex-shrink-0">
              <div className="w-full h-full bg-[#0a0e24] rounded-[14px] flex items-center justify-center">
                <Pin className="w-7 h-7 text-amber-400 rotate-45" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black font-heading text-white">
                  Pinned Ongoing Anime
                </h1>
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
                  {pinnedItems.length} Pinned
                </span>
                {airingSoonCount > 0 && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    <span>{airingSoonCount} Airing Episodes Scheduled</span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                Your dedicated priority watch space. Displays live release dates, episode airing times in Indian Standard Time (IST), countdowns, and progress tracking.
              </p>
            </div>
          </div>

          {/* Quick Summary Pill Stats */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex-1 md:flex-initial px-4 py-2.5 rounded-2xl bg-black/40 border border-white/10 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Shows Pinned</p>
              <p className="text-xl font-bold font-heading text-amber-300">{pinnedItems.length}</p>
            </div>
            <div className="flex-1 md:flex-initial px-4 py-2.5 rounded-2xl bg-black/40 border border-white/10 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Episodes Done</p>
              <p className="text-xl font-bold font-heading text-cyan-300">{totalEpisodesWatched}</p>
            </div>
          </div>
        </div>

        {/* Live Broadcast Ticker for the Soonest Airing Pinned Anime */}
        {soonestAiringShow?.sched?.nextAiring && (
          <div className="relative z-10 mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs bg-black/30 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-4 px-6 sm:px-8">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-amber-300 font-mono font-bold tracking-wider text-[11px]">
                NEXT AIRING EPISODE:
              </span>
              <span 
                onClick={() => onOpenDetail(soonestAiringShow.item.animeId)}
                className="text-white font-bold hover:text-amber-300 cursor-pointer transition-colors underline decoration-amber-500/50 underline-offset-4"
              >
                {soonestAiringShow.item.title}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono font-bold text-[11px]">
                Episode {soonestAiringShow.sched.nextAiring.episode}
              </span>
              <span className="text-cyan-300 font-mono font-semibold flex items-center gap-1">
                <span>🇮🇳</span>
                <span>{soonestAiringShow.sched.nextAiring.ist.dayDisplay} at {soonestAiringShow.sched.nextAiring.ist.timeIST} IST</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold text-[11px]">
                {soonestAiringShow.sched.nextAiring.ist.countdown}
              </span>
              <button
                onClick={() => onOpenDetail(soonestAiringShow.item.animeId)}
                className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1 transition-all"
              >
                <span>Details</span>
                <ExternalLink className="w-3 h-3 text-amber-300" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter, Sort, and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
          <input
            type="text"
            placeholder="Search pinned anime by title, release date, or genre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-colors shadow-inner"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills & Sort Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/10">
            <button
              onClick={() => setFilterSchedule('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterSchedule === 'all'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({pinnedItems.length})
            </button>
            <button
              onClick={() => setFilterSchedule('airing_soon')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                filterSchedule === 'airing_soon'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Airing Next ({airingSoonCount})</span>
            </button>
            <button
              onClick={() => setFilterSchedule('completed')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterSchedule === 'completed'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="next_airing" className="bg-[#0e1329] text-white">⚡ Airing Soonest</option>
              <option value="pinned_recent" className="bg-[#0e1329] text-white">📌 Recently Pinned</option>
              <option value="release_date" className="bg-[#0e1329] text-white">📅 Release Date (Newest)</option>
              <option value="title" className="bg-[#0e1329] text-white">🔤 Title (A-Z)</option>
            </select>
          </div>

          {onBrowseAiring && (
            <button
              onClick={onBrowseAiring}
              className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 hover:border-purple-400 text-purple-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Pin From Schedule</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {processedItems.length === 0 ? (
        <div className="p-12 text-center rounded-3xl liquid-glass-card border border-white/10 text-slate-400 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
            <Pin className="w-8 h-8 rotate-45" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-heading text-white">
              {searchTerm 
                ? 'No matching pinned anime' 
                : filterSchedule === 'airing_soon'
                ? 'No Pinned Anime With Upcoming Airing Episodes'
                : 'No Pinned Anime Yet'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
              {searchTerm 
                ? 'Try clearing your search query to see all your pinned anime.'
                : filterSchedule === 'airing_soon'
                ? 'None of your currently pinned anime have an upcoming episode in this window, or they have completed airing.'
                : 'Click the 📌 Pin button on any airing show, discover card, or detail modal to pin your ongoing favorites right here!'}
            </p>
          </div>
          {onBrowseAiring && (
            <button
              onClick={onBrowseAiring}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/25 transition-all inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Browse Weekly Airing Anime (IST)</span>
            </button>
          )}
        </div>
      ) : (
        /* Pinned Shows Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {processedItems.map((item) => {
            const episodesWatched = item.episodesWatched || 0;
            const totalEpisodes = item.totalEpisodes || 0;
            const progressPercent = totalEpisodes > 0 
              ? Math.min(100, Math.round((episodesWatched / totalEpisodes) * 100))
              : null;
            const sched = schedules[item.animeId];

            return (
              <div
                key={item.animeId}
                className="group relative rounded-2xl liquid-glass-card border border-amber-500/35 hover:border-amber-400/70 p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/15 bg-gradient-to-b from-[#101530]/90 to-[#090d20]/90 space-y-4"
              >
                {/* Unpin Button */}
                <button
                  onClick={() => togglePinAnime(item, false)}
                  className="absolute top-3 right-3 z-10 p-2 rounded-xl bg-black/60 hover:bg-rose-600/80 text-amber-300 hover:text-white border border-amber-500/30 hover:border-rose-400 transition-all shadow-md group/unpin"
                  title="Unpin anime"
                >
                  <Pin className="w-4 h-4 fill-amber-400 group-hover/unpin:fill-transparent rotate-45" />
                </button>

                {/* Top Poster & Details Row */}
                <div className="flex gap-4">
                  <div
                    onClick={() => onOpenDetail(item.animeId)}
                    className="relative w-24 sm:w-28 h-36 sm:h-44 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer ring-1 ring-white/10 group-hover:ring-amber-400/50 transition-all shadow-lg"
                  >
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />

                    <div className="absolute top-2 left-2">
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-500/90 text-black text-[9px] font-black uppercase tracking-tight flex items-center gap-0.5 shadow-sm">
                        <Pin className="w-2.5 h-2.5 fill-black rotate-45" />
                        Pinned
                      </span>
                    </div>

                    {/* Bottom overlay badge on poster displaying release / airing schedule */}
                    <div className="absolute bottom-1.5 left-1.5 right-1.5">
                      {sched?.nextAiring ? (
                        <div className="px-1.5 py-0.5 rounded-md bg-purple-950/90 backdrop-blur-md border border-purple-500/50 text-[9px] font-mono flex items-center justify-between shadow-md">
                          <span className="text-amber-300 font-bold truncate">
                            {sched.nextAiring.ist.timeIST}
                          </span>
                          <span className="text-cyan-300 font-bold text-[8px] ml-1">
                            {sched.nextAiring.ist.shortCountdown}
                          </span>
                        </div>
                      ) : (
                        <div className="px-1.5 py-0.5 rounded-md bg-black/75 border border-white/15 text-[9px] font-mono text-slate-300 flex items-center justify-between">
                          <span>{item.format || 'TV'}</span>
                          <span>{sched?.releaseDateText || item.releaseDate || item.year || ''}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 pr-8 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {item.status === 'completed' ? 'Watched' : item.status === 'plan_to_watch' ? 'To Watch' : 'Watching'}
                        </span>

                        <div className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-black/50 border border-white/10">
                          <span className="px-1 py-0.2 rounded bg-[#f5c518] text-black font-black text-[9px] tracking-tight">
                            IMDb
                          </span>
                          <span className="font-bold text-white text-[10px] font-mono">
                            {item.imdbScore || '8.5'}
                          </span>
                        </div>
                      </div>

                      <h3
                        onClick={() => onOpenDetail(item.animeId)}
                        className="text-sm sm:text-base font-bold font-heading text-white line-clamp-2 cursor-pointer hover:text-amber-300 transition-colors leading-snug"
                        title={item.title}
                      >
                        {item.title}
                      </h3>

                      {item.englishTitle && item.englishTitle !== item.title && (
                        <p className="text-[11px] text-slate-400 line-clamp-1 italic mt-0.5">
                          {item.englishTitle}
                        </p>
                      )}

                      {/* Genre Tags */}
                      {item.genres?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.genres.slice(0, 2).map((g) => (
                            <span
                              key={g}
                              className="text-[10px] text-slate-300 px-1.5 py-0.5 rounded bg-white/5 border border-white/5 font-medium"
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Personal Notes preview */}
                    {item.notes && (
                      <p className="text-[11px] text-purple-300/80 italic mt-2 line-clamp-1 flex items-center gap-1">
                        <Edit3 className="w-3 h-3 flex-shrink-0" />
                        <span>"{item.notes}"</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* DEDICATED RELEASE DATE & BROADCAST TIME SHOWCASE BOX */}
                <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#0d1226] to-black/60 border border-purple-500/30 space-y-2">
                  {sched?.nextAiring ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1 text-[10px]">
                        <span className="font-bold text-amber-300 flex items-center gap-1.5 font-mono">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span>EP {sched.nextAiring.episode} AIRING (IST)</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold font-mono text-[9px]">
                          {sched.nextAiring.ist.countdown}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-white font-medium">
                          <Calendar className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          <span>{sched.nextAiring.ist.dayDisplay}, {sched.nextAiring.ist.dateIST}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-cyan-300 font-bold font-mono">
                          <Clock className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                          <span>{sched.nextAiring.ist.timeIST} IST</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs py-0.5">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                        <span className="text-[11px] text-slate-400">Release Date:</span>
                        <span className="font-semibold text-white text-[11px]">
                          {sched?.releaseDateText || item.releaseDate || (item.year ? String(item.year) : 'Released')}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400 font-mono">
                        {sched?.airingStatus === 'FINISHED' ? 'Completed Series' : sched?.airingStatus || 'Finished'}
                      </span>
                    </div>
                  )}

                  {/* Premiered / Season footer row if next episode exists */}
                  {sched?.nextAiring && (sched.releaseDateText || item.releaseDate || item.year) && (
                    <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span>Premiered: {sched.releaseDateText || item.releaseDate || item.year}</span>
                      </span>
                      <span className="font-mono text-purple-300">
                        {sched.airingStatus || 'RELEASING'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Episode Progress & Bar */}
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Episode Progress</span>
                    <span className="font-mono font-bold text-amber-300">
                      Ep {episodesWatched} <span className="text-slate-500">/</span> {totalEpisodes || '?'}
                      {progressPercent !== null && ` (${progressPercent}%)`}
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-500 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent !== null ? progressPercent : 20}%` }}
                    />
                  </div>
                </div>

                {/* Controls & Actions Row */}
                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                  {/* Progress +1 / -1 Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateEpisodeProgress(item.animeId, -1)}
                      disabled={episodesWatched <= 0}
                      className="p-1.5 rounded-lg bg-black/40 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors disabled:opacity-40"
                      title="Decrease Episode (-1)"
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

                  {/* Status Dropdown */}
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChange(item, e.target.value)}
                    className="bg-black/50 text-xs font-medium text-slate-200 px-2.5 py-1.5 rounded-xl border border-white/10 focus:border-amber-500 focus:outline-none cursor-pointer"
                  >
                    <option value="watching" className="bg-[#0e1329]">Watching</option>
                    <option value="plan_to_watch" className="bg-[#0e1329]">To Watch</option>
                    <option value="completed" className="bg-[#0e1329]">Watched</option>
                    <option value="dropped" className="bg-[#0e1329]">Dropped</option>
                  </select>

                  {/* Rating Selector */}
                  <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-xl border border-white/10">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <select
                      value={item.userScore || 0}
                      onChange={(e) => handleScoreChange(item, e.target.value)}
                      className="bg-transparent text-xs font-semibold text-amber-300 focus:outline-none cursor-pointer"
                    >
                      <option value={0} className="bg-[#0e1329] text-slate-300">Rate</option>
                      {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((s) => (
                        <option key={s} value={s} className="bg-[#0e1329] text-white">
                          {s} ★
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Notes Button */}
                  <button
                    onClick={() => {
                      setEditingNotesItem(item);
                      setTempNotes(item.notes || '');
                    }}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
                    title="Add / Edit Personal Notes"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* Details Button */}
                  <button
                    onClick={() => onOpenDetail(item.animeId)}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
                    title="View Full Details"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Notes Modal */}
      {editingNotesItem && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#0e1329] border border-amber-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>Notes for {editingNotesItem.title}</span>
              </h3>
              <button
                onClick={() => setEditingNotesItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              placeholder="Add personal thoughts, episode milestones, or watch notes..."
              rows={4}
              className="w-full p-3 rounded-2xl bg-black/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingNotesItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/25 transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Notes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
