import { Camera, Loader2, Settings, User, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, formatUserRoleLabel, resolveAvatarUrl } from '@/lib/utils';
import type { IncidentDetailsMap, IncidentForMapAction, SheetMode, TrustProgress, UserProfile } from '@/components/map/tabs/types';

type ProfileTabContentProps = {
  closeSheet: () => void;
  openTab: (tab: 'settings' | 'my') => void;
  setSettingsView: (view: 'main') => void;
  profileAvatarInputRef: React.RefObject<HTMLInputElement | null>;
  userProfile: UserProfile | null;
  localAvatarPreviewUrl: string | null;
  isAvatarUploading: boolean;
  handleProfileAvatarFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  userTrustProgress: TrustProgress;
  userActiveIncidentsCount: number;
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
  incidentDetails: IncidentDetailsMap;
  nearbyIncidentsById: Map<number, { distanceLabel: string }>;
};

export function ProfileTabContent({
  closeSheet,
  openTab,
  setSettingsView,
  profileAvatarInputRef,
  userProfile,
  localAvatarPreviewUrl,
  isAvatarUploading,
  handleProfileAvatarFileChange,
  userTrustProgress,
  userActiveIncidentsCount,
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
  incidentDetails,
  nearbyIncidentsById,
}: ProfileTabContentProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Профиль</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSettingsView('main');
              openTab('settings');
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 shadow-sm border border-slate-300 hover:bg-slate-300 hover:text-slate-800 dark:bg-black/40 dark:text-[#9ca3af] dark:border-transparent dark:hover:bg-black/60"
            aria-label="Настройки"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={closeSheet}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 shadow-sm border border-slate-300 hover:bg-slate-300 hover:text-slate-800 dark:bg-black/40 dark:text-[#9ca3af] dark:border-transparent dark:hover:bg-black/60"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="rounded-2xl p->">
        <p className="text-xs text-slate-500 dark:text-[#94a3b8]">Роль</p>
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => profileAvatarInputRef.current?.click()}
            className="relative rounded-full focus:outline-none"
            aria-label="Сменить фото профиля"
          >
            <Avatar className="h-11 w-11 rounded-full overflow-hidden bg-white dark:bg-slate-800">
              {(userProfile?.avatar_url || localAvatarPreviewUrl) && (
                <AvatarImage
                  src={localAvatarPreviewUrl ?? resolveAvatarUrl(userProfile?.avatar_url) ?? ''}
                  alt=""
                  className="object-cover"
                />
              )}
              <AvatarFallback className="rounded-full bg-white text-slate-900 dark:bg-slate-800 dark:text-white">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <span className="absolute -right-1 -bottom-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900">
              {isAvatarUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
            </span>
          </button>
          <input
            ref={profileAvatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleProfileAvatarFileChange}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {userProfile
                  ? [userProfile.last_name, userProfile.first_name].filter(Boolean).join(' ') || 'Пользователь'
                  : 'Пользователь'}
              </p>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-white/10 dark:text-slate-200">
                {formatUserRoleLabel(userProfile?.role)}
              </span>
            </div>
            <p className="truncate text-xs text-slate-600 dark:text-[#94a3b8]">{userProfile?.email || 'E-mail не указан'}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl ">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500 dark:text-[#94a3b8]">Прогресс доверия</p>
          <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:border-white/10 dark:text-slate-200">
            {userTrustProgress.level}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-slate-900 dark:bg-white"
            style={{ width: `${userTrustProgress.reputationScore}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-[#94a3b8]">
          <span>Подтверждённые: {userTrustProgress.confirmed}</span>
          <span>Полезные: {userTrustProgress.useful}</span>
          <span>{userTrustProgress.reputationScore}%</span>
        </div>
      </div>

      <div className="rounded-2xl p-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-900 dark:text-white">Ваши активные обращения</p>
          <span className="rounded-full px-2 py-0.5 text-xs font-semibold text-slate-600 dark:text-[#94a3b8]">{userActiveIncidentsCount}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {profileStatusFilters.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setSelectedProfileStatusFilter(status)}
              className={cn(
                'shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                selectedProfileStatusFilter === status
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border/70 bg-muted/25 text-muted-foreground hover:bg-muted/45 hover:text-foreground'
              )}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {profileCategoryFilters.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedProfileCategoryFilter(category)}
              className={cn(
                'shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                selectedProfileCategoryFilter === category
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border/70 bg-muted/25 text-muted-foreground hover:bg-muted/45 hover:text-foreground'
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filteredUserActiveIncidents.map((incident) => (
          <button
            key={incident.id}
            type="button"
            onClick={() => {
              if (incident.status.toLowerCase().includes('чернов')) {
                openDraftForEditing(incident.id);
                return;
              }

              focusIncidentOnMap(incident);
              setSheetMode(null);
            }}
            className="flex w-full items-start gap-2.5 rounded-[12px] border border-border/70 bg-background/65 p-3 text-left transition-colors hover:bg-muted/40"
          >
            <div className="mt-0.5 rounded-full border border-border/70 p-1.5 text-muted-foreground">
              <span className="text-base leading-none">{getTagIcon(incident.category)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-1.5">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                    getProfileIncidentCategoryTagClass(incident.category)
                  )}
                >
                  <span>{getTagIcon(incident.category)}</span>
                  {incident.category}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                    getProfileIncidentStatusTagClass(incident.status)
                  )}
                >
                  <span>{getStatusIcon(incident.status)}</span>
                  {incident.status}
                </span>
              </div>
              <p className="line-clamp-1 text-xs font-medium text-foreground">{incident.title}</p>
              {incident.address ? (
                <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">{incident.address}</p>
              ) : null}
              {incidentDetails[incident.id]?.tags?.length ? (
                <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                  {incidentDetails[incident.id].tags.slice(0, 2).map((tag: string) => (
                    <span key={`${incident.id}-${tag}`}>
                      {getTagIcon(tag)} {tag.replace(/^#/, '')}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
              {nearbyIncidentsById.get(incident.id)?.distanceLabel ?? `#${incident.id}`}
            </span>
          </button>
        ))}
        {filteredUserActiveIncidents.length === 0 && (
          <div className="rounded-2xl border border-border/70 bg-background/65 p-3 text-xs text-muted-foreground">
            По выбранным фильтрам обращений не найдено.
          </div>
        )}
      </div>
    </div>
  );
}
