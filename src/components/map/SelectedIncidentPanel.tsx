import { Loader2, MapPin, Send, Trash2 } from 'lucide-react';

type SelectedIncident = {
  id: number;
  userId: number;
  title: string;
  category: string;
  status: string;
  address?: string;
};

type SelectedIncidentDetails = {
  description?: string;
  tags?: string[];
  photoUrls?: string[];
};

type SelectedIncidentPanelProps = {
  incident: SelectedIncident;
  incidentDetails?: SelectedIncidentDetails | null;
  incidentDistanceLabel: string | null;
  getTagIcon: (tag: string) => string;
  canPublishIncident: boolean;
  publishPending: boolean;
  onPublishIncident: () => void;
  canDeleteIncident: boolean;
  deletePending: boolean;
  onDeleteIncident: () => void;
};

export function SelectedIncidentPanel({
  incident,
  incidentDetails,
  incidentDistanceLabel,
  getTagIcon,
  canPublishIncident,
  publishPending,
  onPublishIncident,
  canDeleteIncident,
  deletePending,
  onDeleteIncident,
}: SelectedIncidentPanelProps) {
  return (
    <div className="p-1">
      {incidentDetails?.photoUrls?.length ? (
        <div className="mb-3 flex gap-2 overflow-x-auto" data-search-scrollable="true">
          {incidentDetails.photoUrls.map((photoUrl, index) => (
            <img
              key={`${incident.id}-${photoUrl}`}
              src={photoUrl}
              alt={`${incident.title} ${index + 1}`}
              loading="lazy"
              decoding="async"
              className="h-44 w-[78%] min-w-[78%] rounded-xl object-cover"
            />
          ))}
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="line-clamp-3 text-sm font-semibold text-foreground">{incident.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{incident.category}</span>
            <span>•</span>
            <span>{incident.status}</span>
            {incidentDistanceLabel && (
              <>
                <span>•</span>
                <span>{incidentDistanceLabel}</span>
              </>
            )}
          </div>
          {incident.address ? (
            <div className="mt-3 inline-flex items-center gap-2 rounded-[18px] border border-border/70 bg-muted/30 px-3 py-1.5 text-xs font-medium text-foreground/85">
              <MapPin className="h-3.5 w-3.5 text-sky-500" />
              <span>{incident.address}</span>
            </div>
          ) : null}
          {incidentDetails?.description && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{incidentDetails.description}</p>
          )}
          {incidentDetails?.tags?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {incidentDetails.tags.map((tag) => (
                <span key={tag} className="text-xs text-muted-foreground">
                  {getTagIcon(tag)} {tag.replace(/^#/, '')}
                </span>
              ))}
            </div>
          ) : null}
          {canPublishIncident || canDeleteIncident ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {canPublishIncident ? (
                <button
                type="button"
                onClick={onPublishIncident}
                disabled={publishPending}
                className="inline-flex items-center gap-2 rounded-[20px] border border-emerald-300/35 bg-[linear-gradient(135deg,#22c55e,#2563eb)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(34,197,94,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {publishPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Публикуем...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Опубликовать
                  </>
                )}
                </button>
              ) : null}
              {canDeleteIncident ? (
                <button
                  type="button"
                  onClick={onDeleteIncident}
                  disabled={deletePending}
                  className="inline-flex items-center gap-2 rounded-[20px] border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-200"
                >
                  {deletePending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Удаляем...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Удалить
                    </>
                  )}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
