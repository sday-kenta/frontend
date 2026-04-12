import { memo } from 'react';
import { cn } from '@/lib/utils';
import { AuthPanel } from '@/components/map/AuthPanel';
import { HomeTabContent } from '@/components/map/tabs/HomeTabContent';
import { MyTabContent } from '@/components/map/tabs/MyTabContent';
import { AllTabContent } from '@/components/map/tabs/AllTabContent';
import { ProfileTabContent } from '@/components/map/tabs/ProfileTabContent';
import { SettingsTabContent } from '@/components/map/tabs/SettingsTabContent';
import type {
  IncidentForMapAction,
  IncidentDetailsMap,
  ProfileTabComponent,
  SettingsView,
  SheetMode,
  Tab,
  TrustProgress,
  UserProfile,
} from '@/components/map/tabs/types';

type MapTabsSheetContentProps = {
  isAuthFullscreen: boolean;
  activeTab: Tab;
  settingsView: SettingsView;
  closeSheet: () => void;
  openTab: (tab: Tab) => void;
  setSettingsView: (view: SettingsView) => void;
  handleSheetContentWheel: (event: React.WheelEvent<HTMLDivElement>) => void;
  handleSheetContentTouchStart: (event: React.TouchEvent<HTMLDivElement>) => void;
  handleSheetContentTouchMove: (event: React.TouchEvent<HTMLDivElement>) => void;
  profileAvatarInputRef: React.RefObject<HTMLInputElement | null>;
  userProfile: UserProfile | null;
  localAvatarPreviewUrl: string | null;
  isAvatarUploading: boolean;
  handleProfileAvatarFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  userTrustProgress: TrustProgress;
  userActiveIncidents: IncidentForMapAction[];
  profileStatusFilters: string[];
  selectedProfileStatusFilter: string;
  setSelectedProfileStatusFilter: (value: string) => void;
  profileCategoryFilters: string[];
  selectedProfileCategoryFilter: string;
  setSelectedProfileCategoryFilter: (value: string) => void;
  filteredUserActiveIncidents: IncidentForMapAction[];
  focusIncidentOnMap: (incident: IncidentForMapAction) => void;
  openDraftForEditing: (incidentId: number) => void;
  setSheetMode: (mode: SheetMode) => void;
  getTagIcon: (value: string) => string;
  getProfileIncidentCategoryTagClass: (category: string) => string;
  getProfileIncidentStatusTagClass: (status: string) => string;
  getStatusIcon: (status: string) => string;
  canDeleteIncident: (incidentUserId?: number) => boolean;
  deletingIncidentId: number | null;
  handleDeleteIncident: (incident: Pick<IncidentForMapAction, 'id' | 'title' | 'userId'>) => void;
  incidentDetails: IncidentDetailsMap;
  nearbyIncidentsById: Map<number, { distanceLabel: string }>;
  onAuthenticated: (payload: UserProfile | null) => void;
  onLogout: () => void;
  setUserProfile: React.Dispatch<React.SetStateAction<{
    id?: number;
    first_name?: string;
    last_name?: string;
    email?: string;
    avatar_url?: string | null;
    role?: string;
  } | null>>;
  isAuthenticated: boolean;
  pushNotificationsEnabled: boolean;
  pushNotificationsBusy: boolean;
  pushNotificationsStatusMessage: string | null;
  onTogglePushNotifications: () => void;
  emailNotificationsEnabled: boolean;
  setEmailNotificationsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  biometricEnabled: boolean;
  biometricAvailable: boolean;
  biometricBusy: boolean;
  biometricLabel: string;
  biometricError: string | null;
  onEnableBiometric: () => void;
  onDisableBiometric: () => void;
  ProfileTab: ProfileTabComponent;
};

export const MapTabsSheetContent = memo(function MapTabsSheetContent({
  isAuthFullscreen,
  activeTab,
  settingsView,
  closeSheet,
  openTab,
  setSettingsView,
  handleSheetContentWheel,
  handleSheetContentTouchStart,
  handleSheetContentTouchMove,
  profileAvatarInputRef,
  userProfile,
  localAvatarPreviewUrl,
  isAvatarUploading,
  handleProfileAvatarFileChange,
  userTrustProgress,
  userActiveIncidents,
  profileStatusFilters,
  selectedProfileStatusFilter,
  setSelectedProfileStatusFilter,
  profileCategoryFilters,
  selectedProfileCategoryFilter,
  setSelectedProfileCategoryFilter,
  filteredUserActiveIncidents,
  focusIncidentOnMap,
  openDraftForEditing,
  setSheetMode,
  getTagIcon,
  getProfileIncidentCategoryTagClass,
  getProfileIncidentStatusTagClass,
  getStatusIcon,
  canDeleteIncident,
  deletingIncidentId,
  handleDeleteIncident,
  incidentDetails,
  nearbyIncidentsById,
  onAuthenticated,
  onLogout,
  setUserProfile,
  isAuthenticated,
  pushNotificationsEnabled,
  pushNotificationsBusy,
  pushNotificationsStatusMessage,
  onTogglePushNotifications,
  emailNotificationsEnabled,
  setEmailNotificationsEnabled,
  biometricEnabled,
  biometricAvailable,
  biometricBusy,
  biometricLabel,
  biometricError,
  onEnableBiometric,
  onDisableBiometric,
  ProfileTab,
}: MapTabsSheetContentProps) {
  const sheetScrollManaged = activeTab !== 'auth';

  return (
    <div
      className={cn('flex-1 overflow-y-auto overscroll-contain space-y-4 pb-2', isAuthFullscreen && 'pb-0')}
      data-sheet-scrollable="true"
      onWheel={sheetScrollManaged ? handleSheetContentWheel : undefined}
      onTouchStart={sheetScrollManaged ? handleSheetContentTouchStart : undefined}
      onTouchMove={sheetScrollManaged ? handleSheetContentTouchMove : undefined}
    >
      {activeTab === 'home' && <HomeTabContent closeSheet={closeSheet} />}

      {activeTab === 'my' && <MyTabContent closeSheet={closeSheet} />}

      {activeTab === 'all' && <AllTabContent closeSheet={closeSheet} />}

      {activeTab === 'profile' && (
        <ProfileTabContent
          closeSheet={closeSheet}
          openTab={openTab}
          setSettingsView={setSettingsView}
          profileAvatarInputRef={profileAvatarInputRef}
          userProfile={userProfile}
          localAvatarPreviewUrl={localAvatarPreviewUrl}
          isAvatarUploading={isAvatarUploading}
          handleProfileAvatarFileChange={handleProfileAvatarFileChange}
          userTrustProgress={userTrustProgress}
          userActiveIncidentsCount={userActiveIncidents.length}
          profileStatusFilters={profileStatusFilters}
          selectedProfileStatusFilter={selectedProfileStatusFilter}
          setSelectedProfileStatusFilter={setSelectedProfileStatusFilter}
          profileCategoryFilters={profileCategoryFilters}
          selectedProfileCategoryFilter={selectedProfileCategoryFilter}
          setSelectedProfileCategoryFilter={setSelectedProfileCategoryFilter}
          filteredUserActiveIncidents={filteredUserActiveIncidents}
          focusIncidentOnMap={focusIncidentOnMap}
          openDraftForEditing={openDraftForEditing}
          setSheetMode={setSheetMode}
          getTagIcon={getTagIcon}
          getProfileIncidentCategoryTagClass={getProfileIncidentCategoryTagClass}
          getProfileIncidentStatusTagClass={getProfileIncidentStatusTagClass}
          getStatusIcon={getStatusIcon}
          canDeleteIncident={canDeleteIncident}
          deletingIncidentId={deletingIncidentId}
          handleDeleteIncident={handleDeleteIncident}
          incidentDetails={incidentDetails}
          nearbyIncidentsById={nearbyIncidentsById}
        />
      )}

      {activeTab === 'auth' && (
        <AuthPanel
          onAuthenticated={onAuthenticated}
          closeSheet={closeSheet}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsTabContent
          settingsView={settingsView}
          closeSheet={closeSheet}
          openTab={openTab}
          setSettingsView={setSettingsView}
          userProfile={userProfile}
          setUserProfile={setUserProfile}
          isAuthenticated={isAuthenticated}
          onLogout={onLogout}
          pushNotificationsEnabled={pushNotificationsEnabled}
          pushNotificationsBusy={pushNotificationsBusy}
          pushNotificationsStatusMessage={pushNotificationsStatusMessage}
          onTogglePushNotifications={onTogglePushNotifications}
          emailNotificationsEnabled={emailNotificationsEnabled}
          setEmailNotificationsEnabled={setEmailNotificationsEnabled}
          biometricEnabled={biometricEnabled}
          biometricAvailable={biometricAvailable}
          biometricBusy={biometricBusy}
          biometricLabel={biometricLabel}
          biometricError={biometricError}
          onEnableBiometric={onEnableBiometric}
          onDisableBiometric={onDisableBiometric}
          ProfileTab={ProfileTab}
        />
      )}
    </div>
  );
});
