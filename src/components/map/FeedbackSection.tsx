import { type FormEvent, useEffect, useRef, useState } from 'react';
import { MessageSquare } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError, api } from '@/lib/api';
import { readAuthUserContactFromStorage, persistAuthUserContact } from '@/lib/authUserStorage';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/components/map/tabs/types';

const MESSAGE_MAX = 8000;

const fieldLabelClass = 'text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-[#94a3b8]';

const cardClass = cn(
  'rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm',
  'dark:border-white/10 dark:bg-[#1a1a1a]/95',
);

const focusFieldClass =
  'focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-sky-500/45 dark:focus-visible:border-sky-400/40';

const textareaClass = cn(
  'flex min-h-[140px] w-full resize-y rounded-2xl border border-input bg-transparent px-4 py-3 text-base shadow-xs transition-[color,box-shadow] outline-none',
  'placeholder:text-muted-foreground',
  'border-slate-200/80 bg-slate-50/90 text-slate-900 dark:border-white/10 dark:bg-zinc-950/70 dark:text-slate-50',
  focusFieldClass,
);

function translateFeedbackError(raw: string): string {
  const low = raw.toLowerCase();
  if (low.includes('email service is not configured') || low.includes('service unavailable')) {
    return 'Сервис отправки писем временно недоступен. Попробуйте позже.';
  }
  if (low.includes('failed to send feedback') || low.includes('send feedback')) {
    return 'Не удалось отправить письмо. Попробуйте позже.';
  }
  if (low.includes('invalid request body')) {
    return 'Неверный формат запроса. Проверьте поля формы.';
  }
  return raw;
}

export type FeedbackSectionProps = {
  /** Профиль из приложения — подставляем контакты и синхронизируем локальный снимок для других экранов. */
  profileContact?: UserProfile | null;
};

export function FeedbackSection({ profileContact = null }: FeedbackSectionProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactName, setContactName] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    const stored = readAuthUserContactFromStorage();
    const email = profileContact?.email?.trim() || stored.email || '';
    const nameFromProfile = [profileContact?.last_name, profileContact?.first_name]
      .filter(Boolean)
      .join(' ')
      .trim();
    const name = nameFromProfile || stored.name || '';
    setContactEmail(email);
    setContactName(name);

    if (profileContact && (profileContact.email || profileContact.first_name || profileContact.last_name)) {
      persistAuthUserContact({
        email: profileContact.email ?? '',
        first_name: profileContact.first_name ?? '',
        last_name: profileContact.last_name ?? '',
      });
    }
  }, [profileContact]);

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

    if (message.length > MESSAGE_MAX) {
      setNotice({
        type: 'err',
        text: `Сообщение слишком длинное (максимум ${MESSAGE_MAX} символов). Сократите текст.`,
      });
      return;
    }

    const emailTrim = contactEmail.trim();
    const nameTrim = contactName.trim();

    setLoading(true);
    try {
      await api.sendFeedback({
        message,
        ...(emailTrim ? { email: emailTrim } : {}),
        ...(nameTrim ? { name: nameTrim } : {}),
      });
      setSubject('');
      setBody('');
      setNotice({
        type: 'ok',
        text: 'Сообщение отправлено. Спасибо за обратную связь!',
      });
    } catch (err) {
      let text =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Не удалось отправить. Попробуйте позже.';
      text = translateFeedbackError(text);
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
        'dark:border-white/10 dark:from-[#020617]/85 dark:via-[#0b1220]/70 dark:to-[#111827]/80',
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
              Опишите тему и текст обращения — сообщение уходит команде проекта на почту. Контакты для ответа необязательны,
              но если укажете email, вам будет проще ответить.
            </p>
          </div>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className={cn(cardClass, 'space-y-4')}>
          {notice && (
            <p
              role="status"
              className={cn(
                'rounded-xl px-3 py-2 text-sm',
                notice.type === 'ok'
                  ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                  : 'bg-red-500/10 text-red-800 dark:text-red-200',
              )}
            >
              {notice.text}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="feedback-contact-name" className={fieldLabelClass}>
                Как к вам обращаться
              </label>
              <Input
                id="feedback-contact-name"
                name="contactName"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Иван Иванов"
                autoComplete="name"
                disabled={loading}
                className={cn(
                  'border-slate-200/80 bg-slate-50/90 text-slate-900 dark:border-white/10 dark:bg-zinc-950/70 dark:text-slate-50',
                  focusFieldClass,
                )}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="feedback-contact-email" className={fieldLabelClass}>
                Email для ответа
              </label>
              <Input
                id="feedback-contact-email"
                name="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loading}
                className={cn(
                  'border-slate-200/80 bg-slate-50/90 text-slate-900 dark:border-white/10 dark:bg-zinc-950/70 dark:text-slate-50',
                  focusFieldClass,
                )}
              />
            </div>
          </div>

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
                focusFieldClass,
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
            <p className="text-[10px] text-slate-500 dark:text-[#94a3b8]">
              Итоговое письмо (тема + текст) не длиннее {MESSAGE_MAX} символов.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => formRef.current?.requestSubmit()}
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
