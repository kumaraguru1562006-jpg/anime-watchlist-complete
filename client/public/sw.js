// AniCart Service Worker for Web Push & Episode Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle notification click: Focus active tab or open anime watchlist
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle push event if backend sends Web Push payloads
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || 'AniCart • New Episode Aired! 🇮🇳';
    const options = {
      body: payload.body || 'A new anime episode is now available in Indian Standard Time!',
      icon: payload.icon || '/favicon.ico',
      badge: '/favicon.ico',
      data: payload.data || { url: '/' },
      vibrate: [200, 100, 200],
      tag: payload.tag || `anicart-${Date.now()}`,
      renotify: true,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('Error showing push notification:', err);
  }
});
