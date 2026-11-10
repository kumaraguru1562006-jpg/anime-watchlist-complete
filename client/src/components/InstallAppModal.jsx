import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  Monitor, 
  CheckCircle2, 
  X, 
  Share, 
  PlusSquare, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';

export const InstallAppModal = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed as PWA or native webview)
    const checkStandalone = () => {
      const isDisplayStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isNavigatorStandalone = window.navigator.standalone === true;
      setIsStandalone(Boolean(isDisplayStandalone || isNavigatorStandalone));
    };

    checkStandalone();

    const ua = navigator.userAgent || '';
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !window.MSStream);
    setIsAndroid(/Android/i.test(ua));

    // Capture beforeinstallprompt for Android Chrome/Edge/Desktop Chrome
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.__aniCartDeferredPrompt = e;
    };

    if (window.__aniCartDeferredPrompt) {
      setDeferredPrompt(window.__aniCartDeferredPrompt);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setIsStandalone(true);
      setInstallSuccess(true);
      setDeferredPrompt(null);
      window.__aniCartDeferredPrompt = null;
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    const prompt = deferredPrompt || window.__aniCartDeferredPrompt;
    if (prompt) {
      try {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') {
          setInstallSuccess(true);
          setDeferredPrompt(null);
          window.__aniCartDeferredPrompt = null;
        }
      } catch (err) {
        console.error('Install prompt error:', err);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg rounded-3xl bg-[#0d1226] border border-purple-500/30 p-6 sm:p-7 shadow-2xl shadow-purple-950/60 text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-purple-600/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-cyan-600/20 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Icon */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-[2px] shadow-lg shadow-purple-500/30 flex-shrink-0">
            <div className="w-full h-full bg-[#070913] rounded-[14px] flex items-center justify-center overflow-hidden">
              <img 
                src="/icon-192.png" 
                alt="AniCart App Logo" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-extrabold text-xl text-white tracking-tight">
                Install AniCart App
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                PWA Standalone
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Instant launch from home screen • Fullscreen • Ultra-low data
            </p>
          </div>
        </div>

        {/* Status / Body */}
        {isStandalone || installSuccess ? (
          <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-300">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">AniCart App is Active!</h3>
            <p className="text-xs text-emerald-200/80">
              You are currently experiencing AniCart in standalone app mode with native hardware acceleration and offline caching enabled.
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
            >
              Done & Return to App
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                <Zap className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <div className="text-[11px] font-bold text-white">Instant Launch</div>
                <div className="text-[9px] text-slate-400">Zero loading latency</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                <Smartphone className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                <div className="text-[11px] font-bold text-white">No App Store</div>
                <div className="text-[9px] text-slate-400">Install directly</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                <ShieldCheck className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                <div className="text-[11px] font-bold text-white">Safe & Light</div>
                <div className="text-[9px] text-slate-400">&lt; 2MB storage size</div>
              </div>
            </div>

            {/* Android / Chrome 1-Click Install Button */}
            {(deferredPrompt || window.__aniCartDeferredPrompt) && (
              <button
                onClick={handleInstallClick}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 group transition-all"
              >
                <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Tap to Install AniCart on This Device</span>
              </button>
            )}

            {/* iOS Safari Instructions */}
            {isIOS && (
              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span>How to install on Apple iOS (iPhone & iPad):</span>
                </div>
                <ol className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center font-bold text-[10px] text-purple-200 flex-shrink-0 mt-0.5">1</span>
                    <span>Tap the <strong className="text-white inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]"><Share className="w-3 h-3 inline text-cyan-300" /> Share</strong> button in Safari's bottom toolbar.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center font-bold text-[10px] text-purple-200 flex-shrink-0 mt-0.5">2</span>
                    <span>Scroll down and select <strong className="text-white inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]"><PlusSquare className="w-3 h-3 inline text-purple-300" /> Add to Home Screen</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center font-bold text-[10px] text-purple-200 flex-shrink-0 mt-0.5">3</span>
                    <span>Tap <strong className="text-cyan-300 font-semibold">Add</strong> in top-right. AniCart will appear right on your home screen!</span>
                  </li>
                </ol>
              </div>
            )}

            {/* Android / Desktop Chrome/Edge Manual Guide (if beforeinstallprompt didn't fire yet) */}
            {!deferredPrompt && !window.__aniCartDeferredPrompt && !isIOS && (
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2 text-xs text-slate-300">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-cyan-400" />
                  <span>Desktop & Android Browser Installation</span>
                </div>
                <p className="text-slate-400">
                  In Chrome or Edge, click the <strong>Install</strong> icon in the address bar (at the right edge of URL), or tap the <strong>three dots (⋮)</strong> in Chrome and tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                </p>
              </div>
            )}

            {/* Footer Notice */}
            <div className="pt-2 text-center">
              <span className="text-[10px] text-slate-500 font-mono">
                Works seamlessly on Android, iOS, Windows, macOS & Linux
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstallAppModal;
