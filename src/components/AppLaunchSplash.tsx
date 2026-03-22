import { cn } from '@/lib/utils';

type AppLaunchSplashProps = {
  isVisible?: boolean;
  fullscreen?: boolean;
};

export function AppLaunchSplash({ isVisible = true, fullscreen = true }: AppLaunchSplashProps) {
  return (
    <div
      className={cn(
        fullscreen ? 'fixed inset-0 z-[1600]' : 'absolute inset-0 z-50',
        'pointer-events-none flex items-center justify-center bg-background transition-opacity duration-500',
        isVisible ? 'opacity-100' : 'opacity-0'
      )}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <span className="app-launch-pulse absolute inset-0 rounded-full bg-primary/35" />
          <span className="app-launch-core h-8 w-8 rounded-full bg-primary" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">Запуск приложения</p>
          <p className="text-xs text-muted-foreground">Подготавливаем карту и интерфейс</p>
        </div>
      </div>
    </div>
  );
}
