import { type FormEvent, useState } from 'react';
import { MessageSquare } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError, api } from '@/lib/api';
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

function readAuthContact(): { email?: string; name?: string } {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem('auth:user');
    if (!raw) return {};
    const u = JSON.parse(raw) as {
      email?: string;
      first_name?: string;
      last_name?: string;
    };
    const name = [u.last_name, u.first_name].filter(Boolean).join(' ').trim();
    return { email: u.email?.trim() || undefined, name: name || undefined };
  } catch {
    return {};
  }
}

export function FeedbackSection() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);

    const sub = subject.trim();
    const msgBody = body.trim();
    const message = sub ? `Тема: ${sub}\n\n${msgBody}` : msgBody;

    if (message.length < 10) {
      setNotice({
        type: 'err',
        text: 'Введите тему и сообщение (всего не меньше 10 символов).',
      });
      return;
    }

    const { email, name } = readAuthContact();

    setLoading(true);
    try {
      await api.sendFeedback({
        message,
        ...(email ? { email } : {}),
        ...(name ? { name } : {}),
      });
      setSubject('');
      setBody('');
      setNotice({
        type: 'ok',
        text: 'Сообщение отправлено. Спасибо за обратную связь!',
      });
    } catch (err) {
      const text =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Не удалось отправить. Попробуйте позже.';
      setNotice({ type: 'err', text });
    } finally {
      setLoading(false);
    }
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
              Опишите тему и текст обращения — сообщение будет отправлено на почту команды проекта. Если вы
              авторизованы, к письму подставятся ваши имя и email для ответа.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={cn(cardClass, 'space-y-4')}>
          {notice && (
            <p
              role="status"
              className={cn(
                'rounded-xl px-3 py-2 text-sm',
                notice.type === 'ok'
                  ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                  : 'bg-red-500/10 text-red-800 dark:text-red-200'
              )}
            >
              {notice.text}
            </p>
          )}

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
              disabled={loading}
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
              disabled={loading}
              className={textareaClass}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-sky-500 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 hover:bg-sky-600 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none disabled:opacity-70"
          >
            {loading ? 'Отправка…' : 'Отправить обращение'}
          </Button>
        </form>
      </div>
    </div>
  );
}
