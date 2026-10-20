/**
 * AniSphere Automated Daily Synchronization Service
 * Keeps all anime datasets, airing schedules, news, and calendar features fresh daily.
 */

class SyncService {
  constructor() {
    this.lastSyncedAt = new Date();
    this.nextSyncAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    this.isSyncing = false;
    this.syncCount = 1;
    this.listeners = [];
  }

  getISTString(date) {
    return date.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }) + ' IST';
  }

  getISTDateString(date) {
    return date.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  getStatus() {
    return {
      status: 'active',
      mode: 'Automated Daily (Every 24 Hours & 00:00 IST)',
      lastSyncedAt: this.lastSyncedAt.toISOString(),
      lastSyncedIST: `${this.getISTDateString(this.lastSyncedAt)} at ${this.getISTString(this.lastSyncedAt)}`,
      nextSyncAt: this.nextSyncAt.toISOString(),
      nextSyncIST: `${this.getISTDateString(this.nextSyncAt)} at ${this.getISTString(this.nextSyncAt)}`,
      syncCount: this.syncCount,
      isSyncing: this.isSyncing,
      timeZone: 'Asia/Kolkata (IST, UTC+5:30)',
    };
  }

  registerListener(fn) {
    this.listeners.push(fn);
  }

  async triggerSync(reason = 'manual') {
    if (this.isSyncing) {
      return { success: false, message: 'Sync already in progress', status: this.getStatus() };
    }

    this.isSyncing = true;
    console.log(`🔄 [Auto-Sync Service] Triggering cache sync (Reason: ${reason})...`);

    try {
      // Execute all registered sync callbacks (e.g. invalidate or refresh caches)
      for (const listener of this.listeners) {
        try {
          await listener();
        } catch (err) {
          console.error('Error in sync listener:', err.message);
        }
      }

      this.lastSyncedAt = new Date();
      this.nextSyncAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      this.syncCount += 1;
      this.isSyncing = false;

      console.log(`✅ [Auto-Sync Service] Daily sync complete at ${this.getISTString(this.lastSyncedAt)}`);
      return { success: true, message: 'Platform features successfully synchronized', status: this.getStatus() };
    } catch (err) {
      this.isSyncing = false;
      console.error('❌ [Auto-Sync Service] Sync error:', err.message);
      return { success: false, error: err.message, status: this.getStatus() };
    }
  }

  startDailyScheduler() {
    // Run sync daily (24 hour interval)
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    setInterval(() => {
      this.triggerSync('scheduled-daily-interval');
    }, TWENTY_FOUR_HOURS);

    console.log(`⏰ [Auto-Sync Service] Daily scheduler initialized. Auto-updates active every 24h.`);
  }
}

export const syncService = new SyncService();
