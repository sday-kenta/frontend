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
  profileScrollRef: React.RefObject<HTMLDivElement | null>;
  handleProfileWheel: (event: React.WheelEvent<HTMLDivElement>) => void;
  handleProfileTouchStart: (event: React.TouchEvent<HTMLDivElement>) => void;
  handleProfileTouchMove: (event: React.TouchEvent<HTMLDivElement>) => void;
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
  setSheetMode: (mode: SheetMode) => void;
  getTagIcon: (value: string) => string;
  getProfileIncidentCategoryTagClass: (category: string) => string;
  getProfileIncidentStatusTagClass: (status: string) => string;
  getStatusIcon: (status: string) => string;
  incidentDetails: IncidentDetailsMap;
  nearbyIncidentsById: Map<number, { distanceLabel: string }>;
  setIsAuthenticated: (value: boolean) => void;
  setUserProfile: React.Dispatch<React.SetStateAction<{
    id?: number;
    first_name?: string;
    last_name?: string;
    email?: string;
    avatar_url?: string | null;
  } | null>>;
  isAuthenticated: boolean;
  pushNotificationsEnabled: boolean;
  setPushNotificationsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  emailNotificationsEnabled: boolean;
  setEmailNotificationsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  ProfileTab: ProfileTabComponent;
};

export const MapTabsSheetContent = memo(function MapTabsSheetContent({
  isAuthFullscreen,
  activeTab,
  settingsView,
  closeSheet,
  openTab,
  setSettingsView,
  profileScrollRef,
  handleProfileWheel,
  handleProfileTouchStart,
  handleProfileTouchMove,
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
  setSheetMode,
  getTagIcon,
  getProfileIncidentCategoryTagClass,
  getProfileIncidentStatusTagClass,
  getStatusIcon,
  incidentDetails,
  nearbyIncidentsById,
  setIsAuthenticated,
  setUserProfile,
  isAuthenticated,
  pushNotificationsEnabled,
  setPushNotificationsEnabled,
  emailNotificationsEnabled,
  setEmailNotificationsEnabled,
  ProfileTab,
}: MapTabsSheetContentProps) {
  return (
    <div
      className={cn('flex-1 overflow-y-auto overscroll-contain space-y-4 pb-2', isAuthFullscreen && 'pb-0')}
      data-sheet-scrollable="true"
      ref={activeTab === 'profile' ? profileScrollRef : null}
      onWheel={activeTab === 'profile' ? handleProfileWheel : undefined}
      onTouchStart={activeTab === 'profile' ? handleProfileTouchStart : undefined}
      onTouchMove={activeTab === 'profile' ? handleProfileTouchMove : undefined}
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
          setSheetMode={setSheetMode}
          getTagIcon={getTagIcon}
          getProfileIncidentCategoryTagClass={getProfileIncidentCategoryTagClass}
          getProfileIncidentStatusTagClass={getProfileIncidentStatusTagClass}
          getStatusIcon={getStatusIcon}
          incidentDetails={incidentDetails}
          nearbyIncidentsById={nearbyIncidentsById}
        />
      )}

      {activeTab === 'auth' && (
        <AuthPanel
          onAuthenticated={(payload) => {
            setIsAuthenticated(true);
            setUserProfile(payload);
            openTab('profile');
          }}
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
          setIsAuthenticated={setIsAuthenticated}
          pushNotificationsEnabled={pushNotificationsEnabled}
          setPushNotificationsEnabled={setPushNotificationsEnabled}
          emailNotificationsEnabled={emailNotificationsEnabled}
          setEmailNotificationsEnabled={setEmailNotificationsEnabled}
          ProfileTab={ProfileTab}
        />
      )}
    </div>
  );
});
