import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  Code, 
  FileText, 
  Check, 
  Sparkles, 
  CheckCircle2,
  Tv,
  Star
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const DownloadWatchedModal = ({ isOpen, onClose, user, watchedItems = [], stats = {} }) => {
  const [downloadingType, setDownloadingType] = useState(null);

  if (!isOpen) return null;

  const sanitizeFilename = (name) => {
    return (name || 'user')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toLowerCase();
  };

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    confetti({
      particleCount: 60,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#8b5cf6', '#06b6d4', '#10b981'],
    });
  };

  // 1. Download JSON
  const handleDownloadJson = () => {
    setDownloadingType('json');
    const dateStr = new Date().toISOString().split('T')[0];
    const username = sanitizeFilename(user?.name);
    const filename = `anicart_watched_${username}_${dateStr}.json`;

    const exportData = {
      platform: 'AniCart Anime Watchlist & Intelligence',
      exportDate: new Date().toISOString(),
      user: {
        id: user?.id || user?._id,
        name: user?.name || 'Anime Fan',
        email: user?.email,
      },
      stats: {
        completedCount: watchedItems.length || stats.completedCount || 0,
        totalEpisodesWatched: stats.totalEpisodesWatched || 0,
        averageScore: stats.averageScore || '0.0',
      },
      watchedList: watchedItems.map((item) => ({
        animeId: item.animeId,
        title: item.title,
        englishTitle: item.englishTitle,
        romajiTitle: item.romajiTitle,
        format: item.format || 'TV',
        episodesWatched: item.episodesWatched,
        totalEpisodes: item.totalEpisodes,
        userScore: item.userScore,
        status: item.status,
        genres: item.genres || [],
        notes: item.notes || '',
        coverImage: item.coverImage,
        updatedAt: item.updatedAt,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    triggerDownload(blob, filename);

    setTimeout(() => setDownloadingType(null), 1500);
  };

  // 2. Download CSV (Excel / Google Sheets compatible with UTF-8 BOM)
  const handleDownloadCsv = () => {
    setDownloadingType('csv');
    const dateStr = new Date().toISOString().split('T')[0];
    const username = sanitizeFilename(user?.name);
    const filename = `anicart_watched_${username}_${dateStr}.csv`;

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      'Anime Title',
      'English Title',
      'Format',
      'Episodes Watched',
      'Total Episodes',
      'User Score',
      'Status',
      'Genres',
      'Personal Notes',
      'Last Updated',
      'AniCart ID',
    ];

    const rows = watchedItems.map((item) => [
      escapeCsv(item.title),
      escapeCsv(item.englishTitle || item.title),
      escapeCsv(item.format || 'TV'),
      item.episodesWatched || item.totalEpisodes || 0,
      item.totalEpisodes || '',
      item.userScore || 0,
      escapeCsv(item.status || 'completed'),
      escapeCsv((item.genres || []).join('; ')),
      escapeCsv(item.notes || ''),
      escapeCsv(item.updatedAt || ''),
      item.animeId || '',
    ]);

    // Prepend UTF-8 BOM (\uFEFF) so Excel respects UTF-8 Japanese/Romaji characters
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8',
    });
    triggerDownload(blob, filename);

    setTimeout(() => setDownloadingType(null), 1500);
  };

  // 3. Download Formatted Text / Markdown (.txt)
  const handleDownloadTxt = () => {
    setDownloadingType('txt');
    const dateStr = new Date().toISOString().split('T')[0];
    const username = sanitizeFilename(user?.name);
    const filename = `anicart_watched_${username}_${dateStr}.txt`;

    const name = user?.name || 'Anime Fan';
    const completedCount = watchedItems.length || stats.completedCount || 0;
    const epCount = stats.totalEpisodesWatched || 0;
    const avgScore = stats.averageScore || '0.0';

    const lines = [
      '========================================================================',
      `                 ANICART — VERIFIED ANIME WATCHED LOG`,
      '========================================================================',
      `User: ${name}`,
      `Generated on: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}`,
      `Completed Anime: ${completedCount} series`,
      `Total Episodes Watched: ${epCount} episodes`,
      `Average Rating: ${avgScore} / 10`,
      '========================================================================',
      '',
      'COMPLETED ANIME LIST:',
      '',
    ];

    watchedItems.forEach((item, idx) => {
      const score = item.userScore > 0 ? `Score: ${item.userScore}/10` : 'Not Rated';
      const eps = `Episodes: ${item.episodesWatched || item.totalEpisodes || 'N/A'}${item.totalEpisodes ? `/${item.totalEpisodes}` : ''}`;
      const genres = item.genres && item.genres.length > 0 ? `[${item.genres.join(', ')}]` : '';
      lines.push(`${idx + 1}. ${item.title || item.englishTitle}`);
      lines.push(`   └─ ${score} | ${eps} ${genres}`);
      if (item.notes) {
        lines.push(`   └─ Notes: "${item.notes}"`);
      }
      lines.push('');
    });

    lines.push('------------------------------------------------------------------------');
    lines.push('Exported from AniCart — Liquid Glass Anime Watchlist Hub');
    lines.push('https://localhost:5173');

    const blob = new Blob([lines.join('\n')], {
      type: 'text/plain;charset=utf-8',
    });
    triggerDownload(blob, filename);

    setTimeout(() => setDownloadingType(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md liquid-glass-card bg-[#090d21]/95 rounded-3xl p-6 sm:p-7 shadow-2xl border border-purple-500/30 space-y-6"
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-[2px] shadow-lg shadow-purple-600/20 flex-shrink-0">
            <div className="w-full h-full bg-[#080c1d] rounded-[14px] flex items-center justify-center">
              <Download className="w-6 h-6 text-purple-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-purple-400 font-mono font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Data Export & Archiving</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-heading text-white">
              Download Watched List
            </h2>
          </div>
        </div>

        {/* Stats Pill */}
        <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/20 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>Ready for Export:</span>
          </div>
          <span className="font-bold text-white font-mono bg-white/10 px-2 py-0.5 rounded-lg">
            {watchedItems.length} Completed Anime
          </span>
        </div>

        {/* 3 Download Formats */}
        <div className="space-y-3">
          {/* Format 1: CSV / Spreadsheet */}
          <button
            onClick={handleDownloadCsv}
            disabled={downloadingType !== null}
            className="w-full p-4 rounded-2xl bg-black/40 hover:bg-cyan-950/20 border border-white/10 hover:border-cyan-400/50 transition-all flex items-center justify-between gap-3 text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-2">
                  <span>Excel & CSV Spreadsheet</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-normal">
                    .CSV
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Best for Excel, Google Sheets, or Notion database import.
                </p>
              </div>
            </div>

            <div className="flex-shrink-0 text-cyan-400 p-2 rounded-xl bg-white/5 group-hover:bg-cyan-500/20 transition-colors">
              {downloadingType === 'csv' ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
            </div>
          </button>

          {/* Format 2: JSON Backup */}
          <button
            onClick={handleDownloadJson}
            disabled={downloadingType !== null}
            className="w-full p-4 rounded-2xl bg-black/40 hover:bg-purple-950/20 border border-white/10 hover:border-purple-400/50 transition-all flex items-center justify-between gap-3 text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                <Code className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors flex items-center gap-2">
                  <span>Full JSON Raw Data</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-normal">
                    .JSON
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Complete dataset backup with IDs, cover image URLs & ratings.
                </p>
              </div>
            </div>

            <div className="flex-shrink-0 text-purple-400 p-2 rounded-xl bg-white/5 group-hover:bg-purple-500/20 transition-colors">
              {downloadingType === 'json' ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
            </div>
          </button>

          {/* Format 3: Plain Text / Markdown */}
          <button
            onClick={handleDownloadTxt}
            disabled={downloadingType !== null}
            className="w-full p-4 rounded-2xl bg-black/40 hover:bg-indigo-950/20 border border-white/10 hover:border-indigo-400/50 transition-all flex items-center justify-between gap-3 text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-2">
                  <span>Formatted Text Document</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-normal">
                    .TXT
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Human-readable summary with numbered list, scores & notes.
                </p>
              </div>
            </div>

            <div className="flex-shrink-0 text-indigo-400 p-2 rounded-xl bg-white/5 group-hover:bg-indigo-500/20 transition-colors">
              {downloadingType === 'txt' ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="pt-2 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
