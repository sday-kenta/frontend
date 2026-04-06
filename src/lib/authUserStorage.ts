/** Snapshot of user contact fields for feedback and similar features (optional). */
export const AUTH_USER_STORAGE_KEY = 'auth:user';

export type AuthUserContactSnapshot = {
  email?: string;
  first_name?: string;
  last_name?: string;
};

export function persistAuthUserContact(snapshot: AuthUserContactSnapshot | null) {
  if (typeof window === 'undefined') return;
  if (!snapshot) {
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(
    AUTH_USER_STORAGE_KEY,
    JSON.stringify({
      email: snapshot.email?.trim() ?? '',
      first_name: snapshot.first_name?.trim() ?? '',
      last_name: snapshot.last_name?.trim() ?? '',
    }),
  );
}

export function readAuthUserContactFromStorage(): { email?: string; name?: string } {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (!raw) return {};
    const u = JSON.parse(raw) as AuthUserContactSnapshot;
    const name = [u.last_name, u.first_name].filter(Boolean).join(' ').trim();
    return {
      email: u.email?.trim() || undefined,
      name: name || undefined,
    };
  } catch {
    return {};
  }
}
