// Service Worker Push Notification Handler for TRAVEL JUST Mysuru
// Handles background push events, notification display, and notification clicks

self.addEventListener('push', (event) => {
  let data = {
    title: 'TRAVEL JUST Ride Update',
    body: 'Your ride status has been updated.',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    url: '/',
    referenceId: '',
    status: '',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: data.url || '/',
      referenceId: data.referenceId,
      status: data.status,
      timestamp: Date.now(),
    },
    actions: [
      { action: 'track', title: 'Track Ride' },
      { action: 'dismiss', title: 'Close' },
    ],
    tag: `tj-ride-${data.referenceId || 'update'}-${data.status || Date.now()}`,
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl =
    (event.notification.data && event.notification.data.url) || '/';
  const referenceId =
    event.notification.data && event.notification.data.referenceId;
  const status = event.notification.data && event.notification.data.status;

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If a window is already open, focus it and post a message
        for (const client of clientList) {
          if (client.url && 'focus' in client) {
            client.postMessage({
              type: 'TJ_PUSH_NOTIFICATION_CLICK',
              payload: {
                referenceId,
                status,
                targetUrl,
              },
            });
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Allow client pages to trigger a simulated push test through the service worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_TEST_NOTIFICATION') {
    const data = event.data.payload || {};
    self.registration.showNotification(data.title || 'TRAVEL JUST Notification', {
      body: data.body || 'Test notification delivered successfully.',
      icon: data.icon || '/pwa-192x192.png',
      badge: data.badge || '/pwa-192x192.png',
      vibrate: [150, 80, 150],
      data: {
        referenceId: data.referenceId,
        status: data.status,
        url: data.url || '/',
      },
      tag: `test-${Date.now()}`,
      renotify: true,
    });
  }
});
