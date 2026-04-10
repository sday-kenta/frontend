export const AUTH_SESSION_CLEARED_EVENT = 'sday:auth-session-cleared';

export function readStoredUserId(): string | null {
  if (typeof window === 'undefined') return null;

  const rawUserId = window.localStorage.getItem('userId');
  return rawUserId && rawUserId.trim() ? rawUserId.trim() : null;
}

export function hasStoredAuthSession(): boolean {
  if (typeof window === 'undefined') return false;

  return Boolean(readStoredUserId() || window.localStorage.getItem('authToken'));
}

export function clearStoredAuthSession() {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem('userId');
  window.localStorage.removeItem('authToken');
  window.dispatchEvent(new Event(AUTH_SESSION_CLEARED_EVENT));
}
