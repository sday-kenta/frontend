import { memo, type ChangeEvent, type ReactNode, type RefObject } from 'react';
import { cn } from '@/lib/utils';
import { NearbyIncidentsSection } from '@/components/map/NearbyIncidentsSection';
import { SelectedIncidentPanel } from '@/components/map/SelectedIncidentPanel';
import { MapRubricSheetContent } from '@/components/map/MapRubricSheetContent';

type SearchPanelSnap = 'collapsed' | 'full';

type IncidentForPanel = {
  id: number;
  userId: number;
  title: string;
  category: string;
  status: string;
  address?: string;
};

type IncidentDetailsForPanel = {
  description?: string;
  tags?: string[];
  photoUrls?: string[];
};

type NearbyIncident = {
  id: number;
  userId: number;
  title: string;
  category: string;
  status: string;
  address?: string;
  distanceLabel: string;
  lat: number;
  lng: number;
};

type MarkerPoint = {
  lat: number;
  lng: number;
  address?: string;
};

type RubricItem = {
  id: number;
  title: string;
  icon: ReactNode;
  color: string;
  description: string;
  path: string;
};

type RubricStep = 'select' | 'create' | 'preview';

type MapSearchExpandedContentProps = {
  renderExpandedSearchContent: boolean;
  expandedSearchContentRef: RefObject<HTMLDivElement | null>;
  searchPanelSnap: SearchPanelSnap;
  isSearchPanelDragging: boolean;
  isSearchPanelSettlingCollapsed: boolean;
  selectedMapIncident: IncidentForPanel | null;
  selectedMapIncidentDetails: IncidentDetailsForPanel | null;
  selectedMapIncidentDistanceLabel: string | null;
  getTagIcon: (tag: string) => string;
  canPublishSelectedIncident: boolean;
  publishSelectedIncidentPending: boolean;
  handlePublishSelectedIncident: () => void;
  canDeleteIncident: (incidentUserId?: number) => boolean;
  deletingIncidentId: number | null;
  handleDeleteIncident: (incident: Pick<NearbyIncident, 'id' | 'title' | 'userId'>) => void;
  filteredNearbyIncidents: NearbyIncident[];
  focusIncidentOnMap: (incident: NearbyIncident) => void;
  reportFlowOpen: boolean;
  marker: MarkerPoint | null;
  selectedRubric: RubricItem | null;
  rubricStep: RubricStep;
  rubrics: RubricItem[];
  setSelectedRubric: (rubric: RubricItem | null) => void;
  setRubricStep: (step: RubricStep) => void;
  reportTitle: string;
  setReportTitle: (value: string) => void;
  reportText: string;
  setReportText: (value: string) => void;
  reportPhotos: File[];
  reportPhotoPreviews: string[];
  handleReportPhotosChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handlePublishReport: () => void;
  handleSaveDraft: () => void;
  handleSaveToFiles: () => void;
  handleSendEmail: () => void;
  handlePrint: () => void;
  reportSubmitting: boolean;
  reportFeedback: string | null;
};

export const MapSearchExpandedContent = memo(function MapSearchExpandedContent({
  renderExpandedSearchContent,
  expandedSearchContentRef,
  searchPanelSnap,
  isSearchPanelDragging,
  isSearchPanelSettlingCollapsed,
  selectedMapIncident,
  selectedMapIncidentDetails,
  selectedMapIncidentDistanceLabel,
  getTagIcon,
  canPublishSelectedIncident,
  publishSelectedIncidentPending,
  handlePublishSelectedIncident,
  canDeleteIncident,
  deletingIncidentId,
  handleDeleteIncident,
  filteredNearbyIncidents,
  focusIncidentOnMap,
  reportFlowOpen,
  marker,
  selectedRubric,
  rubricStep,
  rubrics,
  setSelectedRubric,
  setRubricStep,
  reportTitle,
  setReportTitle,
  reportText,
  setReportText,
  reportPhotos,
  reportPhotoPreviews,
  handleReportPhotosChange,
  handlePublishReport,
  handleSaveDraft,
  handleSaveToFiles,
  handleSendEmail,
  handlePrint,
  reportSubmitting,
  reportFeedback,
}: MapSearchExpandedContentProps) {
  if (!renderExpandedSearchContent) {
    return null;
  }

  return (
    <div
      ref={expandedSearchContentRef}
      className={cn(
        'mt-3 flex min-h-0 flex-1 flex-col space-y-3 overflow-hidden pb-6 transition-all duration-250 ease-out',
        searchPanelSnap === 'collapsed' && !isSearchPanelDragging && !isSearchPanelSettlingCollapsed
          ? 'pointer-events-none translate-y-2 opacity-0'
          : 'translate-y-0 opacity-100'
      )}
    >
      {selectedMapIncident && !reportFlowOpen && (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1" data-search-scrollable="true">
          <SelectedIncidentPanel
            incident={selectedMapIncident}
            incidentDetails={selectedMapIncidentDetails}
            incidentDistanceLabel={selectedMapIncidentDistanceLabel}
            getTagIcon={getTagIcon}
            canPublishIncident={canPublishSelectedIncident}
            publishPending={publishSelectedIncidentPending}
            onPublishIncident={handlePublishSelectedIncident}
            canDeleteIncident={canDeleteIncident(selectedMapIncident.userId)}
            deletePending={deletingIncidentId === selectedMapIncident.id}
            onDeleteIncident={() => handleDeleteIncident(selectedMapIncident)}
          />
        </div>
      )}

      {reportFlowOpen && marker && (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1" data-search-scrollable="true">
          <MapRubricSheetContent
          marker={marker}
          selectedRubric={selectedRubric}
          rubricStep={rubricStep}
          rubrics={rubrics}
          setSelectedRubric={setSelectedRubric}
          setRubricStep={setRubricStep}
          reportTitle={reportTitle}
          setReportTitle={setReportTitle}
          reportText={reportText}
          setReportText={setReportText}
          reportPhotos={reportPhotos}
          reportPhotoPreviews={reportPhotoPreviews}
          handleReportPhotosChange={handleReportPhotosChange}
          handlePublishReport={handlePublishReport}
          handleSaveDraft={handleSaveDraft}
          handleSaveToFiles={handleSaveToFiles}
          handleSendEmail={handleSendEmail}
          handlePrint={handlePrint}
          reportSubmitting={reportSubmitting}
          reportFeedback={reportFeedback}
        />
        </div>
      )}

      {!selectedMapIncident && !reportFlowOpen && (
        <div className="min-h-0">
          <NearbyIncidentsSection
            incidents={filteredNearbyIncidents}
            isFullHeight={searchPanelSnap === 'full'}
            autoFocusScroll={false}
            hideSectionHeader={isSearchPanelSettlingCollapsed}
            onSelectIncident={focusIncidentOnMap}
          />
        </div>
      )}
    </div>
  );
});
