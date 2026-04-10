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
  onLogout: () => void;
  pushNotificationsEnabled: boolean;
  setPushNotificationsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
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

export function SettingsTabContent({
  settingsView,
  closeSheet,
  openTab,
  setSettingsView,
  userProfile,
  setUserProfile,
  isAuthenticated,
  onLogout,
  pushNotificationsEnabled,
  setPushNotificationsEnabled,
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

          <div className="rounded-2xl bg-white p-3 dark:bg-transparent">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">Быстрый вход</p>
                <p className="text-xs leading-5 text-[#64748b] dark:text-[#94a3b8]">
                  Локальная разблокировка приложения через {biometricLabel}. Работает только на этом устройстве и не меняет серверную авторизацию.
                </p>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium',
                  biometricEnabled
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
                )}
              >
                {biometricEnabled ? 'Включено' : 'Выключено'}
              </span>
            </div>

            {biometricError && (
              <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                {biometricError}
              </div>
            )}

            {biometricAvailable ? (
              <button
                type="button"
                onClick={biometricEnabled ? onDisableBiometric : onEnableBiometric}
                disabled={biometricBusy}
                className={cn(
                  'mt-3 w-full rounded-2xl px-4 py-3 text-left text-sm font-medium transition-colors',
                  biometricEnabled
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15'
                    : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100',
                  biometricBusy && 'cursor-not-allowed opacity-60'
                )}
              >
                {biometricBusy
                  ? 'Подключаем системную биометрию...'
                  : biometricEnabled
                    ? 'Отключить быстрый вход'
                    : `Включить вход через ${biometricLabel}`}
              </button>
            ) : (
              <div className="mt-3 rounded-2xl border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
                На этом устройстве системная биометрия для PWA сейчас недоступна.
              </div>
            )}
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
                onClick={onLogout}
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
          <FeedbackSection profileContact={userProfile} />
        </div>
      )}
    </div>
  );
}
