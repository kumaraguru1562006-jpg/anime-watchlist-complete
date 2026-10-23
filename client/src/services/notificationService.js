/**
 * AniCart Push Notification & Episode Airing Alert Service
 * Manages native Web Push Notifications, Service Worker, and In-App Episode Alert Center
 */

class NotificationService {
  constructor() {
    this.swRegistration = null;
    this.initServiceWorker();
  }

  // Register service worker for reliable desktop & mobile push notifications
  async initServiceWorker() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        this.swRegistration = registration;
      } catch (err) {
        console.warn('Service worker registration error:', err.message);
      }
    }
  }

  isSupported() {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  getPermission() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission; // 'granted' | 'denied' | 'default'
  }

  async requestPermission() {
    if (!this.isSupported()) {
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.playChime();
      }
      return permission;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return 'default';
    }
  }

  // Pure Web Audio API chime (synthesizes subtle pleasant dual-tone alert chime without external assets)
  playChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.setValueAtTime(880.00, now + 0.1); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880.00, now);
      osc2.frequency.setValueAtTime(1174.66, now + 0.1); // D6

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch (e) {
      // Audio autoplay policy might restrict without user gesture
    }
  }

  /**
   * Display native browser push notification
   */
  async showPushNotification({ title, body, icon, tag, data }) {
    if (this.getPermission() !== 'granted') return null;

    this.playChime();

    const options = {
      body,
      icon: icon || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=150&q=80',
      badge: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=96&q=80',
      tag: tag || `anicart-${Date.now()}`,
      data: data || { url: window.location.origin },
      renotify: true,
      requireInteraction: false,
    };

    try {
      // Try Service Worker registration first
      if (this.swRegistration && this.swRegistration.showNotification) {
        return await this.swRegistration.showNotification(title, options);
      }
      
      // Fallback to standard Notification constructor
      const notif = new Notification(title, options);
      notif.onclick = () => {
        window.focus();
        if (data?.url) window.location.href = data.url;
        notif.close();
      };
      return notif;
    } catch (err) {
      console.warn('Native notification display error:', err);
      return null;
    }
  }

  // Stored in-app notifications
  getInAppNotifications() {
    try {
      const raw = localStorage.getItem('anicart_in_app_notifications');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  saveInAppNotifications(list) {
    try {
      localStorage.setItem('anicart_in_app_notifications', JSON.stringify(list.slice(0, 30)));
    } catch (e) {}
  }

  addInAppNotification(notif) {
    const list = this.getInAppNotifications();
    // Prevent duplicate entries by id
    if (list.some((n) => n.id === notif.id)) return list;

    const updated = [
      {
        ...notif,
        timestamp: Date.now(),
        isRead: false,
      },
      ...list,
    ].slice(0, 30);

    this.saveInAppNotifications(updated);
    return updated;
  }

  markAllAsRead() {
    const list = this.getInAppNotifications().map((n) => ({ ...n, isRead: true }));
    this.saveInAppNotifications(list);
    return list;
  }

  getUnreadCount() {
    return this.getInAppNotifications().filter((n) => !n.isRead).length;
  }

  getNotifiedIds() {
    try {
      const raw = localStorage.getItem('anicart_notified_episodes');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  recordNotifiedId(id) {
    try {
      const ids = this.getNotifiedIds();
      ids[id] = Date.now();
      localStorage.setItem('anicart_notified_episodes', JSON.stringify(ids));
    } catch (e) {}
  }

  /**
   * Check live airing alerts for user's pinned anime and trigger notifications
   */
  async processAiringAlerts(alerts = []) {
    if (!alerts || alerts.length === 0) return [];

    const notifiedIds = this.getNotifiedIds();
    const newAiredAlerts = [];

    for (const alert of alerts) {
      // If the episode has aired
      if (alert.hasAired) {
        const uniqueKey = `aired_${alert.animeId}_ep_${alert.episode}`;
        
        if (!notifiedIds[uniqueKey]) {
          // New episode just aired!
          newAiredAlerts.push(alert);
          this.recordNotifiedId(uniqueKey);

          // 1. Add to In-App Notification Center
          this.addInAppNotification({
            id: uniqueKey,
            animeId: alert.animeId,
            title: alert.title,
            coverImage: alert.coverImage,
            episode: alert.episode,
            message: `Episode ${alert.episode} of "${alert.title}" is now available in Indian Standard Time (IST)!`,
            timeIST: alert.timeIST,
            dateIST: alert.dateIST,
            type: 'episode_aired',
          });

          // 2. Fire Native Push Notification
          this.showPushNotification({
            title: `AniCart • New Episode Aired! 🇮🇳`,
            body: `Episode ${alert.episode} of "${alert.title}" has just aired in Indian Standard Time!`,
            icon: alert.coverImage,
            tag: uniqueKey,
            data: { url: window.location.origin, animeId: alert.animeId },
          });
        }
      }
    }

    return newAiredAlerts;
  }

  /**
   * User 1-click test button to verify push notifications work immediately
   */
  async triggerTestPushNotification() {
    const perm = await this.requestPermission();
    if (perm !== 'granted') {
      return { success: false, permission: perm, message: 'Notification permission was not granted.' };
    }

    const testItem = {
      id: `test_${Date.now()}`,
      animeId: 16498,
      title: 'Solo Leveling Season 2: Arise from the Shadow',
      coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=200&q=80',
      episode: 12,
      timeIST: '11:30 PM',
      dateIST: 'Today',
      hasAired: true,
    };

    // Add in-app notification
    this.addInAppNotification({
      id: testItem.id,
      animeId: testItem.animeId,
      title: testItem.title,
      coverImage: testItem.coverImage,
      episode: testItem.episode,
      message: `🔔 Test Notification: Episode ${testItem.episode} of "${testItem.title}" has aired in IST! Push notifications are working perfectly.`,
      timeIST: testItem.timeIST,
      dateIST: testItem.dateIST,
      type: 'test_notification',
    });

    // Native push
    await this.showPushNotification({
      title: `AniCart • Push Notifications Active! 🇮🇳`,
      body: `Success! You will receive instant notifications whenever your pinned anime episodes air.`,
      icon: testItem.coverImage,
      tag: testItem.id,
    });

    return { success: true, permission: perm };
  }
}

export const notificationService = new NotificationService();
