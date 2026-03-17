import { useEffect, useMemo, useState } from 'react';
import { isStandalonePwa } from './isStandalone';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
}

export default function PwaOnlyGate(props: { children: React.ReactNode }) {
  const [standalone, setStandalone] = useState(() => isStandalonePwa());
  const [bipEvent, setBipEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const update = () => setStandalone(isStandalonePwa());

    const onBip = (e: Event) => {
      e.preventDefault();
      setBipEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('appinstalled', update);
    window.addEventListener('resize', update);
    window.addEventListener('beforeinstallprompt', onBip);

    return () => {
      window.removeEventListener('appinstalled', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('beforeinstallprompt', onBip);
    };
  }, []);

  const helpText = useMemo(() => {
    if (isIos()) {
      return 'Откройте меню «Поделиться» → «На экран Домой», затем запускайте приложение с иконки.';
    }
    if (isAndroid()) {
      return 'Откройте меню браузера → «Установить приложение» (или «Добавить на главный экран»), затем запускайте с иконки.';
    }
    return 'Установите приложение и запускайте его как отдельное окно (standalone).';
  }, []);

  if (standalone) return <>{props.children}</>;

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white px-5 py-10">
      <div className="mx-auto w-full max-w-md space-y-5">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h1 className="text-lg font-semibold">Это приложение работает только как PWA</h1>
          <p className="mt-2 text-sm text-[#94a3b8]">{helpText}</p>

          {bipEvent && (
            <button
              type="button"
              className="mt-4 w-full rounded-2xl bg-sky-500 px-4 py-3 text-sm font-medium text-white hover:bg-sky-600 transition-colors"
              onClick={async () => {
                try {
                  await bipEvent.prompt();
                  await bipEvent.userChoice.catch(() => null);
                  setBipEvent(null);
                } catch {
                  // ignore
                }
              }}
            >
              Установить
            </button>
          )}
        </div>

        <div className="text-xs text-[#64748b]">
          Если вы уже установили приложение, закройте вкладку и откройте его с иконки на экране.
        </div>
      </div>
    </div>
  );
}

