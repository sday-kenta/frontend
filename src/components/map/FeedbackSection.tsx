import { type FormEvent, useState } from 'react';
import { MessageSquare } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const fieldLabelClass = 'text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-[#94a3b8]';

const cardClass = cn(
  'rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm',
  'dark:border-white/10 dark:bg-[#1a1a1a]/95'
);

const focusFieldClass =
  'focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-sky-500/45 dark:focus-visible:border-sky-400/40';

const textareaClass = cn(
  'flex min-h-[140px] w-full resize-y rounded-2xl border border-input bg-transparent px-4 py-3 text-base shadow-xs transition-[color,box-shadow] outline-none',
  'placeholder:text-muted-foreground',
  'border-slate-200/80 bg-slate-50/90 text-slate-900 dark:border-white/10 dark:bg-zinc-950/70 dark:text-slate-50',
  focusFieldClass
);

export function FeedbackSection() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: POST /v1/feedback (или аналог), когда бэкенд будет готов — письмо на почту команды
  };

  return (
    <div
      className={cn(
        'auth-panel-shell relative overflow-hidden rounded-[28px] outline-none focus:outline-none',
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
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300">
            <MessageSquare className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white">Напишите нам</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-[#94a3b8]">
              Опишите тему и текст обращения. Когда сервер начнёт принимать заявки, сообщение уйдёт на почту команды
              проекта.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={cn(cardClass, 'space-y-4')}>
          <div className="space-y-1.5">
            <label htmlFor="feedback-subject" className={fieldLabelClass}>
              Тема
            </label>
            <Input
              id="feedback-subject"
              name="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Например: идея по улучшению карты"
              autoComplete="off"
              className={cn(
                'border-slate-200/80 bg-slate-50/90 text-slate-900 dark:border-white/10 dark:bg-zinc-950/70 dark:text-slate-50',
                focusFieldClass
              )}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="feedback-body" className={fieldLabelClass}>
              Сообщение
            </label>
            <textarea
              id="feedback-body"
              name="message"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Расскажите подробнее, что хотите передать команде…"
              rows={6}
              className={textareaClass}
            />
          </div>


          <Button
            type="submit"
            className="w-full rounded-2xl bg-sky-500 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 hover:bg-sky-600 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
          >
            Отправить обращение
          </Button>
        </form>
      </div>
    </div>
  );
}
