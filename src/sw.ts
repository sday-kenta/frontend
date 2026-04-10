/// <reference lib="webworker" />

import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging/sw';
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute, type PrecacheEntry } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import {
  buildPushNotificationUrl,
  extractPushNotificationNavigation,
  PUSH_NOTIFICATION_CLIENT_MESSAGE,
} from '@/lib/pushNotificationsShared';

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<PrecacheEntry | string>;
};

type FirebaseMessagingConfig = FirebaseOptions & {
  vapidKey: string;
};

const APP_BASE_URL = import.meta.env.BASE_URL;

function readFirebaseMessagingConfig(): FirebaseMessagingConfig | null {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim();
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim();
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim();
  const appId = import.meta.env.VITE_FIREBASE_APP_ID?.trim();
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY?.trim();

  if (!apiKey || !projectId || !messagingSenderId || !appId || !vapidKey) {
    return null;
  }

  return {
    apiKey,
    projectId,
    messagingSenderId,
    appId,
    vapidKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() || undefined,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() || undefined,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID?.trim() || undefined,
  };
}

async function focusOrOpenApp(notificationData: unknown) {
  const navigation = extractPushNotificationNavigation(notificationData);
  if (!navigation) {
    return;
  }

  const clients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });

  const appClient =
    clients.find((client) => {
      const url = new URL(client.url);
      return url.origin === self.location.origin && url.pathname.startsWith(APP_BASE_URL);
    }) ?? clients.find((client) => new URL(client.url).origin === self.location.origin);

  if (appClient) {
    appClient.postMessage({
      type: PUSH_NOTIFICATION_CLIENT_MESSAGE,
      payload: navigation,
    });
    await appClient.focus();
    return;
  }

  await self.clients.openWindow(
    new URL(buildPushNotificationUrl(APP_BASE_URL, navigation), self.location.origin).toString(),
  );
}

self.addEventListener('notificationclick', (event) => {
  const navigation = extractPushNotificationNavigation(event.notification?.data);
  if (!navigation) {
    return;
  }

  event.stopImmediatePropagation();
  event.notification.close();
  event.waitUntil(focusOrOpenApp(event.notification.data));
});

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

registerRoute(
  new NavigationRoute(createHandlerBoundToURL(`${APP_BASE_URL}index.html`), {
    denylist: [/^\/v1\//],
  }),
);

async function initializeFirebaseMessagingInServiceWorker() {
  const config = readFirebaseMessagingConfig();
  if (!config) {
    return;
  }

  const supported = await isSupported().catch(() => false);
  if (!supported) {
    return;
  }

  const app = initializeApp(config);
  getMessaging(app);
}

void initializeFirebaseMessagingInServiceWorker();
