import { memo, type ReactNode, type TouchEventHandler } from 'react';

type SearchPanelMode = 'collapsed' | 'keyboard' | 'full';

type MapSearchPanelProps = {
  heightPx: number;
  bottomOffsetPx: number;
  mode: SearchPanelMode;
  isSearchPanelDragging: boolean;
  onTouchStart: TouchEventHandler<HTMLDivElement>;
  onTouchMove: TouchEventHandler<HTMLDivElement>;
  onTouchEnd: TouchEventHandler<HTMLDivElement>;
  children: ReactNode;
};

export const MapSearchPanel = memo(function MapSearchPanel({
  heightPx,
  bottomOffsetPx,
  mode,
  isSearchPanelDragging,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  children,
}: MapSearchPanelProps) {
  const resolvedHeightPx = Math.max(96, Math.round(heightPx));
  const resolvedBottomOffsetPx = Math.max(0, Math.round(bottomOffsetPx));
  const panelPaddingBottom = mode === 'keyboard'
    ? '8px'
    : mode === 'collapsed'
      ? 'max(env(safe-area-inset-bottom),16px)'
      : 'max(env(safe-area-inset-bottom),10px)';

  return (
    <div
      className="absolute inset-x-0 z-[900]"
      style={{
        bottom: `${resolvedBottomOffsetPx}px`,
        transition: isSearchPanelDragging ? 'none' : 'bottom 220ms ease',
      }}
    >
      <div
        className="flex min-h-0 w-full flex-col rounded-t-[40px] rounded-b-none border-t border-border/70 bg-background/95 px-4 pt-2 overflow-hidden"
        style={{
          height: `${resolvedHeightPx}px`,
          paddingBottom: panelPaddingBottom,
          transition: isSearchPanelDragging
            ? 'none'
            : 'height 380ms cubic-bezier(0.2, 0.9, 0.2, 1), padding-bottom 240ms ease',
          touchAction: 'pan-y',
          willChange: isSearchPanelDragging ? 'auto' : 'height',
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
