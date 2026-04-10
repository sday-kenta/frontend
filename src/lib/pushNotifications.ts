import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
  type Messaging,
} from 'firebase/messaging';
import { ApiError, api, type PushDevicePlatform, type RegisterPushDeviceRequest } from '@/lib/api';
import { extractPushNotificationNavigation, type PushNotificationNavigation } from '@/lib/pushNotificationsShared';

const PUSH_DEVICE_ID_STORAGE_KEY = 'push:device-id';
const PUSH_FCM_TOKEN_STORAGE_KEY = 'push:fcm-token';

type FirebaseMessagingConfig = FirebaseOptions & {
  vapidKey: string;
};

type MessagingContext = {
  config: FirebaseMessagingConfig;
  messaging: Messaging;
  serviceWorkerRegistration: ServiceWorkerRegistration;
  platform: PushDevicePlatform;
};

export type PushSyncStatus =
  | 'enabled'
  | 'disabled'
  | 'not-configured'
  | 'unsupported'
  | 'permission-required'
  | 'permission-denied'
  | 'auth-missing'
  | 'error';

export type PushSyncResult = {
  ok: boolean;
  status: PushSyncStatus;
  message: string;
};

export type ForegroundPushMessage = PushNotificationNavigation & {
  raw: MessagePayload;
};

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

function readStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null;

  const authToken = window.localStorage.getItem('authToken');
  return authToken && authToken.trim() ? authToken.trim() : null;
}

function detectPushPlatform(): PushDevicePlatform | null {
  if (typeof navigator === 'undefined') return null;

  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('android')) return 'android';
  if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return 'ios';

  return null;
}

function getOrCreatePushDeviceId(): string {
  if (typeof window === 'undefined') {
    return 'push-device-server';
  }

  const existing = window.localStorage.getItem(PUSH_DEVICE_ID_STORAGE_KEY);
  if (existing && existing.trim()) {
    return existing.trim();
  }

  const created =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `push-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(PUSH_DEVICE_ID_STORAGE_KEY, created);
  return created;
}

function clearStoredPushToken() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PUSH_FCM_TOKEN_STORAGE_KEY);
}

function storePushToken(token: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PUSH_FCM_TOKEN_STORAGE_KEY, token);
}

function getAppVersion(): string | undefined {
  const configuredVersion = import.meta.env.VITE_APP_VERSION?.trim();
  if (configuredVersion) {
    return configuredVersion.slice(0, 64);
  }

  return 'pwa-web';
}

function toApiMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return fallback;
}

async function ensureMessagingContext(options: {
  requireAuth?: boolean;
} = {}): Promise<{ ok: true; context: MessagingContext } | { ok: false; result: PushSyncResult }> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      ok: false,
      result: {
        ok: false,
        status: 'unsupported',
        message: 'Push-уведомления доступны только в браузере.',
      },
    };
  }

  const config = readFirebaseMessagingConfig();
  if (!config) {
    return {
      ok: false,
      result: {
        ok: false,
        status: 'not-configured',
        message: 'Не заполнены переменные Firebase для push-уведомлений.',
      },
    };
  }

  const platform = detectPushPlatform();
  if (!platform) {
    return {
      ok: false,
      result: {
        ok: false,
        status: 'unsupported',
        message: 'Push-уведомления поддерживаются только на Android/iOS устройстве.',
      },
    };
  }

  if (options.requireAuth !== false && !readStoredAuthToken()) {
    return {
      ok: false,
      result: {
        ok: false,
        status: 'auth-missing',
        message: 'Для регистрации push нужен действующий токен авторизации.',
      },
    };
  }

  const supported = await isSupported().catch(() => false);
  if (!supported) {
    return {
      ok: false,
      result: {
        ok: false,
        status: 'unsupported',
        message: 'Этот браузер не поддерживает Firebase Messaging для web push.',
      },
    };
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  const serviceWorkerRegistration = await navigator.serviceWorker.ready;

  return {
    ok: true,
    context: {
      config,
      platform,
      serviceWorkerRegistration,
      messaging: getMessaging(app),
    },
  };
}

function describePermission(permission: NotificationPermission): PushSyncResult {
  if (permission === 'granted') {
    return {
      ok: true,
      status: 'enabled',
      message: 'Push-уведомления подключены.',
    };
  }

  if (permission === 'denied') {
    return {
      ok: false,
      status: 'permission-denied',
      message: 'Браузер заблокировал push-уведомления для этого приложения.',
    };
  }

  return {
    ok: false,
    status: 'permission-required',
    message: 'Разрешите уведомления в системном диалоге браузера.',
  };
}

function buildPushDevicePayload(context: MessagingContext, token: string): RegisterPushDeviceRequest {
  return {
    device_id: getOrCreatePushDeviceId(),
    platform: context.platform,
    fcm_token: token,
    app_version: getAppVersion(),
  };
}

export async function syncPushNotifications(options: {
  requestPermission?: boolean;
} = {}): Promise<PushSyncResult> {
  const prepared = await ensureMessagingContext();
  if (!prepared.ok) {
    return prepared.result;
  }

  let permission = Notification.permission;
  if (permission === 'default' && options.requestPermission) {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') {
    return describePermission(permission);
  }

  try {
    const token = await getToken(prepared.context.messaging, {
      vapidKey: prepared.context.config.vapidKey,
      serviceWorkerRegistration: prepared.context.serviceWorkerRegistration,
    });

    if (!token) {
      return {
        ok: false,
        status: 'error',
        message: 'Firebase не вернул FCM token для этого устройства.',
      };
    }

    await api.registerPushDevice(buildPushDevicePayload(prepared.context, token));
    storePushToken(token);

    return {
      ok: true,
      status: 'enabled',
      message: 'Push-уведомления подключены.',
    };
  } catch (error) {
    return {
      ok: false,
      status: 'error',
      message: toApiMessage(error, 'Не удалось подключить push-уведомления.'),
    };
  }
}

export async function disablePushNotifications(): Promise<PushSyncResult> {
  const deviceId =
    typeof window !== 'undefined' ? window.localStorage.getItem(PUSH_DEVICE_ID_STORAGE_KEY)?.trim() : null;

  let backendError: unknown = null;
  if (deviceId && readStoredAuthToken()) {
    try {
      await api.deletePushDevice(deviceId);
    } catch (error) {
      if (!(error instanceof ApiError && (error.status === 401 || error.status === 404))) {
        backendError = error;
      }
    }
  }

  try {
    const prepared = await ensureMessagingContext({ requireAuth: false });
    if (prepared.ok) {
      await deleteToken(prepared.context.messaging);
    }
  } catch (error) {
    if (!backendError) {
      backendError = error;
    }
  } finally {
    clearStoredPushToken();
  }

  if (backendError) {
    return {
      ok: false,
      status: 'error',
      message: toApiMessage(backendError, 'Не удалось полностью отключить push-уведомления.'),
    };
  }

  return {
    ok: true,
    status: 'disabled',
    message: 'Push-уведомления отключены.',
  };
}

export async function detachPushDeviceForLogout(): Promise<void> {
  const deviceId =
    typeof window !== 'undefined' ? window.localStorage.getItem(PUSH_DEVICE_ID_STORAGE_KEY)?.trim() : null;

  if (!deviceId || !readStoredAuthToken()) {
    return;
  }

  try {
    await api.deletePushDevice(deviceId);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
      return;
    }

    throw error;
  }
}

export async function subscribeToForegroundPushMessages(
  handler: (message: ForegroundPushMessage) => void,
): Promise<(() => void) | null> {
  const prepared = await ensureMessagingContext({ requireAuth: false });
  if (!prepared.ok) {
    return null;
  }

  return onMessage(prepared.context.messaging, (payload) => {
    const navigation = extractPushNotificationNavigation(payload) ?? {
      incidentId: null,
      deepLink: null,
      title: null,
      body: null,
    };

    handler({
      ...navigation,
      raw: payload,
    });
  });
}
