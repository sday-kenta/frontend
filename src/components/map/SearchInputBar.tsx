import { memo, type RefObject } from 'react';
import { Loader2, Search, X } from 'lucide-react';

type SearchInputBarProps = {
  inputRef: RefObject<HTMLInputElement | null>;
  query: string;
  loading: boolean;
  onQueryChange: (value: string) => void;
  onFocus: () => void;
  onClear: () => void;
};

export const SearchInputBar = memo(function SearchInputBar({
  inputRef,
  query,
  loading,
  onQueryChange,
  onFocus,
  onClear,
}: SearchInputBarProps) {
  return (
    <div
      className="flex items-center gap-2 rounded-full border border-border/70 bg-muted/35 px-4 py-3"
      data-search-input-shell="true"
    >
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onFocus={onFocus}
        placeholder="Поиск и выбор мест"
        className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground outline-none"
      />
      {query && (
        <button type="button" onClick={onClear} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      )}
      {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
    </div>
  );
});
