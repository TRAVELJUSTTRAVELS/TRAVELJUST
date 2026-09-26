/**
 * Push Notification Service for TRAVEL JUST Mysuru Cabs
 * Manages browser push notification permissions, Web Push subscriptions,
 * topic filtering (Driver Assigned, Cab Arrived, etc.), and real-time dispatch sync.
 */

export type PushTopicKey = 'driverAssigned' | 'cabArrived' | 'tripStarted' | 'completed';

export interface PushNotificationTopics {
  driverAssigned: boolean;
  cabArrived: boolean;
  tripStarted: boolean;
  completed: boolean;
}

export interface RidePushSubscription {
  referenceId: string;
  customerPhone?: string;
  customerEmail?: string;
  topics: PushNotificationTopics;
  subscribedAt: number;
  browserPermission: NotificationPermission;
}

export interface PushNotificationPayload {
  id: string;
  referenceId: string;
  title: string;
  body: string;
  status: 'Driver Assigned' | 'Cab Arrived' | 'Trip Started' | 'Completed' | 'Pending Confirmation' | 'Cancelled' | string;
  timestamp: number;
  driverDetails?: {
    driverName?: string;
    driverPhone?: string;
    driverVehiclePlate?: string;
    driverVehicleModel?: string;
  };
  icon?: string;
  badge?: string;
  url?: string;
}

const STORAGE_PREFIX = 'tj_push_sub_';

/**
 * Synthesize a clean 2-tone audio chime using Web Audio API
 */
export function playNotificationChime(): void {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Tone 1: High crisp bell (587.33 Hz - D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: Harmonic resolving chime (880 Hz - A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.15, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.6);
  } catch (err) {
    console.debug('Web Audio chime not permitted or unavailable:', err);
  }
}

/**
 * Check if the current browser environment supports Push & Notifications
 */
export function isPushNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Retrieve current browser permission state
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'default';
  }
  return Notification.permission;
}

/**
 * Request permission from the user for notifications
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return 'denied';
  }
}

/**
 * Retrieve stored subscription for a specific booking reference
 */
export function getRidePushSubscription(referenceId: string): RidePushSubscription | null {
  if (typeof window === 'undefined' || !referenceId) return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${referenceId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Check if a ride has an active push subscription
 */
export function isRideSubscribed(referenceId: string): boolean {
  const sub = getRidePushSubscription(referenceId);
  return !!sub;
}

/**
 * Subscribe a booking reference to ride status updates
 */
export async function subscribeToRidePushNotifications(
  referenceId: string,
  options: {
    customerPhone?: string;
    customerEmail?: string;
    topics?: Partial<PushNotificationTopics>;
  } = {}
): Promise<{ success: boolean; permission: NotificationPermission; error?: string }> {
  const permission = await requestNotificationPermission();

  const topics: PushNotificationTopics = {
    driverAssigned: options.topics?.driverAssigned ?? true,
    cabArrived: options.topics?.cabArrived ?? true,
    tripStarted: options.topics?.tripStarted ?? true,
    completed: options.topics?.completed ?? true,
  };

  const subscriptionData: RidePushSubscription = {
    referenceId,
    customerPhone: options.customerPhone,
    customerEmail: options.customerEmail,
    topics,
    subscribedAt: Date.now(),
    browserPermission: permission,
  };

  // 1. Store in localStorage
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${referenceId}`, JSON.stringify(subscriptionData));
  } catch (e) {
    console.warn('Could not store push subscription locally:', e);
  }

  // 2. Sync with Backend
  try {
    await fetch('/api/notifications/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referenceId,
        customerPhone: options.customerPhone,
        customerEmail: options.customerEmail,
        topics,
        browserPermission: permission,
      }),
    });
  } catch (err) {
    console.warn('Could not sync push subscription to backend:', err);
  }

  // 3. Dispatch local event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('tj:push-subscription-changed', {
        detail: { referenceId, subscription: subscriptionData },
      })
    );
  }

  return { success: true, permission };
}

/**
 * Unsubscribe a booking from push updates
 */
export async function unsubscribeFromRidePush(referenceId: string): Promise<boolean> {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${referenceId}`);
  } catch {}

  try {
    await fetch('/api/notifications/push/unsubscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referenceId }),
    });
  } catch (err) {
    console.warn('Could not sync push unsubscribe to backend:', err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('tj:push-subscription-changed', {
        detail: { referenceId, subscription: null },
      })
    );
  }

  return true;
}

/**
 * Trigger an immediate test push notification for a specific ride status
 */
export async function sendTestRidePushNotification(
  referenceId: string,
  status: 'Driver Assigned' | 'Cab Arrived' | 'Trip Started' | 'Completed' = 'Driver Assigned'
): Promise<PushNotificationPayload> {
  const driverName = 'Suresh Gowda';
  const driverPhone = '+91 97407 54400';
  const vehiclePlate = 'KA 09 MJ 4492';
  const vehicleModel = 'Toyota Etios (Sedan)';

  let title = `🚗 Chauffeur Assigned: ${driverName}`;
  let body = `Chauffeur ${driverName} (${vehiclePlate}) is assigned to your ride #${referenceId}. Contact: ${driverPhone}.`;

  if (status === 'Cab Arrived') {
    title = `📍 Cab Arrived at Pickup Point!`;
    body = `Your chauffeur ${driverName} has arrived at the pickup location in ${vehicleModel} (${vehiclePlate}).`;
  } else if (status === 'Trip Started') {
    title = `🏁 Trip In Progress - #${referenceId}`;
    body = `Your journey with TRAVEL JUST has started. Sit back and enjoy the ride!`;
  } else if (status === 'Completed') {
    title = `✅ Trip Completed - #${referenceId}`;
    body = `Thank you for riding with TRAVEL JUST Mysuru. Your digital fare invoice is ready.`;
  }

  const payload: PushNotificationPayload = {
    id: `push_${Date.now()}`,
    referenceId,
    title,
    body,
    status,
    timestamp: Date.now(),
    driverDetails: {
      driverName,
      driverPhone,
      driverVehiclePlate: vehiclePlate,
      driverVehicleModel: vehicleModel,
    },
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    url: '/',
  };

  // 1. Trigger backend broadcast
  try {
    fetch('/api/notifications/push/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referenceId, status, payload }),
    }).catch(() => {});
  } catch {}

  // 2. Play audible audio chime
  playNotificationChime();

  // 3. Attempt native OS Notification if permitted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_TEST_NOTIFICATION',
          payload,
        });
      } else {
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon,
          badge: payload.badge,
        });
      }
    } catch (e) {
      console.debug('Direct native notification skipped, using in-app notification:', e);
    }
  }

  // 4. Dispatch in-app notification event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('tj:push-notification-received', { detail: payload })
    );
  }

  return payload;
}

/**
 * Setup real-time listener for push notifications using Server-Sent Events (SSE)
 * and Service Worker message forwarding
 */
export function setupPushNotificationListener(
  onNotification: (notification: PushNotificationPayload) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  // 1. Custom in-app event listener
  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<PushNotificationPayload>;
    if (custom.detail) {
      onNotification(custom.detail);
    }
  };
  window.addEventListener('tj:push-notification-received', handleCustomEvent);

  // 2. Service Worker postMessage listener (e.g. from notification click)
  const handleSwMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'TJ_PUSH_NOTIFICATION_CLICK') {
      const { referenceId, status } = event.data.payload || {};
      onNotification({
        id: `click_${Date.now()}`,
        referenceId: referenceId || 'MY-RIDE',
        title: `Ride Update (#${referenceId})`,
        body: `Status: ${status}`,
        status: status || 'Updated',
        timestamp: Date.now(),
      });
    }
  };
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', handleSwMessage);
  }

  // 3. Server-Sent Events for real-time dispatch from backend
  let eventSource: EventSource | null = null;
  try {
    eventSource = new EventSource('/api/notifications/push/stream');
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.referenceId) {
          playNotificationChime();
          onNotification(data);

          // If OS notifications are permitted, show OS notification
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(data.title || 'TRAVEL JUST Ride Update', {
                body: data.body,
                icon: '/pwa-192x192.png',
                badge: '/pwa-192x192.png',
              });
            } catch {}
          }
        }
      } catch (err) {
        console.debug('SSE parse error:', err);
      }
    };
  } catch (err) {
    console.debug('SSE initialization skipped:', err);
  }

  return () => {
    window.removeEventListener('tj:push-notification-received', handleCustomEvent);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.removeEventListener('message', handleSwMessage);
    }
    if (eventSource) {
      eventSource.close();
    }
  };
}
