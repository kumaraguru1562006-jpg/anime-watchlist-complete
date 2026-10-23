import React, { useState, useEffect } from 'react';
import { 
  Bookmark, 
  CheckCircle2, 
  Tv, 
  Star, 
  Plus, 
  Minus, 
  Trash2, 
  Edit3, 
  Sparkles, 
  ExternalLink,
  SlidersHorizontal,
  Search,
  Check,
  TrendingUp,
  Award,
  X,
  Share2,
  Download
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShareWatchedModal } from './ShareWatchedModal';
import { DownloadWatchedModal } from './DownloadWatchedModal';

export const WatchlistManager = ({ initialStatus = 'plan_to_watch', onOpenDetail, onBrowseAiring }) => {
  const { user, openAuthModal, stats, refreshStats } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState(initialStatus); // 'plan_to_watch' | 'completed' | 'watching' | 'all'
  
  // Instant cache hydration for watchlist
  const [items, setItems] = useState(() => {
    try {
      const cached = localStorage.getItem(`anicart_cache_watchlist_${initialStatus}`);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem(`anicart_cache_watchlist_${initialStatus}`);
      return !cached || JSON.parse(cached).length === 0;
    } catch {
      return true;
    }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [editingNotesItem, setEditingNotesItem] = useState(null);
  const [tempNotes, setTempNotes] = useState('');

  // Modals for Sharing and Downloading Watched Anime List
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [watchedModalItems, setWatchedModalItems] = useState([]);

  const handleOpenShare = async () => {
    if (activeSubTab === 'completed' && items.length > 0) {
      setWatchedModalItems(items);
    } else {
      try {
        const res = await api.getWatchlist('completed');
        setWatchedModalItems(res.items || []);
      } catch {
        setWatchedModalItems(items.filter((i) => i.status === 'completed'));
      }
    }
    setIsShareModalOpen(true);
  };

  const handleOpenDownload = async () => {
    if (activeSubTab === 'completed' && items.length > 0) {
      setWatchedModalItems(items);
    } else {
      try {
        const res = await api.getWatchlist('completed');
        setWatchedModalItems(res.items || []);
      } catch {
        setWatchedModalItems(items.filter((i) => i.status === 'completed'));
      }
    }
    setIsDownloadModalOpen(true);
  };

  useEffect(() => {
    if (user) {
      try {
        const cached = localStorage.getItem(`anicart_cache_watchlist_${activeSubTab}`);
        if (cached) {
          setItems(JSON.parse(cached));
          setLoading(false);
        }
      } catch (e) {}
      loadWatchlist();
    } else {
      setLoading(false);
    }
  }, [user, activeSubTab]);

  const loadWatchlist = async () => {
    if (items.length === 0) setLoading(true);
    try {
      const data = await api.getWatchlist(activeSubTab);
      const incoming = data.items || [];
      setItems(incoming);
      try {
        localStorage.setItem(`anicart_cache_watchlist_${activeSubTab}`, JSON.stringify(incoming));
      } catch (e) {}
      await refreshStats();
    } catch (err) {
      console.error('Error loading watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (item, newStatus) => {
    try {
      const isFinishing = newStatus === 'completed';
      const episodesWatched = isFinishing ? item.totalEpisodes || item.episodesWatched : item.episodesWatched;

      await api.updateWatchlistItem(item.animeId, {
        status: newStatus,
        episodesWatched,
      });

      if (isFinishing) {
        // Trigger celebratory confetti burst!
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#8b5cf6', '#00f2fe', '#ec4899', '#f59e0b'],
        });
      }

      await loadWatchlist();
    } catch (err) {
      alert(`Could not update status: ${err.message}`);
    }
  };

  const handleProgressChange = async (item, delta) => {
    const newProgress = Math.max(0, (item.episodesWatched || 0) + delta);
    if (item.totalEpisodes && newProgress > item.totalEpisodes) return;

    const isCompleted = item.totalEpisodes && newProgress >= item.totalEpisodes;
    const newStatus = isCompleted ? 'completed' : item.status === 'plan_to_watch' ? 'watching' : item.status;

    try {
      await api.updateWatchlistItem(item.animeId, {
        episodesWatched: newProgress,
        status: newStatus,
      });

      if (isCompleted && item.status !== 'completed') {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      }

      await loadWatchlist();
    } catch (err) {
      console.error(err);
    }
  };

  const handleScoreChange = async (item, score) => {
    try {
      await api.updateWatchlistItem(item.animeId, {
        userScore: Number(score),
      });
      await loadWatchlist();
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
      await loadWatchlist();
    } catch (err) {
      alert(`Error saving notes: ${err.message}`);
    }
  };

  const handleDelete = async (animeId) => {
    if (!confirm('Remove this anime from your watchlist?')) return;
    try {
      await api.removeFromWatchlist(animeId);
      await loadWatchlist();
    } catch (err) {
      alert(`Could not remove anime: ${err.message}`);
    }
  };

  const filteredItems = items.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.title?.toLowerCase().includes(term) ||
      item.englishTitle?.toLowerCase().includes(term) ||
      item.genres?.some((g) => g.toLowerCase().includes(term))
    );
  });

  if (!user) {
    return (
      <div className="p-8 sm:p-12 text-center rounded-3xl liquid-glass-card max-w-xl mx-auto my-12 border border-purple-500/30">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-500 p-[2px] shadow-lg shadow-purple-500/25">
          <div className="w-full h-full bg-[#0a0e24] rounded-[14px] flex items-center justify-center">
            <Bookmark className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold font-heading text-white">
          Sign In to Access Your Watchlist
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
          Log in with your Google email to save, organize, track episode progress, and rate your anime in MongoDB.
        </p>
        <button
          onClick={openAuthModal}
          className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-purple-600/30 transition-all inline-flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Sign In with Google</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl liquid-glass-card border border-purple-500/20">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5" /> Plan to Watch
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold font-heading text-white mt-1">
            {stats.planToWatchCount || 0}
          </p>
        </div>

        <div className="p-4 rounded-2xl liquid-glass-card border border-cyan-500/20">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Anime Watched
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold font-heading text-white mt-1">
            {stats.completedCount || 0}
          </p>
        </div>

        <div className="p-4 rounded-2xl liquid-glass-card border border-indigo-500/20">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
            <Tv className="w-3.5 h-3.5" /> Episodes Done
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold font-heading text-white mt-1">
            {stats.totalEpisodesWatched || 0}
          </p>
        </div>

        <div className="p-4 rounded-2xl liquid-glass-card border border-amber-500/20">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5" /> Mean Rating
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold font-heading text-white mt-1">
            {stats.averageScore || '0.0'} <span className="text-xs text-slate-500 font-sans">/ 10</span>
          </p>
        </div>
      </div>

      {/* Tabs Bar & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Watchlist Sub-tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/30 border border-white/10 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveSubTab('plan_to_watch')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeSubTab === 'plan_to_watch'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>To Watch List</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30">
              {stats.planToWatchCount}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('completed')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeSubTab === 'completed'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Watched List</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30">
              {stats.completedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('watching')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeSubTab === 'watching'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Watching</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30">
              {stats.watchingCount || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeSubTab === 'all'
                ? 'bg-white/15 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>All ({stats.total || 0})</span>
          </button>
        </div>

        {/* Right Action Buttons: Share & Download Watched List + Search */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          {/* Share Watched List Action Button */}
          <button
            onClick={handleOpenShare}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600/20 to-blue-600/20 hover:from-cyan-600/30 hover:to-blue-600/30 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md group"
            title="Share your watched list with friends or social media"
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Share Watched</span>
            <span className="sm:hidden">Share</span>
          </button>

          {/* Download Watched List Action Button */}
          <button
            onClick={handleOpenDownload}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600/20 to-indigo-600/20 hover:from-purple-600/30 hover:to-indigo-600/30 border border-purple-500/30 hover:border-purple-400 text-purple-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md group"
            title="Download watched anime list as CSV, JSON, or TXT"
          >
            <Download className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Download</span>
            <span className="sm:hidden">Export</span>
          </button>

          {/* Filter / Search inside user's list */}
          <div className="relative flex-1 sm:w-60 min-w-[140px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-purple-400" />
            <input
              type="text"
              placeholder="Search your list..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-8 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-colors shadow-inner"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-white"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Watched List Dedicated Showcase Banner with One-Click Actions */}
      {activeSubTab === 'completed' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-[#0a0f26] to-purple-950/40 border border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl shadow-cyan-950/20">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 flex-shrink-0 shadow-lg shadow-cyan-500/10">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-heading text-white">
                  Completed Anime Showcase
                </span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold">
                  {stats.completedCount || items.length} Finished
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Share your finished anime achievements or export them anytime to Excel/CSV, JSON, or formatted notes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={handleOpenShare}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Watched List</span>
            </button>

            <button
              onClick={handleOpenDownload}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4 text-purple-300" />
              <span>Download List</span>
            </button>
          </div>
        </div>
      )}

      {/* Items List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-2xl liquid-glass-card border border-white/10 text-slate-400">
          <Bookmark className="w-10 h-10 mx-auto text-slate-500 mb-2" />
          <p className="text-sm font-semibold text-white">
            Your {activeSubTab === 'completed' ? 'Watched' : 'To Watch'} list is empty!
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Explore currently airing anime in Indian Time or discover trending anime to add them to your MongoDB watchlist.
          </p>
          <button
            onClick={onBrowseAiring}
            className="mt-4 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5 shadow-lg shadow-purple-600/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Browse Airing Anime (IST)</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.animeId}
              className="group p-3 sm:p-4 rounded-2xl liquid-glass-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-white/10 hover:border-purple-500/30 transition-all"
            >
              {/* Left: Thumbnail & Title Info */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <img
                  src={item.coverImage}
                  alt={item.title}
                  onClick={() => onOpenDetail(item.animeId)}
                  className="w-14 h-20 sm:w-16 sm:h-24 rounded-xl object-cover ring-1 ring-white/10 cursor-pointer flex-shrink-0 group-hover:scale-105 transition-transform"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                        item.status === 'completed'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                          : item.status === 'watching'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      }`}
                    >
                      {item.status === 'completed'
                        ? 'Watched'
                        : item.status === 'watching'
                        ? 'Watching'
                        : 'To Watch'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.format || 'TV'}
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
                    className="text-sm sm:text-base font-bold font-heading text-white truncate cursor-pointer hover:text-purple-300 transition-colors"
                  >
                    {item.title}
                  </h3>

                  {item.genres?.length > 0 && (
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {item.genres.slice(0, 3).join(' • ')}
                    </p>
                  )}

                  {item.notes && (
                    <p className="text-[11px] text-purple-300/80 italic mt-1 line-clamp-1 flex items-center gap-1">
                      <Edit3 className="w-3 h-3 flex-shrink-0" />
                      <span>"{item.notes}"</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Controls & Actions */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                {/* Episode Progress Counter */}
                <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => handleProgressChange(item, -1)}
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    title="Decrease Episode"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-mono font-semibold text-slate-200 px-1 min-w-[50px] text-center">
                    {item.episodesWatched || 0} / {item.totalEpisodes || '?'}
                  </span>
                  <button
                    onClick={() => handleProgressChange(item, 1)}
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    title="Increase Episode (+1)"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Score Selector (1-10 Stars) */}
                <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-xl border border-white/10">
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

                {/* Status Switcher Dropdown */}
                <select
                  value={item.status}
                  onChange={(e) => handleStatusChange(item, e.target.value)}
                  className="bg-black/40 text-xs font-medium text-slate-200 px-2.5 py-1.5 rounded-xl border border-white/10 focus:border-purple-500 focus:outline-none cursor-pointer"
                >
                  <option value="plan_to_watch" className="bg-[#0e1329]">To Watch</option>
                  <option value="watching" className="bg-[#0e1329]">Watching</option>
                  <option value="completed" className="bg-[#0e1329]">Watched</option>
                  <option value="dropped" className="bg-[#0e1329]">Dropped</option>
                </select>

                {/* Notes Button */}
                <button
                  onClick={() => {
                    setEditingNotesItem(item);
                    setTempNotes(item.notes || '');
                  }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
                  title="Add / Edit Personal Notes"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(item.animeId)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                  title="Delete from Watchlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Notes Modal */}
      {editingNotesItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl liquid-glass-nav bg-[#0e1329]/95 p-6 border border-white/15">
            <h3 className="text-base font-bold font-heading text-white mb-2">
              Personal Notes for {editingNotesItem.title}
            </h3>
            <textarea
              rows={4}
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              placeholder="Write your thoughts, memorable quotes, or viewing plans..."
              className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setEditingNotesItem(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Watched List Modal */}
      <ShareWatchedModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        user={user}
        watchedItems={watchedModalItems}
        stats={stats}
      />

      {/* Download Watched List Modal */}
      <DownloadWatchedModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        user={user}
        watchedItems={watchedModalItems}
        stats={stats}
      />
    </div>
  );
};
