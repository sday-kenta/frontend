import { cn } from '@/lib/utils';
import { HeartHandshake, MapPin, ShieldCheck, Sparkles, Users } from 'lucide-react';

const cardClass = cn(
  'rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm',
  'dark:border-white/10 dark:bg-[#1a1a1a]/95'
);

const sectionLabelClass = 'text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-[#94a3b8]';

export function AboutProjectSection() {
  return (
    <div
      className={cn(
        'auth-panel-shell relative overflow-hidden rounded-[28px]',
        'border border-slate-200/60 bg-gradient-to-b from-slate-100/90 via-slate-50/70 to-slate-100/80',
        'dark:border-white/10 dark:from-[#020617]/85 dark:via-[#0b1220]/70 dark:to-[#111827]/80'
      )}
    >
      <div className="auth-bg-layer pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <span className="auth-bg-orb auth-bg-orb-1" />
        <span className="auth-bg-orb auth-bg-orb-2" />
        <span className="auth-bg-orb auth-bg-orb-3" />
      </div>

      <div className="auth-panel-view-enter relative z-10 space-y-4 p-4">
        <div className="text-center">
          <p className="text-2xl font-bold uppercase tracking-wide text-slate-900 dark:text-white">Сдай кента</p>
          <p className="mt-1 text-xs font-medium text-slate-600 dark:text-[#94a3b8]">
            Сервис городских обращений на карте
          </p>
        </div>

        <div className={cardClass}>
          <p className={sectionLabelClass}>Идея</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            Мы помогаем жителям фиксировать нарушения и проблемы рядом с домом — от парковки до благоустройства —
            и отслеживать статус обращений в одном месте. Честные сигналы и прозрачность делают город удобнее для всех.
          </p>
        </div>

        <div className={cardClass}>
          <p className={sectionLabelClass}>Как пользоваться</p>
          <ul className="mt-3 space-y-3 text-sm text-slate-700 dark:text-slate-200">
            <li className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300">
                <MapPin className="h-4 w-4" aria-hidden />
              </span>
              <span>
                <span className="font-medium text-slate-900 dark:text-white">Карта.</span> Найдите точку, опишите
                ситуацию и прикрепите фото — так проще разобраться с обращением.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300">
                <Users className="h-4 w-4" aria-hidden />
              </span>
              <span>
                <span className="font-medium text-slate-900 dark:text-white">Аккаунт.</span> Регистрация и вход
                связывают обращения с вами: можно вернуться к черновикам и видеть свои активные заявки.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300">
                <ShieldCheck className="h-4 w-4" aria-hidden />
              </span>
              <span>
                <span className="font-medium text-slate-900 dark:text-white">Доверие.</span> Подтверждённые и полезные
                обращения повышают ваш уровень — это поощряет аккуратные и честные сигналы.
              </span>
            </li>
          </ul>
        </div>

        <div className={cardClass}>
          <p className={sectionLabelClass}>Ценности</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" aria-hidden />
              Прозрачность
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
              <HeartHandshake className="h-3.5 w-3.5 text-rose-500" aria-hidden />
              Уважение к городу
            </span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-[#94a3b8]">
            Мы развиваем продукт и будем рады обратной связи в разделе «Обратная связь» в настройках.
          </p>
        </div>
      </div>
    </div>
  );
}
