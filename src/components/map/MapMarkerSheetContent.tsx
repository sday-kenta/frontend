import { memo } from 'react';
import { ChevronRight, Copy, MapPin } from 'lucide-react';

type MarkerPoint = {
  lat: number;
  lng: number;
  address?: string;
};

type MapMarkerSheetContentProps = {
  marker: MarkerPoint;
  onCopyCoords: () => void;
  onCreateReport: () => void;
};

export const MapMarkerSheetContent = memo(function MapMarkerSheetContent({ marker, onCopyCoords, onCreateReport }: MapMarkerSheetContentProps) {
  return (
    <div className="flex-1 overflow-y-auto overscroll-contain pb-2" data-sheet-scrollable="true">
      <p className="text-[11px] uppercase tracking-wide text-[#64748b] mb-1">Выбранная точка</p>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white line-clamp-3">
        {marker.address ?? 'Адрес уточняется…'}
      </h2>
      <p className="text-xs text-slate-600 dark:text-[#9ca3af] mt-1 flex items-center gap-2">
        {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
        <button
          type="button"
          onClick={onCopyCoords}
          className="text-sky-600 hover:text-sky-500 dark:text-[#3b82f6] dark:hover:text-sky-400"
        >
          <Copy className="h-3 w-3" />
        </button>
      </p>

      <div className="mt-4">
        <button
          type="button"
          onClick={onCreateReport}
          className="w-full flex items-center gap-3 rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-100 text-slate-900 dark:bg-[#0b1120] dark:hover:bg-white/5 dark:border-white/10 px-3 py-3 text-left text-sm dark:text-white transition-colors"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white">
            <MapPin className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Создать обращение</p>
            <p className="text-xs text-[#94a3b8]">Откроется выбор рубрики и оформление доноса</p>
          </div>
          <ChevronRight className="h-4 w-4 text-[#64748b]" />
        </button>
      </div>
    </div>
  );
});
