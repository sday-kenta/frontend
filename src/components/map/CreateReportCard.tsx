import { ChevronRight, Plus } from 'lucide-react';

type CreateReportCardProps = {
  onCreate: () => void;
};

export function CreateReportCard({ onCreate }: CreateReportCardProps) {
  return (
    <button
      type="button"
      onClick={onCreate}
      className="group w-full rounded-[12px] border border-border/70 bg-background/80 px-4 py-3 text-left text-foreground shadow-sm backdrop-blur-sm transition-all hover:bg-muted/40 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Plus className="h-3.5 w-3.5" />
            </span>
            Создать обращение
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Быстро отправить проблему по текущей точке</p>
        </div>
        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
    </button>
  );
}