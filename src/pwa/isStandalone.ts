export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;

  // Standard: Chromium/Android/Desktop when launched as installed app
  const standaloneMql =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches;

  // iOS Safari (when added to Home Screen)
  const iosStandalone = (window.navigator as any)?.standalone === true;

  // Android fallback: sometimes set when launched from an installed app context
  const androidAppReferrer =
    typeof document !== 'undefined' &&
    typeof document.referrer === 'string' &&
    document.referrer.startsWith('android-app://');

  return Boolean(standaloneMql || iosStandalone || androidAppReferrer);
}

