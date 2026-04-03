import { MapPinned, Sparkles } from 'lucide-react';

type CreateReportCardProps = {
  onCreate: () => void;
};

export function CreateReportCard({ onCreate }: CreateReportCardProps) {
  return (
    <button
      type="button"
      onClick={onCreate}
      className="group relative w-full overflow-hidden rounded-[24px] border border-slate-200/70 bg-background/95 p-4 text-left text-foreground shadow-[0_10px_28px_rgba(15,23,42,0.08)] transition hover:border-sky-300/50 active:scale-[0.995] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.98))] dark:text-white dark:shadow-[0_18px_38px_rgba(0,0,0,0.34)]"
    >
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-sky-400/10 blur-2xl" />
      <div className="relative flex items-start gap-4">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#38bdf8,#2563eb)] text-white shadow-lg">
          <MapPinned className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-slate-100/70 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/55">
            <Sparkles className="h-3 w-3" />
            через нижнюю панель
          </div>
          <h3 className="text-sm font-semibold">Создать обращение по текущей точке</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-white/45">
            Рубрика, заполнение и превью откроются внутри того же slide-bar, как карточка инцидента.
          </p>
        </div>
      </div>
    </button>
  );
}
