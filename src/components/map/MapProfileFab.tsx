import { memo } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type MapProfileFabProps = {
  isDimmed: boolean;
  avatarSrc: string | null;
  onClick: () => void;
};

export const MapProfileFab = memo(function MapProfileFab({ isDimmed, avatarSrc, onClick }: MapProfileFabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Аккаунт"
      className={cn(
        'absolute top-4 left-4 z-[900] flex h-16 w-16 items-center justify-center rounded-full bg-transparent text-slate-900 focus:outline-none transition-opacity duration-200',
        isDimmed ? 'opacity-50' : 'opacity-100'
      )}
    >
      <span className="inline-flex rounded-full bg-gradient-to-tr from-rose-500 via-fuchsia-500 to-indigo-500 p-[2px] shadow-[0_12px_28px_rgba(15,23,42,0.22)] ring-2 ring-white/70 dark:ring-white/15">
        <Avatar className="h-12 w-12 rounded-full overflow-hidden bg-white dark:bg-slate-100">
          {avatarSrc && <AvatarImage src={avatarSrc} alt="" className="object-cover" />}
          <AvatarFallback className="rounded-full bg-white text-slate-900 dark:bg-slate-100 dark:text-slate-900">
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      </span>
    </button>
  );
});
