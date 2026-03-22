import { X } from 'lucide-react';

type HomeTabContentProps = {
  closeSheet: () => void;
};

export function HomeTabContent({ closeSheet }: HomeTabContentProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Главная</h2>
        <button
          type="button"
          onClick={closeSheet}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 shadow-sm border border-slate-300 hover:bg-slate-300 hover:text-slate-800 dark:bg-black/40 dark:text-[#9ca3af] dark:border-transparent dark:hover:bg-black/60"
          aria-label="Закрыть"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="min-w-[160px] rounded-2xl bg-white border border-slate-200 dark:bg-[#020617] dark:border-white/10 overflow-hidden"
          >
            <div className="h-24 bg-gradient-to-br from-sky-500/40 via-indigo-500/40 to-fuchsia-500/40" />
            <div className="p-3">
              <p className="text-xs text-slate-500 dark:text-[#9ca3af]">Заглушка карточки</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">Здесь будут подборки мест</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl bg-white border border-slate-200 dark:bg-[#020617] dark:border-white/10 p-3"
          >
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white">Место #{i + 1}</p>
              <p className="text-xs text-[#9ca3af] mt-0.5">Здесь будет краткое описание, рейтинг и т.д.</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
