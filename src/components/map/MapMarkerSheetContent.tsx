import { memo } from 'react';
import { Copy, MapPin, Sparkles } from 'lucide-react';

type MarkerPoint = {
  lat: number;
  lng: number;
  address?: string;
};

type MapMarkerSheetContentProps = {
  marker: MarkerPoint;
  onCopyCoords: () => void;
  onCreateReport: () => void;
  onContentWheel: (event: React.WheelEvent<HTMLDivElement>) => void;
  onContentTouchStart: (event: React.TouchEvent<HTMLDivElement>) => void;
  onContentTouchMove: (event: React.TouchEvent<HTMLDivElement>) => void;
};

export const MapMarkerSheetContent = memo(function MapMarkerSheetContent({
  marker,
  onCopyCoords,
  onCreateReport,
  onContentWheel,
  onContentTouchStart,
  onContentTouchMove,
}: MapMarkerSheetContentProps) {
  return (
    <div
      className="flex-1 overflow-y-auto overscroll-contain pb-2 text-white"
      data-sheet-scrollable="true"
      onWheel={onContentWheel}
      onTouchStart={onContentTouchStart}
      onTouchMove={onContentTouchMove}
    >
      <div className="space-y-4">
        <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] shadow-[0_18px_38px_rgba(0,0,0,0.34)]">
          <div className="relative p-5">
            <div className="absolute -right-8 -top-6 h-28 w-28 rounded-full bg-sky-400/10 blur-2xl" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-sky-200/70">Выбранная точка</p>
                <h2 className="line-clamp-3 text-base font-semibold leading-tight text-white">
                  {marker.address ?? 'Адрес уточняется…'}
                </h2>
              </div>
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#38bdf8,#2563eb)] text-white shadow-lg">
                <MapPin className="h-5 w-5" />
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/60">
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1">{marker.lat.toFixed(6)}</span>
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1">{marker.lng.toFixed(6)}</span>
              <button
                type="button"
                onClick={onCopyCoords}
                className="inline-flex items-center gap-1 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-sky-100 transition hover:bg-sky-400/16"
              >
                <Copy className="h-3 w-3" />
                Скопировать
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onCreateReport}
          className="group relative w-full overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.98))] p-4 text-left shadow-[0_18px_38px_rgba(0,0,0,0.34)] backdrop-blur-xl transition hover:border-sky-400/25 active:scale-[0.995]"
        >
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-sky-400/10 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#38bdf8,#2563eb)] text-white shadow-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-white/40">единый slide-bar flow</p>
              <p className="text-sm font-semibold text-white">Продолжить в нижней панели</p>
              <p className="mt-1 text-xs leading-relaxed text-white/45">
                Выбор рубрики, заполнение и превью откроются в том же нижнем интерфейсе, как просмотр инцидента.
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
});
