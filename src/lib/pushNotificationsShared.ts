export const PUSH_NOTIFICATION_CLIENT_MESSAGE = 'sday:push-notification-click';
export const PUSH_INCIDENT_QUERY_PARAM = 'pushIncidentId';
export const PUSH_DEEP_LINK_QUERY_PARAM = 'pushDeepLink';

export type PushNotificationNavigation = {
  incidentId: number | null;
  deepLink: string | null;
  title: string | null;
  body: string | null;
};

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === 'object' && value !== null ? (value as UnknownRecord) : null;
}

function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function readIncidentId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

function readIncidentIdFromDeepLink(value: string | null): number | null {
  if (!value) return null;

  const match = value.match(/\/incidents\/(\d+)/i);
  return match ? readIncidentId(match[1]) : null;
}

function unwrapPushPayload(source: unknown): UnknownRecord | null {
  const record = asRecord(source);
  if (!record) return null;

  const fcmMessage = asRecord(record.FCM_MSG);
  if (fcmMessage) {
    return fcmMessage;
  }

  const payload = asRecord(record.payload);
  if (payload) {
    return payload;
  }

  return record;
}

export function extractPushNotificationNavigation(source: unknown): PushNotificationNavigation | null {
  const payload = unwrapPushPayload(source);
  if (!payload) return null;

  const notification = asRecord(payload.notification);
  const data = asRecord(payload.data);
  const fcmOptions = asRecord(payload.fcmOptions);

  const navigation: PushNotificationNavigation = {
    incidentId: null,
    deepLink: readString(data?.deep_link ?? fcmOptions?.link ?? payload.deepLink),
    title: readString(notification?.title ?? payload.title),
    body: readString(notification?.body ?? payload.body),
  };

  navigation.incidentId =
    readIncidentId(data?.incident_id ?? payload.incidentId) ??
    readIncidentIdFromDeepLink(navigation.deepLink);

  if (
    navigation.incidentId == null &&
    navigation.deepLink == null &&
    navigation.title == null &&
    navigation.body == null
  ) {
    return null;
  }

  return navigation;
}

export function buildPushNotificationUrl(
  basePath: string,
  navigation: PushNotificationNavigation,
): string {
  const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
  const url = new URL(normalizedBase, 'https://push.local');

  if (navigation.incidentId != null) {
    url.searchParams.set(PUSH_INCIDENT_QUERY_PARAM, String(navigation.incidentId));
  }

  if (navigation.deepLink) {
    url.searchParams.set(PUSH_DEEP_LINK_QUERY_PARAM, navigation.deepLink);
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

export function readPushNotificationNavigationFromSearch(search: string): PushNotificationNavigation | null {
  const params = new URLSearchParams(search);
  const incidentId = readIncidentId(params.get(PUSH_INCIDENT_QUERY_PARAM));
  const deepLink = readString(params.get(PUSH_DEEP_LINK_QUERY_PARAM));

  if (incidentId == null && deepLink == null) {
    return null;
  }

  return {
    incidentId,
    deepLink,
    title: null,
    body: null,
  };
}

export function isPushNotificationClientMessage(
  value: unknown,
): value is { type: typeof PUSH_NOTIFICATION_CLIENT_MESSAGE; payload: PushNotificationNavigation } {
  const record = asRecord(value);
  if (!record || record.type !== PUSH_NOTIFICATION_CLIENT_MESSAGE) {
    return false;
  }

  return extractPushNotificationNavigation(record.payload) !== null;
}
