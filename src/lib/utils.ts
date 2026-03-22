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
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  const filename = u.replace(/^\/+/, "");
  return filename ? withApiBase(`/v1/avatars/${filename}`) : undefined;
}
