const rawApiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? '';

const normalizedApiBaseUrl = rawApiBaseUrl.replace(/\/+$/, '');

export function withApiBase(path: string): string {
  if (!path) return path;

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (!normalizedApiBaseUrl) {
    return path;
  }

  return `${normalizedApiBaseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}
