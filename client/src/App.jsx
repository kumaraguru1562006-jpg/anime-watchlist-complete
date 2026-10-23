import React, { useState, Component } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LiquidGlassNavbar } from './components/LiquidGlassNavbar';
import { CrunchyrollTopHero } from './components/CrunchyrollTopHero';
import { AiringScheduleIST } from './components/AiringScheduleIST';
import { Top5MonthlyAnime } from './components/Top5MonthlyAnime';
import { ThisYearAiringSection } from './components/ThisYearAiringSection';
import { AiredAnimeSection } from './components/AiredAnimeSection';
import { WatchlistManager } from './components/WatchlistManager';
import { NewsSection } from './components/NewsSection';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { WelcomeLoginPage } from './components/WelcomeLoginPage';
import { AnimeDetailModal } from './components/AnimeDetailModal';
import { StatsModal } from './components/StatsModal';
import { SearchModal } from './components/SearchModal';
import { AniChatBot } from './components/AniChatBot';
import { SharedWatchedViewModal } from './components/SharedWatchedViewModal';
import { Database, Shield, Flame, AlertCircle } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AniSphere UI caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070913] text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full p-8 rounded-3xl bg-[#0e1329] border border-red-500/30 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
            <h2 className="text-xl font-bold font-heading">Something went wrong</h2>
            <p className="text-xs text-slate-400">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-xs text-white"
            >
              Reload Platform
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function MainLayout({ onGoToLogin }) {
  const [activeTab, setActiveTab] = useState('airing'); // 'airing' | 'top_monthly' | 'aired' | 'towatch' | 'watched' | 'news'
  const [selectedAnimeId, setSelectedAnimeId] = useState(null);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="relative min-h-screen flex flex-col justify-between selection:bg-purple-500/30 selection:text-purple-200">
      {/* Background Liquid Ambient Orbs */}
      <div className="liquid-orb-1" />
      <div className="liquid-orb-2" />

      {/* Floating Liquid Glass Navigation Bar */}
      <LiquidGlassNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        onGoToLogin={onGoToLogin}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16 z-10">
        {/* CRUNCHYROLL TOP ANIME OF THE MONTH - FEATURED RIGHT ON TOP */}
        {(activeTab === 'airing' || activeTab === 'top_monthly') && (
          <CrunchyrollTopHero
            onOpenDetail={(id) => setSelectedAnimeId(id)}
          />
        )}

        {/* VIEW 1: Currently Airing Anime in Indian Standard Time (IST) */}
        {activeTab === 'airing' && (
          <AiringScheduleIST
            onOpenDetail={(id) => setSelectedAnimeId(id)}
          />
        )}

        {/* VIEW 2: Top 5 Anime of the Month Dedicated Full View */}
        {activeTab === 'top_monthly' && (
          <Top5MonthlyAnime
            onOpenDetail={(id) => setSelectedAnimeId(id)}
          />
        )}

        {/* VIEW 3: Airing This Year Anime (2026 Showcase with Month-of-Airing Badges) */}
        {(activeTab === 'this_year' || activeTab === 'upcoming') && (
          <ThisYearAiringSection
            onOpenDetail={(id) => setSelectedAnimeId(id)}
          />
        )}

        {/* VIEW 4: All Aired Anime (Finished series to mark watched or to-watch) */}
        {activeTab === 'aired' && (
          <AiredAnimeSection
            onOpenDetail={(id) => setSelectedAnimeId(id)}
          />
        )}

        {/* VIEW 4: Anime To Watch List */}
        {activeTab === 'towatch' && (
          <WatchlistManager
            key="towatch"
            initialStatus="plan_to_watch"
            onOpenDetail={(id) => setSelectedAnimeId(id)}
            onBrowseAiring={() => setActiveTab('airing')}
          />
        )}

        {/* VIEW 5: Anime Watched List */}
        {activeTab === 'watched' && (
          <WatchlistManager
            key="watched"
            initialStatus="completed"
            onOpenDetail={(id) => setSelectedAnimeId(id)}
            onBrowseAiring={() => setActiveTab('airing')}
          />
        )}

        {/* VIEW 6: Latest Live Anime News */}
        {activeTab === 'news' && (
          <NewsSection />
        )}
      </main>

      {/* Global Interactive Modals */}
      <GoogleAuthModal />
      <UserProfileModal />

      <AnimeDetailModal
        animeId={selectedAnimeId}
        onClose={() => setSelectedAnimeId(null)}
        onActionSuccess={() => {}}
      />

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onOpenDetail={(id) => setSelectedAnimeId(id)}
      />

      {/* Interactive AI Anime Recommender Chat Bot */}
      <AniChatBot
        onOpenDetail={(id) => setSelectedAnimeId(id)}
      />

      {/* Public Shared Watched List Showcase Modal */}
      <SharedWatchedViewModal
        onOpenDetail={(id) => setSelectedAnimeId(id)}
      />

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-[#070913]/90 backdrop-blur-xl py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-heading font-extrabold text-white text-sm">AniCart</span>
            <span>— Liquid Glass Anime Watchlist & IST Broadcast Hub</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-orange-400 font-semibold">
              <Flame className="w-3.5 h-3.5" />
              <span>Crunchyroll Charts</span>
            </span>
            <span className="flex items-center gap-1.5 text-purple-300">
              <Database className="w-3.5 h-3.5" />
              <span>MongoDB Watchlists</span>
            </span>
            <span className="flex items-center gap-1.5 text-cyan-300">
              <Shield className="w-3.5 h-3.5" />
              <span>Firebase Email Auth</span>
            </span>
            <span className="flex items-center gap-1 text-amber-300 font-mono">
              🇮🇳 IST (UTC+5:30)
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [guestMode, setGuestMode] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070913] flex flex-col items-center justify-center space-y-4">
        <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-[2px] animate-spin shadow-lg shadow-purple-500/25">
          <div className="w-full h-full bg-[#070913] rounded-2xl flex items-center justify-center">
            <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-tr from-purple-400 to-cyan-300 font-heading">
              亞
            </span>
          </div>
        </div>
        <p className="text-xs text-purple-300 font-mono tracking-wider animate-pulse">
          Restoring AniCart Session...
        </p>
      </div>
    );
  }

  // If user is not authenticated and hasn't explicitly chosen to browse as guest, show the guided login page
  if (!user && !guestMode) {
    return <WelcomeLoginPage onContinueGuest={() => setGuestMode(true)} />;
  }

  return <MainLayout onGoToLogin={() => setGuestMode(false)} />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
