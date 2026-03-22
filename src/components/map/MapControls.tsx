import { memo, type CSSProperties } from 'react';
import { Loader2, Minus, Navigation, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

type MapControlsProps = {
  isHidden: boolean;
  mapControlsLiftPx: number;
  isSearchPanelDragging: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocateMe: () => void;
  locating: boolean;
};

export const MapControls = memo(function MapControls({
  isHidden,
  mapControlsLiftPx,
  isSearchPanelDragging,
  onZoomIn,
  onZoomOut,
  onLocateMe,
  locating,
}: MapControlsProps) {
  const style: CSSProperties = {
    transform: `translateY(-${mapControlsLiftPx}px)`,
    transition: isSearchPanelDragging
      ? 'none'
      : 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease',
  };

  return (
    <div
      className={cn(
        'absolute right-3 bottom-[calc(env(safe-area-inset-bottom)+170px)] z-[950] transition-opacity duration-200 md:top-28 md:bottom-auto',
        isHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'
      )}
      style={style}
    >
      <div className="flex flex-col gap-2 rounded-[24px] bg-white/90 p-0.5 shadow-xl ring-1 ring-slate-200/80 backdrop-blur-md dark:bg-black/55 dark:ring-white/10">
        <button
          type="button"
          onClick={onZoomIn}
          aria-label="Приблизить карту"
          title="Приблизить"
          className="flex h-12 w-12 touch-manipulation items-center justify-center rounded-2xl text-slate-900 transition-all hover:bg-slate-100 active:scale-95 dark:text-white dark:hover:bg-white/10"
        >
          <Plus className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onZoomOut}
          aria-label="Отдалить карту"
          title="Отдалить"
          className="flex h-12 w-12 touch-manipulation items-center justify-center rounded-2xl text-slate-900 transition-all hover:bg-slate-100 active:scale-95 dark:text-white dark:hover:bg-white/10"
        >
          <Minus className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onLocateMe}
          aria-label="Моё местоположение"
          title="Моё местоположение"
          className="flex h-12 w-12 touch-manipulation items-center justify-center rounded-2xl transition-all hover:bg-slate-800 active:scale-95"
        >
          {locating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Navigation className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
});