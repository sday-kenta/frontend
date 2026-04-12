import { memo, type ReactNode, type TouchEventHandler } from 'react';

type SearchPanelSnap = 'collapsed' | 'full';

type MapSearchPanelProps = {
  viewportHeightPx: number;
  searchPanelDragHeight: number | null;
  searchPanelSnap: SearchPanelSnap;
  isSearchPanelDragging: boolean;
  onTouchStart: TouchEventHandler<HTMLDivElement>;
  onTouchMove: TouchEventHandler<HTMLDivElement>;
  onTouchEnd: TouchEventHandler<HTMLDivElement>;
  children: ReactNode;
};

export const MapSearchPanel = memo(function MapSearchPanel({
  viewportHeightPx,
  searchPanelDragHeight,
  searchPanelSnap,
  isSearchPanelDragging,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  children,
}: MapSearchPanelProps) {
  const stableViewportHeightPx = Math.max(viewportHeightPx, 160);

  return (
    <div className="absolute inset-x-0 bottom-0 z-[900]">
      <div
        className="w-full rounded-t-[40px] rounded-b-none border-t border-border/70 bg-background/95 px-4 pt-2 overflow-hidden"
        style={{
          maxHeight:
            searchPanelDragHeight !== null
              ? `${searchPanelDragHeight}px`
              : searchPanelSnap === 'full'
                ? `${stableViewportHeightPx}px`
                : '160px',
          paddingBottom:
            searchPanelSnap === 'collapsed'
              ? 'max(env(safe-area-inset-bottom),16px)'
              : 'max(env(safe-area-inset-bottom),10px)',
          transition: isSearchPanelDragging ? 'none' : 'max-height 360ms cubic-bezier(0.22, 1, 0.36, 1)',
          touchAction: 'pan-y',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex items-center justify-center py-2" data-search-drag-handle="true">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/35" />
        </div>
        {children}
      </div>
    </div>
  );
});
