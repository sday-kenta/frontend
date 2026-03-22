import { memo, type RefObject } from 'react';
import { cn } from '@/lib/utils';
import { NearbyIncidentsSection } from '@/components/map/NearbyIncidentsSection';
import { SelectedIncidentPanel } from '@/components/map/SelectedIncidentPanel';
import { CreateReportCard } from '@/components/map/CreateReportCard';

type SearchPanelSnap = 'collapsed' | 'half' | 'full';

type IncidentForPanel = {
  id: number;
  title: string;
  category: string;
  status: string;
};

type IncidentDetailsForPanel = {
  description?: string;
  tags?: string[];
  photoUrls?: string[];
};

type NearbyIncident = {
  id: number;
  title: string;
  category: string;
  status: string;
  distanceLabel: string;
  lat: number;
  lng: number;
};

type MapSearchExpandedContentProps = {
  renderExpandedSearchContent: boolean;
  expandedSearchContentRef: RefObject<HTMLDivElement | null>;
  searchPanelSnap: SearchPanelSnap;
  isSearchPanelDragging: boolean;
  selectedMapIncident: IncidentForPanel | null;
  selectedMapIncidentDetails: IncidentDetailsForPanel | null;
  selectedMapIncidentDistanceLabel: string | null;
  getTagIcon: (tag: string) => string;
  openCreateReportFromSearch: () => void;
  filteredNearbyIncidents: NearbyIncident[];
  focusIncidentOnMap: (incident: NearbyIncident) => void;
};

export const MapSearchExpandedContent = memo(function MapSearchExpandedContent({
  renderExpandedSearchContent,
  expandedSearchContentRef,
  searchPanelSnap,
  isSearchPanelDragging,
  selectedMapIncident,
  selectedMapIncidentDetails,
  selectedMapIncidentDistanceLabel,
  getTagIcon,
  openCreateReportFromSearch,
  filteredNearbyIncidents,
  focusIncidentOnMap,
}: MapSearchExpandedContentProps) {
  if (!renderExpandedSearchContent) {
    return null;
  }

  return (
    <div
      ref={expandedSearchContentRef}
      className={cn(
        'mt-3 space-y-3 overflow-y-auto pb-2 transition-all duration-250 ease-out',
        searchPanelSnap === 'collapsed' && !isSearchPanelDragging
          ? 'pointer-events-none translate-y-2 opacity-0'
          : 'translate-y-0 opacity-100'
      )}
      data-search-scrollable="true"
    >
      {selectedMapIncident && (
        <SelectedIncidentPanel
          incident={selectedMapIncident}
          incidentDetails={selectedMapIncidentDetails}
          incidentDistanceLabel={selectedMapIncidentDistanceLabel}
          getTagIcon={getTagIcon}
        />
      )}

      {!selectedMapIncident && (
        <>
          <CreateReportCard onCreate={openCreateReportFromSearch} />

          <div>
            <NearbyIncidentsSection
              incidents={filteredNearbyIncidents}
              isFullHeight={searchPanelSnap === 'full'}
              autoFocusScroll={false}
              onSelectIncident={focusIncidentOnMap}
            />
          </div>
        </>
      )}
    </div>
  );
});