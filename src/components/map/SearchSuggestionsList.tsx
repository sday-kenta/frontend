import type { RefObject } from 'react';
import { ChevronRight, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

type SearchSuggestion = {
  lat: number;
  lng: number;
  display_name: string;
  place_id?: number;
};

type SearchSuggestionsListProps = {
  suggestionsRef: RefObject<HTMLDivElement | null>;
  suggestions: SearchSuggestion[];
  maxHeightPx: number;
  onSelectSuggestion: (suggestion: SearchSuggestion) => void;
};

export function SearchSuggestionsList({
  suggestionsRef,
  suggestions,
  maxHeightPx,
  onSelectSuggestion,
}: SearchSuggestionsListProps) {
  return (
    <div
      ref={suggestionsRef}
      data-search-scrollable="true"
      className={cn(
        'mt-2 shrink-0 overflow-hidden overflow-y-auto rounded-3xl border border-border/70 bg-background'
      )}
      style={{ maxHeight: `${Math.max(96, Math.round(maxHeightPx))}px` }}
    >
      {suggestions.map((suggestion, idx) => (
        <button
          key={suggestion.place_id ?? idx}
          type="button"
          onClick={() => onSelectSuggestion(suggestion)}
          className="flex w-full items-start gap-3 px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-muted/45"
        >
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="line-clamp-2">{suggestion.display_name}</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}
