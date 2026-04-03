import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { withApiBase } from "@/lib/api"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Keeps backend `avatar_url` as-is except for trimming empty values. */
export function normalizeAvatarPath(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string" || !url.trim()) return null;
  return url.trim();
}

/** Resolves `avatar_url` directly; relative values are expanded against API origin. */
export function resolveAvatarUrl(url: string | null | undefined): string | undefined {
  const normalized = normalizeAvatarPath(url);
  if (!normalized) return undefined;

  if (normalized.startsWith('blob:') || normalized.startsWith('data:')) {
    return normalized;
  }

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }

  return withApiBase(normalized.startsWith('/') ? normalized : `/${normalized}`);
}

/** Russian label for backend role (`user` / `admin` / `premium`). */
export function formatUserRoleLabel(role: string | null | undefined): string {
  const r = (role || 'user').toLowerCase().trim();
  if (r === 'admin') return 'Админ';
  if (r === 'premium') return 'Премиум';
  return 'Пользователь';
}
