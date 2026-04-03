import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { AboutProjectSection } from '@/components/map/AboutProjectSection';
import { FeedbackSection } from '@/components/map/FeedbackSection';
import { cn } from '@/lib/utils';
import type { ProfileTabComponent, SettingsView, UserProfile } from '@/components/map/tabs/types';

const settingsSheetIconButtonClass =
  'flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 shadow-sm border border-slate-300 hover:bg-slate-300 hover:text-slate-800 dark:bg-black/40 dark:text-[#9ca3af] dark:border-transparent dark:hover:bg-black/60';

type SettingsSheetHeaderProps = {
  title: string;
  rightSlot: ReactNode;
};

function SettingsSheetHeader({ title, rightSlot }: SettingsSheetHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="min-w-0 truncate text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
      <div className="flex shrink-0 items-center gap-2">{rightSlot}</div>
    </div>
  );
}

type SettingsTabContentProps = {
  settingsView: SettingsView;
  closeSheet: () => void;
  openTab: (tab: 'profile' | 'auth' | 'my') => void;
  setSettingsView: (view: SettingsView) => void;
  userProfile: UserProfile | null;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  pushNotificationsEnabled: boolean;
  setPushNotificationsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  emailNotificationsEnabled: boolean;
  setEmailNotificationsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  ProfileTab: ProfileTabComponent;
};

export function SettingsTabContent({
  settingsView,
  closeSheet,
  openTab,
  setSettingsView,
  userProfile,
  setUserProfile,
  isAuthenticated,
  setIsAuthenticated,
  pushNotificationsEnabled,
  setPushNotificationsEnabled,
  emailNotificationsEnabled,
  setEmailNotificationsEnabled,
  ProfileTab,
}: SettingsTabContentProps) {
  return (
    <div className="space-y-4">
      {settingsView === 'main' && (
        <>
          <SettingsSheetHeader
            title="Настройки"
            rightSlot={
              <>
                <button
                  type="button"
                  onClick={() => openTab('profile')}
                  className={settingsSheetIconButtonClass}
                  aria-label="К профилю"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button type="button" onClick={closeSheet} className={settingsSheetIconButtonClass} aria-label="Закрыть">
                  <X className="h-4 w-4" />
                </button>
              </>
            }
          />

          <div className="rounded-2xl bg-white p-3 dark:bg-transparent">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-900 dark:text-white">Уведомления</p>
            </div>

            <div className="mt-2 divide-y divide-slate-200/80 dark:divide-white/10">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Push</span>
                <button
                  type="button"
                  aria-pressed={pushNotificationsEnabled}
                  onClick={() => setPushNotificationsEnabled((prev) => !prev)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    pushNotificationsEnabled ? 'bg-slate-900 dark:bg-white' : 'bg-slate-300 dark:bg-white/20'
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex h-5 w-5 rounded-full bg-white transition-transform dark:bg-slate-900',
                      pushNotificationsEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                    )}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</span>
                <button
                  type="button"
                  aria-pressed={emailNotificationsEnabled}
                  onClick={() => setEmailNotificationsEnabled((prev) => !prev)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    emailNotificationsEnabled ? 'bg-slate-900 dark:bg-white' : 'bg-slate-300 dark:bg-white/20'
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex h-5 w-5 rounded-full bg-white transition-transform dark:bg-slate-900',
                      emailNotificationsEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                    )}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setSettingsView('profile')}
              className="w-full flex items-center justify-between rounded-2xl bg-white hover:bg-slate-50 text-slate-900 dark:bg-transparent dark:hover:bg-transparent px-4 py-3 text-left text-sm dark:text-white transition-colors"
            >
              <div>
                <p className="font-medium">Данные профиля</p>
                <p className="text-xs text-[#94a3b8]">Изменение личных и контактных данных</p>
              </div>
              <ChevronRight className="h-4 w-4 text-[#64748b]" />
            </button>

            <button
              type="button"
              onClick={() => setSettingsView('about')}
              className="w-full flex items-center justify-between rounded-2xl bg-white hover:bg-slate-50 text-slate-900 dark:bg-transparent dark:hover:bg-transparent px-4 py-3 text-left text-sm dark:text-white transition-colors"
            >
              <div>
                <p className="font-medium">О проекте</p>
                <p className="text-xs text-[#94a3b8]">Краткая информация о задумке и целях</p>
              </div>
              <ChevronRight className="h-4 w-4 text-[#64748b]" />
            </button>

            <button
              type="button"
              onClick={() => setSettingsView('feedback')}
              className="w-full flex items-center justify-between rounded-2xl bg-white hover:bg-slate-50 text-slate-900 dark:bg-transparent dark:hover:bg-transparent px-4 py-3 text-left text-sm dark:text-white transition-colors"
            >
              <div>
                <p className="font-medium">Обратная связь</p>
                <p className="text-xs text-[#94a3b8]">Как связаться с командой проекта</p>
              </div>
              <ChevronRight className="h-4 w-4 text-[#64748b]" />
            </button>

            {isAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  window.localStorage.removeItem('userId');
                  window.localStorage.removeItem('authToken');
                  setIsAuthenticated(false);
                  setUserProfile(null);
                  openTab('auth');
                }}
                className="w-full rounded-2xl bg-white px-4 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:bg-transparent dark:text-red-400 dark:hover:bg-transparent"
              >
                Выйти
              </button>
            )}
          </div>
        </>
      )}

      {settingsView === 'about' && (
        <div className="space-y-3">
          <SettingsSheetHeader
            title="О проекте"
            rightSlot={
              <>
                <button
                  type="button"
                  onClick={() => setSettingsView('main')}
                  className={settingsSheetIconButtonClass}
                  aria-label="Назад к настройкам"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button type="button" onClick={closeSheet} className={settingsSheetIconButtonClass} aria-label="Закрыть">
                  <X className="h-4 w-4" />
                </button>
              </>
            }
          />
          <AboutProjectSection />
        </div>
      )}

      {settingsView === 'profile' && (
        <div className="space-y-3">
          <SettingsSheetHeader
            title="Данные профиля"
            rightSlot={
              <>
                <button
                  type="button"
                  onClick={() => setSettingsView('main')}
                  className={settingsSheetIconButtonClass}
                  aria-label="Назад к настройкам"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button type="button" onClick={closeSheet} className={settingsSheetIconButtonClass} aria-label="Закрыть">
                  <X className="h-4 w-4" />
                </button>
              </>
            }
          />

          {userProfile && userProfile.id ? (
            <ProfileTab
              userId={userProfile.id}
              onOpenMyReports={() => openTab('my')}
              onOpenSettings={() => setSettingsView('main')}
              onAvatarChange={(url) =>
                setUserProfile((prev) =>
                  prev ? { ...prev, avatar_url: url ?? prev.avatar_url ?? null } : { avatar_url: url ?? null },
                )
              }
            />
          ) : (
            <div className="rounded-2xl bg-white p-4 text-sm text-slate-600 dark:bg-transparent dark:text-[#94a3b8]">
              Не удалось загрузить данные профиля.
            </div>
          )}
        </div>
      )}

      {settingsView === 'feedback' && (
        <div className="space-y-3">
          <SettingsSheetHeader
            title="Обратная связь"
            rightSlot={
              <>
                <button
                  type="button"
                  onClick={() => setSettingsView('main')}
                  className={settingsSheetIconButtonClass}
                  aria-label="Назад к настройкам"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button type="button" onClick={closeSheet} className={settingsSheetIconButtonClass} aria-label="Закрыть">
                  <X className="h-4 w-4" />
                </button>
              </>
            }
          />
          <FeedbackSection />
        </div>
      )}
    </div>
  );
}
