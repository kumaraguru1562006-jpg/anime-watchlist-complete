import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Newspaper, 
  BookOpen, 
  ExternalLink, 
  Calendar, 
  Sparkles, 
  Tag, 
  Clock, 
  Search, 
  X, 
  Share2, 
  Check, 
  ChevronRight,
  Flame,
  ArrowLeft,
  RefreshCw,
  Tv,
  AlertCircle,
  ChevronUp,
  List,
  Eye,
  Volume2,
  VolumeX,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { ArticleContentRenderer } from './ArticleContentRenderer';

const bannerImages = [
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
];

export const NewsSection = () => {
  const [news, setNews] = useState([]);
  const [trending, setTrending] = useState([]);
  const [upcomingEpisodes, setUpcomingEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Dedicated Full Article Reading Page View
  const [activeArticle, setActiveArticle] = useState(null);
  const [articleDetails, setArticleDetails] = useState(null);
  const [readerLoading, setReaderLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [fontSizeLevel, setFontSizeLevel] = useState(1); // 0: sm, 1: base, 2: lg
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [savedArticles, setSavedArticles] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('anicart_saved_articles') || localStorage.getItem('anichat_saved_articles') || '[]');
    } catch {
      return [];
    }
  });

  const readerTopRef = useRef(null);

  // Track reading scroll progress
  useEffect(() => {
    if (!activeArticle) return;
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0) {
        const pct = Math.min(100, Math.max(0, Math.round((totalScroll / windowHeight) * 100)));
        setScrollProgress(pct);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeArticle]);

  // Audio / Speech Reader
  const toggleSpeech = (article) => {
    if (!('speechSynthesis' in window)) return;
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const title = article.title || '';
    const summary = article.summary || '';
    const body = (article.paragraphs || []).slice(0, 10).join('. ');
    const textToRead = `${title}. ${summary}. ${body}`;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 1.0;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  };

  // Toggle Save Article to Library
  const toggleSaveArticle = (article) => {
    const url = article.url || article.sourceUrl;
    setSavedArticles((prev) => {
      const exists = prev.some((item) => (item.url || item.sourceUrl) === url);
      let next;
      if (exists) {
        next = prev.filter((item) => (item.url || item.sourceUrl) !== url);
      } else {
        next = [
          {
            id: article.id || `saved-${Date.now()}`,
            title: article.title,
            image: article.coverImage || article.image,
            category: article.category,
            publishedAt: article.publishedAt,
            url: article.url || article.sourceUrl,
            sourceUrl: article.sourceUrl || article.url,
            summary: article.summary,
            readTime: article.readTime,
          },
          ...prev,
        ];
      }
      localStorage.setItem('anicart_saved_articles', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      // Parallel fetch: news feed, trending ranked news, and upcoming weekly schedule
      const [newsRes, trendRes, airingRes] = await Promise.all([
        api.getNews().catch(() => ({ news: [] })),
        api.getTrendingNews().catch(() => ({ trending: [] })),
        api.getAiringIST({ perPage: 6 }).catch(() => ({ schedules: [] })),
      ]);

      const items = newsRes.news || [];
      setNews(items);
      setTrending(trendRes.trending || items.slice(0, 5));
      setUpcomingEpisodes((airingRes.schedules || []).slice(0, 5));
    } catch (err) {
      console.error('Failed to load anime news bundle:', err);
      setError('Unable to fetch live news feeds. Please click retry.');
    } finally {
      setLoading(false);
    }
  };

  // Open Full Article Dedicated Reading View
  const handleOpenArticle = async (item) => {
    setActiveArticle(item);
    setArticleDetails({
      ...item,
      status: 'loading',
      hasFullContent: false,
      paragraphs: item.summary ? [item.summary] : [],
      markdownContent: item.summary || '',
      tableData: null,
      citations: [],
      tableOfContents: [],
      relatedArticles: [],
    });
    setReaderLoading(true);

    // Scroll to top of reading view
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const res = await api.getNewsArticle({
        url: item.url || item.sourceUrl,
        title: item.title,
        summary: item.summary,
        image: item.image,
        source: item.sourceName || item.source,
        category: item.category,
        publishedAt: item.publishedAt,
      });

      if (res.success && res.article) {
        setArticleDetails(res.article);
      }
    } catch (err) {
      console.warn('Failed to fetch full article text, displaying preview summary:', err);
      setArticleDetails({
        ...item,
        status: item.summary ? 'summary_only' : 'load_error',
        hasFullContent: false,
        contentFormat: item.summary ? 'summary' : 'load_error',
        summary: item.summary || '',
        paragraphs: item.summary ? [item.summary] : [],
        content: item.summary || '',
        markdownContent: item.summary || '',
      });
    } finally {
      setReaderLoading(false);
    }
  };

  const handleBackToNews = () => {
    setActiveArticle(null);
    setArticleDetails(null);
    setCopiedLink(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyLink = () => {
    const url = activeArticle?.url || activeArticle?.sourceUrl || window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Available categories
  const categories = useMemo(() => {
    const set = new Set(['All']);
    for (const item of news) {
      if (item.category) set.add(item.category);
    }
    return Array.from(set).slice(0, 8);
  }, [news]);

  // Filtered stories by category and search
  const filteredNews = useMemo(() => {
    let list = selectedCategory === 'Saved' ? savedArticles : news;
    if (selectedCategory !== 'All' && selectedCategory !== 'Saved') {
      list = list.filter((item) => (item.category || '').toLowerCase() === selectedCategory.toLowerCase());
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((item) => 
      (item.title || '').toLowerCase().includes(q) ||
      (item.summary || '').toLowerCase().includes(q) ||
      (item.category || '').toLowerCase().includes(q) ||
      (item.sourceName || item.source || '').toLowerCase().includes(q)
    );
  }, [news, savedArticles, selectedCategory, searchQuery]);

  // Featured Hero Story (first item in filtered list, or top item)
  const featuredStory = filteredNews.length > 0 ? filteredNews[0] : null;
  const remainingNews = filteredNews.length > 1 ? filteredNews.slice(1) : [];

  // =========================================================
  // VIEW A: DEDICATED FULL ARTICLE READING VIEW
  // =========================================================
  if (activeArticle) {
    const current = articleDetails || activeArticle;
    const isSaved = savedArticles.some((item) => (item.url || item.sourceUrl) === (current.url || current.sourceUrl));

    // Continuous reading next/prev story computation
    const currentUrl = current.url || current.sourceUrl;
    const currentIndex = news.findIndex(
      (item) => (item.url || item.sourceUrl) === currentUrl || item.title === current.title
    );
    const prevArticle = currentIndex > 0 ? news[currentIndex - 1] : null;
    const nextArticle = currentIndex >= 0 && currentIndex < news.length - 1 ? news[currentIndex + 1] : null;

    return (
      <div ref={readerTopRef} className="space-y-8 animate-in fade-in duration-300 max-w-4xl mx-auto pb-16">
        {/* Top Reading Progress Bar */}
        <div className="fixed top-0 left-0 right-0 h-1 bg-black/40 z-50">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        {/* Navigation & Controls Bar */}
        <div className="sticky top-20 z-30 p-3 sm:p-4 rounded-2xl bg-[#090d21]/95 border border-cyan-500/30 backdrop-blur-xl shadow-2xl flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleBackToNews}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 font-medium group"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Anime News</span>
          </button>

          <div className="flex items-center gap-2">
            {/* Audio Listen Button */}
            <button
              onClick={() => toggleSpeech(current)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 ${
                isPlayingAudio
                  ? 'bg-pink-600/20 border-pink-500/50 text-pink-300 animate-pulse'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white'
              }`}
              title={isPlayingAudio ? 'Stop Reading' : 'Listen to Article (Audio)'}
            >
              {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5 text-pink-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
              <span className="hidden sm:inline">{isPlayingAudio ? 'Stop' : 'Listen'}</span>
            </button>

            {/* Bookmark Button */}
            <button
              onClick={() => toggleSaveArticle(current)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 ${
                isSaved
                  ? 'bg-purple-600/20 border-purple-500/50 text-purple-300'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white'
              }`}
              title={isSaved ? 'Remove from Saved' : 'Save to Library'}
            >
              {isSaved ? <BookmarkCheck className="w-3.5 h-3.5 text-purple-400" /> : <Bookmark className="w-3.5 h-3.5 text-slate-400" />}
              <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
            </button>

            {/* Font Size Adjuster */}
            <div className="flex items-center rounded-xl bg-black/40 border border-white/10 p-0.5 text-xs text-slate-300">
              <button
                onClick={() => setFontSizeLevel(0)}
                title="Small text"
                className={`px-2.5 py-1 rounded-lg transition-colors ${fontSizeLevel === 0 ? 'bg-purple-600/50 text-cyan-300 font-bold' : 'hover:text-white'}`}
              >
                A-
              </button>
              <button
                onClick={() => setFontSizeLevel(1)}
                title="Normal text"
                className={`px-2.5 py-1 rounded-lg transition-colors ${fontSizeLevel === 1 ? 'bg-purple-600/50 text-cyan-300 font-bold' : 'hover:text-white'}`}
              >
                A
              </button>
              <button
                onClick={() => setFontSizeLevel(2)}
                title="Large text"
                className={`px-2.5 py-1 rounded-lg transition-colors ${fontSizeLevel === 2 ? 'bg-purple-600/50 text-cyan-300 font-bold' : 'hover:text-white'}`}
              >
                A+
              </button>
            </div>

            {/* Share / Copy Link Button */}
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
              title="Copy Article Link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-cyan-400" />}
              <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Article Editorial Card Container */}
        <article className="rounded-3xl p-6 sm:p-10 bg-[#0a0e24]/90 border border-white/10 shadow-2xl shadow-purple-950/20 space-y-8">
          {/* Article Header Metadata */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold uppercase tracking-wider">
                {current.category || 'Anime Industry'}
              </span>
              <span className="text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                {current.readTime || '3 min read'}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {current.publishedAt}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black font-heading tracking-tight text-white leading-tight">
              {current.title}
            </h1>

            {/* Byline / Source Attribution Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <span className="text-purple-300 font-bold flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  {current.author || 'Anime News Staff'}
                </span>
                <span>•</span>
                <span className="text-slate-300 font-semibold">{current.sourceName || 'Anime News Network'}</span>
              </div>

              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AniCart Verified In-App Reading View</span>
              </div>
            </div>
          </div>

          {/* Hero Banner Image */}
          <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl max-h-[480px] bg-[#070b1c]">
            <img
              src={current.coverImage || current.image || bannerImages[0]}
              alt={current.title}
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = bannerImages[0];
              }}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Interactive Table of Contents for Long Articles */}
          {current.tableOfContents && current.tableOfContents.length > 1 && (
            <div className="p-5 rounded-2xl bg-[#080c1f] border border-cyan-500/20 shadow-inner space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold font-mono text-cyan-300 uppercase tracking-wider">
                <List className="w-4 h-4 text-cyan-400" />
                <span>Table of Contents</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 pl-4 border-l border-white/10 font-sans">
                {current.tableOfContents.map((toc) => (
                  <li key={toc.id}>
                    <a
                      href={`#${toc.id}`}
                      className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 py-0.5"
                    >
                      <span className="text-purple-400">•</span>
                      <span>{toc.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Executive Summary Box (shown if complete content exists) */}
          {current.hasFullContent && current.summary && (
            <div className="p-5 rounded-2xl bg-purple-950/30 border border-purple-500/30 text-purple-200 leading-relaxed shadow-inner space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold font-mono text-purple-300 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Executive Summary</span>
              </div>
              <p className="text-sm text-slate-200 font-normal leading-relaxed">
                {current.summary}
              </p>
            </div>
          )}

          {/* Main Content Rendered via Markdown & Structured Tables Engine */}
          {readerLoading ? (
            <div className="py-12 space-y-4">
              <div className="flex items-center gap-2 text-xs text-cyan-300 font-mono">
                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span>Rendering complete article and parsing tables...</span>
              </div>
              <div className="h-4 bg-white/10 rounded w-full animate-pulse" />
              <div className="h-4 bg-white/10 rounded w-5/6 animate-pulse" />
              <div className="h-4 bg-white/10 rounded w-4/6 animate-pulse" />
            </div>
          ) : (
            <ArticleContentRenderer
              content={current.markdownContent || current.content}
              paragraphs={current.paragraphs}
              tableData={current.tableData}
              citations={current.citations}
              fontSizeLevel={fontSizeLevel}
              status={current.status}
              hasFullContent={current.hasFullContent}
              summary={current.summary}
              sourceUrl={current.sourceUrl || current.url}
              sourceName={current.sourceName || 'Anime News Network'}
              coverImage={current.coverImage || current.image}
              onRetry={() => handleOpenArticle(activeArticle || current)}
            />
          )}

          {/* Article Footer & Verification Attribution */}
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-xs text-slate-400 space-y-1">
              <div>
                <span>Original Publication: </span>
                <strong className="text-white">{current.sourceName || 'Anime News Network'}</strong>
              </div>
              <p className="text-[11px] text-slate-500">
                Processed with clean Markdown, table sanitization, and responsive column rendering.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {current.sourceUrl && (
                <a
                  href={current.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 font-medium"
                >
                  <span>Publisher Source</span>
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                </a>
              )}

              <button
                onClick={handleBackToNews}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all flex items-center gap-1.5"
              >
                <span>Back to News</span>
                <ChevronUp className="w-3.5 h-3.5 rotate-90" />
              </button>
            </div>
          </div>

          {/* Continuous Reading Navigation (Previous / Next Story) */}
          {(prevArticle || nextArticle) && (
            <div className="pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {prevArticle ? (
                <button
                  onClick={() => handleOpenArticle(prevArticle)}
                  className="text-left p-4 rounded-2xl bg-[#070b1b] border border-white/10 hover:border-cyan-500/40 transition-all group flex items-center gap-3 cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5 text-cyan-400 group-hover:-translate-x-1 transition-transform flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-mono text-cyan-400 block tracking-wider">Previous Story</span>
                    <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1 block">
                      {prevArticle.title}
                    </span>
                  </div>
                </button>
              ) : <div />}

              {nextArticle ? (
                <button
                  onClick={() => handleOpenArticle(nextArticle)}
                  className="text-right p-4 rounded-2xl bg-[#070b1b] border border-white/10 hover:border-purple-500/40 transition-all group flex items-center justify-end gap-3 ml-auto w-full cursor-pointer"
                >
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-mono text-purple-400 block tracking-wider">Next Story</span>
                    <span className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1 block">
                      {nextArticle.title}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </button>
              ) : <div />}
            </div>
          )}

          {/* Related Stories Recommendations */}
          {current.relatedArticles && current.relatedArticles.length > 0 && (
            <div className="pt-8 border-t border-white/10 space-y-4">
              <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
                <span>Related Anime Stories</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {current.relatedArticles.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => handleOpenArticle(rel)}
                    className="group rounded-2xl overflow-hidden bg-[#070b1b] border border-white/10 hover:border-cyan-500/40 transition-all p-3 space-y-2 cursor-pointer"
                  >
                    <div className="relative h-28 rounded-xl overflow-hidden">
                      <img
                        src={rel.image}
                        alt={rel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-[9px] font-mono text-cyan-300 border border-white/10">
                        {rel.category}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white line-clamp-2 group-hover:text-cyan-300 transition-colors leading-snug">
                      {rel.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {rel.readTime || '3 min read'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    );
  }

  // =========================================================
  // VIEW B: MAIN ANIME EDITORIAL MAGAZINE HOME
  // =========================================================
  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Editorial Top Headline Banner & Search Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono mb-2">
            <Newspaper className="w-3.5 h-3.5 text-cyan-400" />
            <span>AniCart Editorial • Global Anime Dispatch</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black font-heading tracking-tight text-white">
            Anime News & Industry Bulletin
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Live breaking anime announcements, verified broadcast schedules, studio releases, and box office milestones.
          </p>
        </div>

        {/* Search Field & Refresh */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-72">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search news, series, studios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all shadow-inner font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={fetchInitialData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors flex-shrink-0 disabled:opacity-50"
            title="Refresh Feed"
          >
            <RefreshCw className={`w-4 h-4 text-purple-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Category Pills Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 select-none ${
                isSelected
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
              }`}
            >
              {cat}
            </button>
          );
        })}

        {savedArticles.length > 0 && (
          <button
            onClick={() => setSelectedCategory('Saved')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 select-none flex items-center gap-1.5 ${
              selectedCategory === 'Saved'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30 border border-cyan-400/40'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
            <span>Saved ({savedArticles.length})</span>
          </button>
        )}
      </div>

      {/* Error State Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 flex items-center justify-between text-xs text-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchInitialData}
            className="px-3 py-1 rounded-lg bg-red-600/40 hover:bg-red-600/60 text-white font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-8">
          <div className="h-80 sm:h-96 rounded-3xl bg-white/5 animate-pulse border border-white/10" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
              ))}
            </div>
            <div className="h-96 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
          </div>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-white/5 border border-dashed border-white/10 text-slate-400 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No articles found matching "{searchQuery}"</h3>
          <p className="text-xs text-slate-500">Try clearing the search query or changing category filter.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {/* =========================================================
             SECTION 1: FEATURED STORY HERO BANNER
             ========================================================= */}
          {featuredStory && (
            <div 
              onClick={() => handleOpenArticle(featuredStory)}
              className="group relative rounded-3xl overflow-hidden liquid-glass-card border border-white/15 p-6 sm:p-10 cursor-pointer transition-all duration-300 hover:border-cyan-400/50 hover:shadow-2xl hover:shadow-cyan-950/30"
            >
              {/* Cover Art Backdrop */}
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
                style={{ backgroundImage: `url(${featuredStory.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#070913] via-[#090e24]/90 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070913] via-transparent to-transparent pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="max-w-2xl space-y-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      Featured Story
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-black/60 border border-white/15 text-slate-300">
                      {featuredStory.category}
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      {featuredStory.readTime || '3 min read'}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-4xl font-black font-heading text-white tracking-tight leading-tight group-hover:text-cyan-300 transition-colors">
                    {featuredStory.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed font-normal max-w-xl">
                    {featuredStory.summary}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-400 font-mono">
                    <span className="text-purple-300 font-semibold">{featuredStory.author || featuredStory.sourceName}</span>
                    <span>•</span>
                    <span>{featuredStory.publishedAt}</span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold tracking-wide shadow-xl shadow-purple-600/30 transition-all flex items-center gap-2 group-hover:shadow-cyan-500/20"
                    >
                      <BookOpen className="w-4 h-4 text-cyan-300" />
                      <span>Read Full Article</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Cover Poster Image */}
                <div className="hidden md:block flex-shrink-0 relative group">
                  <img
                    src={featuredStory.image || bannerImages[0]}
                    alt={featuredStory.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = bannerImages[0];
                    }}
                    className="w-56 h-72 rounded-2xl object-cover shadow-2xl ring-2 ring-white/15 transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
             SECTION 2: LATEST NEWS GRID + TRENDING SIDEBAR
             ========================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT 2 COLUMNS: LATEST NEWS GRID */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="text-xl font-bold font-heading text-white flex items-center gap-2">
                  <span>Latest Stories</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono">
                    {remainingNews.length} Articles
                  </span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {remainingNews.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleOpenArticle(item)}
                    className="group rounded-2xl overflow-hidden liquid-glass-card flex flex-col justify-between border border-white/10 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/10 transition-all cursor-pointer select-none"
                  >
                    <div>
                      {/* Thumbnail Header */}
                      <div className="relative h-44 overflow-hidden bg-[#070b1c]">
                        <img
                          src={item.image || bannerImages[0]}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = bannerImages[0];
                          }}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#090d21] via-transparent to-black/40 pointer-events-none" />

                        {/* Category Pill */}
                        <div className="absolute top-2.5 left-2.5">
                          <span className="px-2.5 py-0.5 rounded-lg bg-black/75 backdrop-blur-md border border-white/15 text-[10px] font-semibold text-cyan-300">
                            {item.category}
                          </span>
                        </div>

                        {/* Read Time */}
                        <div className="absolute top-2.5 right-2.5">
                          <span className="px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-md border border-white/15 text-[10px] font-mono text-slate-300 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-purple-400" />
                            {item.readTime || '3 min read'}
                          </span>
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="p-4 space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-semibold text-purple-400 truncate max-w-[130px]">
                            {item.sourceName || item.source}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {item.publishedAt}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold font-heading text-white line-clamp-2 group-hover:text-cyan-300 transition-colors leading-snug">
                          {item.title}
                        </h4>

                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                          {item.summary}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer Button */}
                    <div className="p-4 pt-1">
                      <button
                        type="button"
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 group-hover:from-purple-600/50 group-hover:to-indigo-600/50 text-cyan-300 group-hover:text-white text-xs font-semibold border border-purple-500/30 group-hover:border-cyan-400/50 transition-all flex items-center justify-center gap-2"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Read on AniCart</span>
                        <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN: SIDEBAR (TRENDING NOW & UPCOMING EPISODES) */}
            <div className="space-y-8">
              {/* SIDEBAR WIDGET 1: TRENDING NOW (RANKED POPULAR ARTICLES) */}
              <div className="rounded-3xl p-5 sm:p-6 bg-[#0a0e22]/90 border border-white/10 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                    <h3 className="text-base font-bold font-heading text-white">Trending Now</h3>
                  </div>
                  <span className="text-[10px] font-mono text-purple-300 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                    Live Rank
                  </span>
                </div>

                <div className="divide-y divide-white/5">
                  {trending.map((tItem, idx) => (
                    <div
                      key={tItem.id || idx}
                      onClick={() => handleOpenArticle(tItem)}
                      className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3.5 group cursor-pointer"
                    >
                      {/* Rank Number Badge */}
                      <span className={`text-xl font-black font-heading w-6 flex-shrink-0 text-center ${
                        idx === 0
                          ? 'text-amber-400'
                          : idx === 1
                          ? 'text-cyan-400'
                          : idx === 2
                          ? 'text-purple-400'
                          : 'text-slate-600'
                      }`}>
                        {idx + 1}
                      </span>

                      <div className="flex-1 space-y-1">
                        <span className="text-[10px] font-mono text-purple-400 font-semibold block">
                          {tItem.category}
                        </span>
                        <h5 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
                          {tItem.title}
                        </h5>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                          <span>{tItem.readTime || '2 min read'}</span>
                          <span>•</span>
                          <span className="text-emerald-400">{tItem.views || '12k reads'}</span>
                        </div>
                      </div>

                      {/* Small Thumbnail */}
                      <img
                        src={tItem.image || bannerImages[0]}
                        alt={tItem.title}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = bannerImages[0];
                        }}
                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-white/10 group-hover:scale-105 transition-transform bg-[#070b1c]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* SIDEBAR WIDGET 2: UPCOMING EPISODES SCHEDULE */}
              <div className="rounded-3xl p-5 sm:p-6 bg-[#0a0e22]/90 border border-white/10 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Tv className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-base font-bold font-heading text-white">Upcoming Episodes</h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-300 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    IST
                  </span>
                </div>

                <div className="divide-y divide-white/5">
                  {upcomingEpisodes.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3">Schedule synchronizing...</p>
                  ) : (
                    upcomingEpisodes.map((ep) => (
                      <div key={ep.scheduleId || ep.animeId} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 truncate">
                          <img
                            src={ep.coverImage || bannerImages[0]}
                            alt={ep.title}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = bannerImages[0];
                            }}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-[#070b1c]"
                          />
                          <div className="truncate">
                            <h5 className="text-xs font-bold text-white truncate" title={ep.title}>
                              {ep.title}
                            </h5>
                            <span className="text-[10px] font-mono text-purple-400 block">
                              EP {ep.episode} • {ep.ist?.dayIST} {ep.ist?.timeIST}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-cyan-300 flex-shrink-0">
                          {ep.ist?.shortCountdown || ep.ist?.countdown || 'Upcoming'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
