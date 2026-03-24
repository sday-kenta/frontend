import { X } from 'lucide-react';

type MyTabContentProps = {
  closeSheet: () => void;
};

export function MyTabContent({ closeSheet }: MyTabContentProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Мои обращения</h2>
        <button
          type="button"
          onClick={closeSheet}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 shadow-sm border border-slate-300 hover:bg-slate-300 hover:text-slate-800 dark:bg-black/40 dark:text-[#9ca3af] dark:border-transparent dark:hover:bg-black/60"
          aria-label="Закрыть"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="text-sm text-slate-600 dark:text-[#94a3b8]">Заглушка страницы. Тут будет список ваших обращений и фильтры.</p>
      <div className="mt-2 rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#020617] p-4">
        <p className="text-sm text-slate-600 dark:text-[#94a3b8]">Пока нет данных. Добавим список обращений позже.</p>
      </div>
    </div>
  );
}
