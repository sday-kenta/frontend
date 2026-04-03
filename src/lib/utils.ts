import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { withApiBase } from "@/lib/api"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Resolves avatar URL: absolute URLs as-is, relative paths via /v1/avatars/ (proxied to backend). */
export function resolveAvatarUrl(url: string | null | undefined): string | undefined {
  if (!url || typeof url !== "string" || !url.trim()) return undefined;
  const u = url.trim();

  if (u.startsWith('/v1/avatars/')) {
    return withApiBase(u);
  }

  if (u.startsWith('v1/avatars/')) {
    return withApiBase(`/${u}`);
  }

  if (u.startsWith("http://") || u.startsWith("https://")) {
    try {
      const parsed = new URL(u);
      const isInternalHost = ['localhost', '127.0.0.1', 'minio'].includes(parsed.hostname);
      const avatarFileName = parsed.pathname.split('/avatars/')[1];

      if (isInternalHost && avatarFileName) {
        return withApiBase(`/v1/avatars/${avatarFileName.replace(/^\/+/, '')}`);
      }
    } catch {
      return u;
    }

    return u;
  }

  const filename = u.replace(/^\/+/, "");
  return filename ? withApiBase(`/v1/avatars/${filename}`) : undefined;
}

/** Russian label for backend role (`user` / `admin` / `premium`). */
export function formatUserRoleLabel(role: string | null | undefined): string {
  const r = (role || 'user').toLowerCase().trim();
  if (r === 'admin') return 'Админ';
  if (r === 'premium') return 'Премиум';
  return 'Пользователь';
}
