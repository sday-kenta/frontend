import { memo } from 'react';
import { cn } from '@/lib/utils';

type QuickSearchChipsProps = {
  chips: string[];
  selectedChip: string | null;
  onSelectChip: (value: string) => void;
  getTagIcon: (tag: string) => string;
};

export const QuickSearchChips = memo(function QuickSearchChips({
  chips,
  selectedChip,
  onSelectChip,
  getTagIcon,
}: QuickSearchChipsProps) {
  return (
    <div className="mt-2 flex gap-1.5 overflow-x-auto" data-search-scrollable="true">
      {chips.map((chip) => (
        <button
          key={chip}
          type="button"
          onClick={() => onSelectChip(chip)}
          className={cn(
            'shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
            selectedChip === chip
              ? 'border-foreground bg-foreground text-background'
              : 'border-border/70 bg-muted/25 text-muted-foreground hover:bg-muted/45 hover:text-foreground'
          )}
        >
          <span className="mr-1">{getTagIcon(chip)}</span>
          {chip}
        </button>
      ))}
    </div>
  );
});