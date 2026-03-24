import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BaseRubric = {
  id: number;
  title: string;
  icon?: ReactNode;
  color?: string;
};

type SearchRubricsSectionProps<T extends BaseRubric> = {
  rubrics: T[];
  onSelectRubric: (rubric: T) => void;
};

export function SearchRubricsSection<T extends BaseRubric>({
  rubrics,
  onSelectRubric,
}: SearchRubricsSectionProps<T>) {
  return (
    <div className="rounded-3xl">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Рубрики</h3>
        <span className="text-xs text-muted-foreground">Быстрый выбор</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {rubrics.map((rubric) => (
          <button
            key={`search-rubric-${rubric.id}`}
            type="button"
            onClick={() => onSelectRubric(rubric)}
            className={cn(
              'rounded-[18px] border border-border/70 bg-background/65 px-3 py-2.5 text-left',
              'transition-colors hover:bg-muted/40'
            )}
          >
            <div className="mb-1 flex items-center gap-2">
              {rubric.icon ? (
                <span
                  className={cn(
                    'inline-flex shrink-0 items-center justify-center rounded-full p-1.5 [&_svg]:h-3.5 [&_svg]:w-3.5',
                    rubric.color
                      ? `border border-transparent bg-linear-to-br text-white shadow-sm ${rubric.color}`
                      : 'border border-border/60 bg-background/80 text-muted-foreground'
                  )}
                >
                  {rubric.icon}
                </span>
              ) : null}
              <p className="line-clamp-1 text-xs font-semibold text-foreground">{rubric.title}</p>
            </div>
            <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">Создать обращение</p>
          </button>
        ))}
      </div>
    </div>
  );
}
