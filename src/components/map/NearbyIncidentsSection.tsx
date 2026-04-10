import { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

type BaseIncident = {
  id: number;
  title: string;
  category: string;
  status: string;
  address?: string;
  distanceLabel: string;
};

type NearbyIncidentsSectionProps<T extends BaseIncident> = {
  incidents: T[];
  onSelectIncident: (incident: T) => void;
  isFullHeight: boolean;
  autoFocusScroll?: boolean;
};

function getIncidentCategoryTagClass(category: string) {
  const normalized = category.toLowerCase();

  if (normalized.includes('дорог')) {
    return 'border-amber-300/60 bg-amber-100/70 text-amber-700 dark:border-amber-400/40 dark:bg-amber-500/20 dark:text-amber-200';
  }
  if (normalized.includes('парков')) {
    return 'border-sky-300/60 bg-sky-100/70 text-sky-700 dark:border-sky-400/40 dark:bg-sky-500/20 dark:text-sky-200';
  }
  if (normalized.includes('жкх') || normalized.includes('благо')) {
    return 'border-emerald-300/60 bg-emerald-100/70 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-200';
  }
  if (normalized.includes('торгов')) {
    return 'border-orange-300/60 bg-orange-100/70 text-orange-700 dark:border-orange-400/40 dark:bg-orange-500/20 dark:text-orange-200';
  }
  if (normalized.includes('эколог')) {
    return 'border-lime-300/60 bg-lime-100/70 text-lime-700 dark:border-lime-400/40 dark:bg-lime-500/20 dark:text-lime-200';
  }

  return 'border-violet-300/60 bg-violet-100/70 text-violet-700 dark:border-violet-400/40 dark:bg-violet-500/20 dark:text-violet-200';
}

function getIncidentStatusTagClass(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes('нов')) {
    return 'border-sky-300/60 bg-sky-100/70 text-sky-700 dark:border-sky-400/40 dark:bg-sky-500/20 dark:text-sky-200';
  }
  if (normalized.includes('работ')) {
    return 'border-orange-300/60 bg-orange-100/70 text-orange-700 dark:border-orange-400/40 dark:bg-orange-500/20 dark:text-orange-200';
  }

  return 'border-violet-300/60 bg-violet-100/70 text-violet-700 dark:border-violet-400/40 dark:bg-violet-500/20 dark:text-violet-200';
}

function getIncidentCategoryIcon(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes('жкх') || normalized.includes('благо')) return '🏠';
  if (normalized.includes('дорог')) return '🛣️';
  if (normalized.includes('парков')) return '🚗';
  if (normalized.includes('торгов')) return '🛒';
  if (normalized.includes('эколог')) return '🌿';
  return '📍';
}

function getIncidentStatusIcon(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes('нов')) return '🆕';
  if (normalized.includes('работ')) return '🛠️';
  if (normalized.includes('провер')) return '🔎';
  return 'ℹ️';
}

export function NearbyIncidentsSection<T extends BaseIncident>({
  incidents,
  onSelectIncident,
  isFullHeight,
  autoFocusScroll = false,
}: NearbyIncidentsSectionProps<T>) {
  const incidentsScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!autoFocusScroll) return;

    const rafId = requestAnimationFrame(() => {
      incidentsScrollRef.current?.focus({ preventScroll: true });
    });

    return () => cancelAnimationFrame(rafId);
  }, [autoFocusScroll]);

  return (
    <div className="rounded-3xl" autoFocus>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Ближайшие инциденты</h3>
        <span className="text-xs text-muted-foreground">Рядом с вами</span>
      </div>
      <div
        ref={incidentsScrollRef}
        data-search-scrollable="true"
        tabIndex={-1}
        className={cn('space-y-2 overflow-y-auto pr-1', isFullHeight ? 'max-h-[46vh]' : 'max-h-56')}
      >
        {incidents.map((incident) => (
          <button
            key={incident.id}
            type="button"
            onClick={() => onSelectIncident(incident)}
            className="flex w-full items-start gap-2.5 rounded-[12px] border border-border/70 bg-background/65 p-3 text-left transition-colors hover:bg-muted/40"
          >
            <div className="mt-0.5 rounded-full border border-border/70 p-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-1.5">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                    getIncidentCategoryTagClass(incident.category)
                  )}
                >
                  <span>{getIncidentCategoryIcon(incident.category)}</span>
                  {incident.category}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                    getIncidentStatusTagClass(incident.status)
                  )}
                >
                  <span>{getIncidentStatusIcon(incident.status)}</span>
                  {incident.status}
                </span>
              </div>
              <p className="line-clamp-1 text-xs font-medium text-foreground">{incident.title}</p>
              {incident.address ? (
                <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">{incident.address}</p>
              ) : null}
            </div>
            <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
              {incident.distanceLabel}
            </span>
          </button>
        ))}
        {incidents.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/70 bg-background/50 px-3 py-4 text-center text-xs text-muted-foreground">
            Для выбранной категории рядом инцидентов не найдено
          </div>
        )}
      </div>
    </div>
  );
}
