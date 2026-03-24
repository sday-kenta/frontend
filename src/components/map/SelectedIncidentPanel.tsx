type SelectedIncident = {
  id: number;
  title: string;
  category: string;
  status: string;
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
};

export function SelectedIncidentPanel({
  incident,
  incidentDetails,
  incidentDistanceLabel,
  getTagIcon,
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
        </div>
      </div>
    </div>
  );
}