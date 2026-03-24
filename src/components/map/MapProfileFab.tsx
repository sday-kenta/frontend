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
        'absolute top-4 left-4 z-[900] flex h-14 w-14 items-center justify-center rounded-[22px] bg-white/90 text-slate-900 shadow-lg ring-1 ring-slate-200 dark:bg-black/85 dark:text-white dark:ring-white/10 focus:outline-none overflow-hidden transition-opacity duration-200',
        isDimmed ? 'opacity-50' : 'opacity-100'
      )}
    >
      <span className="inline-flex rounded-full bg-gradient-to-tr from-rose-500 via-fuchsia-500 to-indigo-500 p-[2px]">
        <Avatar className="h-10 w-10 rounded-full overflow-hidden bg-white dark:bg-slate-800">
          {avatarSrc && <AvatarImage src={avatarSrc} alt="" className="object-cover" />}
          <AvatarFallback className="rounded-full bg-white text-slate-900 dark:bg-slate-800 dark:text-white">
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      </span>
    </button>
  );
});