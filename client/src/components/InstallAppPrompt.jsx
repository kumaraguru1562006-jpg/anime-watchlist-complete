import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Sparkles } from 'lucide-react';
import { InstallAppModal } from './InstallAppModal';

export const InstallAppPrompt = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check standalone
    const isDisplayStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isNavStandalone = window.navigator.standalone === true;
    const standalone = Boolean(isDisplayStandalone || isNavStandalone);
    setIsStandalone(standalone);

    if (standalone) return;

    // Check if dismissed recently (24 hours)
    const dismissedAt = localStorage.getItem('anicart_pwa_dismissed');
    if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < 24 * 60 * 60 * 1000) {
      return;
    }

    // Capture beforeinstallprompt
    const handleBeforePrompt = (e) => {
      e.preventDefault();
      window.__aniCartDeferredPrompt = e;
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforePrompt);

    // On iOS Safari or mobile browsers where prompt doesn't fire, show banner after 3 seconds
    const timer = setTimeout(() => {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile && !standalone) {
        setShowBanner(true);
      }
    }, 3000);

    // Global listener so Navbar or any component can dispatch 'open-anicart-install'
    const handleOpenModal = () => setIsOpen(true);
    window.addEventListener('open-anicart-install', handleOpenModal);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforePrompt);
      window.removeEventListener('open-anicart-install', handleOpenModal);
      clearTimeout(timer);
    };
  }, []);

  const handleDismiss = (e) => {
    e.stopPropagation();
    setShowBanner(false);
    localStorage.setItem('anicart_pwa_dismissed', Date.now().toString());
  };

  return (
    <>
      {/* Floating Bottom Install Banner for Mobile */}
      {showBanner && !isStandalone && (
        <div 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 p-3 rounded-2xl bg-[#0e142b]/95 border border-purple-500/40 shadow-2xl shadow-purple-950/80 backdrop-blur-xl cursor-pointer hover:border-cyan-400/50 transition-all duration-300 animate-in slide-in-from-bottom-5"
        >
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-400 p-[1.5px] flex-shrink-0 shadow-md">
              <div className="w-full h-full bg-[#070913] rounded-[9px] flex items-center justify-center">
                <img 
                  src="/icon-192.png" 
                  alt="AniCart" 
                  className="w-full h-full object-cover" 
                  onError={(e) => { e.target.style.display = 'none'; }} 
                />
                <span className="font-heading font-black text-cyan-300 text-sm">氣</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-bold text-xs text-white">Install AniCart App</span>
                <span className="text-[9px] px-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">Free</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                Add to your home screen for fullscreen view & fast offline load
              </p>
            </div>

            <button 
              onClick={handleDismiss}
              title="Dismiss"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Full Modal */}
      <InstallAppModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default InstallAppPrompt;
