import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Volume2, 
  ShieldCheck, 
  Plus, 
  Tv, 
  Pin,
  Calendar
} from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';

export const NotificationDrawer = ({ isOpen, onClose, onOpenDetail }) => {
  const { user, updateEpisodeProgress } = useAuth();
  const [permission, setPermission] = useState(notificationService.getPermission());
  const [notifications, setNotifications] = useState([]);
  const [testResult, setTestResult] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPermission(notificationService.getPermission());
      setNotifications(notificationService.getInAppNotifications());
      notificationService.markAllAsRead();
    }
  }, [isOpen]);

  // Escape key handler to close drawer instantly
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleRequestPermission = async () => {
    const res = await notificationService.requestPermission();
    setPermission(res);
  };

  const handleTestPush = async () => {
    setTesting(true);
    setTestResult('');
    try {
      const res = await notificationService.triggerTestPushNotification();
      setPermission(res.permission);
      setNotifications(notificationService.getInAppNotifications());
      if (res.success) {
        setTestResult('Push notification triggered successfully! Check your screen/banner.');
      } else {
        setTestResult(res.message || 'Notification was blocked by your browser settings.');
      }
    } catch (err) {
      setTestResult(`Error: ${err.message}`);
    } finally {
      setTesting(false);
      setTimeout(() => setTestResult(''), 5000);
    }
  };

  const handleMarkWatched = async (animeId) => {
    await updateEpisodeProgress(animeId, 1);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[80] pointer-events-auto flex items-start justify-end p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md my-14 sm:my-16 rounded-3xl bg-[#0e1329] border border-purple-500/30 p-5 sm:p-6 shadow-2xl shadow-purple-950/60 text-slate-100 space-y-4 max-h-[85vh] flex flex-col overflow-hidden pointer-events-auto cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-heading text-white flex items-center gap-2">
                <span>Episode Alerts (IST)</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Push alerts for your pinned ongoing anime
              </p>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer border border-white/10 flex items-center justify-center"
            title="Close Drawer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Browser Push Permission & Quick Test Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/50 to-indigo-950/50 border border-purple-500/30 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Browser Push Alerts</span>
            </span>

            {permission === 'granted' ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" />
                Active
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                {permission === 'denied' ? 'Blocked in Browser' : 'Not Enabled'}
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            {permission === 'granted' 
              ? 'Native push notifications are active. You will get instant alerts the minute your pinned anime air.' 
              : 'Enable push alerts to receive instant notifications on your desktop or mobile when pinned episodes air in IST.'}
          </p>

          <div className="flex items-center gap-2 pt-1">
            {permission !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Enable Push Alerts</span>
              </button>
            )}

            <button
              onClick={handleTestPush}
              disabled={testing}
              className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-purple-200 transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{testing ? 'Testing...' : 'Test Alert'}</span>
            </button>
          </div>

          {testResult && (
            <p className="text-[11px] text-cyan-300 font-mono mt-1 animate-in fade-in">
              {testResult}
            </p>
          )}
        </div>

        {/* Notifications Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-none">
          {notifications.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/5 text-slate-400 space-y-2 my-auto">
              <Bell className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-xs font-semibold text-slate-300">No New Notifications</p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Pin your ongoing anime on the weekly schedule. When their next episode airs in Indian Standard Time, notifications appear here!
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-3 rounded-2xl liquid-glass-card border border-white/10 hover:border-purple-500/30 transition-all flex items-start gap-3 group"
              >
                <img
                  src={notif.coverImage || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=120&q=80'}
                  alt={notif.title}
                  onClick={() => {
                    if (onOpenDetail && notif.animeId) {
                      onOpenDetail(notif.animeId);
                      onClose();
                    }
                  }}
                  className="w-12 h-16 rounded-xl object-cover ring-1 ring-white/10 cursor-pointer flex-shrink-0 group-hover:scale-105 transition-transform"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                      EP {notif.episode || 'NEW'} AIRED
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {notif.timeIST ? `${notif.timeIST} IST` : 'Just now'}
                    </span>
                  </div>

                  <h3 
                    onClick={() => {
                      if (onOpenDetail && notif.animeId) {
                        onOpenDetail(notif.animeId);
                        onClose();
                      }
                    }}
                    className="text-xs font-bold text-white line-clamp-1 cursor-pointer hover:text-purple-300 transition-colors"
                  >
                    {notif.title}
                  </h3>

                  <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5 leading-relaxed">
                    {notif.message}
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    {notif.animeId && (
                      <button
                        onClick={() => handleMarkWatched(notif.animeId)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+1 Ep Watched</span>
                      </button>
                    )}

                    {notif.animeId && (
                      <button
                        onClick={() => {
                          if (onOpenDetail) onOpenDetail(notif.animeId);
                          onClose();
                        }}
                        className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[10px] transition-colors flex items-center gap-1"
                      >
                        <span>Details</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Back Button */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <span>← Back to Platform</span>
          </button>

          {notifications.length > 0 && (
            <button
              onClick={() => {
                notificationService.saveInAppNotifications([]);
                setNotifications([]);
              }}
              className="text-purple-400 hover:text-purple-300 font-semibold transition-colors text-[11px]"
            >
              Clear all
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
