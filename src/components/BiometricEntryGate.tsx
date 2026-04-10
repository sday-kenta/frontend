import { Fingerprint, LogOut, ShieldCheck } from 'lucide-react';

type BiometricEntryGateProps = {
  busy: boolean;
  error: string | null;
  label: string;
  onUnlock: () => void;
  onUseAnotherAccount: () => void;
};

export function BiometricEntryGate({
  busy,
  error,
  label,
  onUnlock,
  onUseAnotherAccount,
}: BiometricEntryGateProps) {
  return (
    <div className="fixed inset-0 z-[1700] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.2),transparent_36%),linear-gradient(180deg,#eff6ff_0%,#dbeafe_42%,#f8fafc_100%)] px-5 py-8 text-slate-950 dark:bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.18),transparent_32%),linear-gradient(180deg,#020617_0%,#0f172a_52%,#020617_100%)] dark:text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <span className="absolute -left-10 top-16 h-40 w-40 rounded-full bg-sky-300/30 blur-3xl dark:bg-sky-500/20" />
        <span className="absolute right-[-3rem] top-1/3 h-52 w-52 rounded-full bg-cyan-300/25 blur-3xl dark:bg-cyan-500/20" />
        <span className="absolute bottom-[-3rem] left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-white/40 blur-3xl dark:bg-white/5" />
      </div>

      <div className="relative mx-auto flex min-h-full w-full max-w-md items-center justify-center">
        <div className="w-full overflow-hidden rounded-[32px] border border-white/50 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 dark:shadow-[0_28px_90px_rgba(2,6,23,0.55)]">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-500/25">
              <Fingerprint className="h-8 w-8" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-300">
                Быстрый вход
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">
                Разблокируйте приложение
              </h1>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-600 dark:text-sky-300" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Вход через {label}
                </p>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Приложение попросит системную биометрию устройства и откроет сохранённую сессию на этом устройстве.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          )}

          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={onUnlock}
              disabled={busy}
              className="flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            >
              {busy ? 'Проверяем биометрию...' : `Войти через ${label}`}
            </button>

            <button
              type="button"
              onClick={onUseAnotherAccount}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white/70 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
              Войти в другой аккаунт
            </button>
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Если биометрия не сработала или была отключена на устройстве, можно сбросить локальную сессию и войти обычным логином и паролем.
          </p>
        </div>
      </div>
    </div>
  );
}
