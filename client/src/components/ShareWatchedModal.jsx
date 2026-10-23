import React, { useState, useMemo } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Sparkles, 
  ExternalLink, 
  Send, 
  CheckCircle2, 
  Tv, 
  Star,
  MessageSquare,
  Globe
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ShareWatchedModal = ({ isOpen, onClose, user, watchedItems = [], stats = {} }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Generate public shareable link
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const userId = user?.id || user?._id || 'guest';
    const userName = encodeURIComponent(user?.name || 'Anime Fan');
    return `${window.location.origin}/?sharedWatched=${userId}&name=${userName}`;
  }, [user]);

  // Generate formatted social share text (Discord, WhatsApp, Twitter/X, Reddit)
  const socialShareText = useMemo(() => {
    const name = user?.name || 'Anime Fan';
    const completedCount = watchedItems.length || stats.completedCount || 0;
    const epCount = stats.totalEpisodesWatched || watchedItems.reduce((acc, i) => acc + (i.episodesWatched || i.totalEpisodes || 0), 0);
    const avgScore = stats.averageScore || '0.0';

    // Top rated anime
    const sorted = [...watchedItems].sort((a, b) => (b.userScore || 0) - (a.userScore || 0));
    const topPicks = sorted.slice(0, 5).map((item, idx) => {
      const score = item.userScore ? `⭐ ${item.userScore}/10` : '✨ Watched';
      const eps = item.episodesWatched ? `(${item.episodesWatched} eps)` : '';
      return `${idx + 1}. ${item.title || item.englishTitle} — ${score} ${eps}`;
    });

    return `🍙 ${name}'s Anime Watched List on AniCart ✨\n` +
      `📺 Completed: ${completedCount} Anime | 🎬 ${epCount} Episodes Done | ⭐ Mean Score: ${avgScore}/10\n\n` +
      (topPicks.length > 0 ? `🏆 Top Rated Favorites:\n${topPicks.join('\n')}\n\n` : '') +
      `Explore my full verified anime journey on AniCart:\n${shareUrl}`;
  }, [user, watchedItems, stats, shareUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    triggerConfetti();
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(socialShareText);
    setCopiedText(true);
    triggerConfetti();
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user?.name || 'My'} Watched Anime on AniCart`,
          text: socialShareText,
          url: shareUrl,
        });
        setShareSuccess(true);
        triggerConfetti();
        setTimeout(() => setShareSuccess(false), 3000);
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyText();
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#06b6d4', '#8b5cf6', '#ec4899', '#10b981'],
    });
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg liquid-glass-card bg-[#090d21]/95 rounded-3xl p-6 sm:p-7 shadow-2xl border border-cyan-500/30 max-h-[92vh] overflow-y-auto space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-[2px] shadow-lg shadow-cyan-500/20 flex-shrink-0">
            <div className="w-full h-full bg-[#080c1d] rounded-[14px] flex items-center justify-center">
              <Share2 className="w-6 h-6 text-cyan-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-mono font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AniCart Social Showcase</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-heading text-white">
              Share Watched List
            </h2>
          </div>
        </div>

        {/* User Card Summary Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-[#0d1430] to-purple-950/40 border border-white/10 flex items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
              alt={user?.name || 'User'}
              className="w-11 h-11 rounded-xl object-cover ring-2 ring-cyan-400/40 flex-shrink-0"
            />
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate font-heading">
                {user?.name || 'Anime Fan'}
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                {user?.email || 'AniCart Explorer'}
              </p>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <span className="text-lg font-black font-heading text-cyan-300 block">
              {watchedItems.length || stats.completedCount || 0}
            </span>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
              Completed
            </span>
          </div>
        </div>

        {/* Section 1: Copy Direct Showcase Link */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Public Web Showcase Link</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full pl-3.5 pr-3 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-slate-300 font-mono select-all focus:outline-none focus:border-cyan-400/50"
              />
            </div>
            <button
              onClick={handleCopyLink}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 shadow-lg ${
                copiedLink
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-600/30'
              }`}
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Anyone with this link can view your completed anime titles and ratings on AniCart.
          </p>
        </div>

        {/* Section 2: Formatted Text Summary for Discord / WhatsApp / Twitter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
              <span>Formatted Social Summary (Discord / WhatsApp / Reddit)</span>
            </label>
            <button
              onClick={handleCopyText}
              className="text-[11px] text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
            >
              {copiedText ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedText ? 'Copied to Clipboard!' : 'Copy Text'}</span>
            </button>
          </div>

          <div className="relative">
            <textarea
              readOnly
              rows={5}
              value={socialShareText}
              className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-xs text-slate-300 font-sans leading-relaxed select-all focus:outline-none focus:border-purple-400/50 resize-none shadow-inner"
            />
          </div>
        </div>

        {/* Section 3: Native Share Button (Mobile / Web Share API) */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleNativeShare}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold text-xs shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2 group"
          >
            <Send className="w-4 h-4 text-cyan-200 group-hover:translate-x-0.5 transition-transform" />
            <span>{navigator.share ? 'Share to Apps (WhatsApp / Messages)' : 'Copy Share Summary'}</span>
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
