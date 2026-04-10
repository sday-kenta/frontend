import { useRef, useState } from 'react';
import { cn, normalizeAvatarPath } from '@/lib/utils';
import { withApiBase } from '@/lib/api';
import { persistAuthUserContact } from '@/lib/authUserStorage';

export type AuthResponseUser = {
  id?: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string | null;
  role?: string;
};

type AuthLoginPayload = {
  user?: AuthResponseUser | null;
  access_token?: string;
  token?: string;
  auth_token?: string;
  jwt?: string;
  accessToken?: string;
};

type AuthPanelProps = {
  onAuthenticated: (user: AuthResponseUser | null) => void;
  closeSheet: () => void;
};

export function AuthPanel({ onAuthenticated, closeSheet }: AuthPanelProps) {
  const translateAuthError = (raw: unknown, fallback: string) => {
    const msg =
      (typeof raw === 'string' && raw) ||
      ((raw as { error?: string })?.error ??
        (raw as { message?: string })?.message ??
        (raw as { detail?: string })?.detail ??
        '');

    if (!msg) return fallback;

    const low = msg.toLowerCase();

    if (low.includes('invalid credentials') || low.includes('wrong password')) {
      return 'Неверный логин или пароль.';
    }
    if (low.includes('user is blocked') || low.includes('user blocked')) {
      return 'Пользователь заблокирован. Обратитесь в поддержку.';
    }
    if (low.includes('user not found')) {
      return 'Пользователь не найден.';
    }
    if (low.includes('invalid code')) {
      return 'Неверный код.';
    }
    if (low.includes('code expired')) {
      return 'Код просрочен. Запросите новый.';
    }

    if (low.includes('email already exists') || low.includes('email already exist')) {
      return 'Пользователь с такой почтой уже зарегистрирован.';
    }
    if (low.includes('phone already exists') || low.includes('phone already exist')) {
      return 'Пользователь с таким телефоном уже зарегистрирован.';
    }

    return msg || fallback;
  };
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [login, setLogin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [house, setHouse] = useState('');
  const [apartment, setApartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'sending' | 'sent' | 'resetting'>('idle');
  const [forgotStep, setForgotStep] = useState<'email' | 'reset'>('email');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotNewPassword2, setForgotNewPassword2] = useState('');

  const [confirmEmailOpen, setConfirmEmailOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [confirmEmailCode, setConfirmEmailCode] = useState('');
  const [confirmEmailStatus, setConfirmEmailStatus] =
    useState<'idle' | 'sending' | 'verifying'>('idle');
  const authTouchStartYRef = useRef<number | null>(null);
  const authCanCloseBySwipeRef = useRef(false);

  const API_PREFIX = withApiBase('/v1');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await fetch(`${API_PREFIX}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: identifier.trim(),
            password,
          }),
        });

        if (!res.ok) {
          const json = await res.json().catch(() => null);
          const raw =
            (json && (json as { error?: string; message?: string; detail?: string }).error) ||
            (json && (json as { error?: string; message?: string; detail?: string }).message) ||
            (json && (json as { error?: string; message?: string; detail?: string }).detail) ||
            null;
          const msg = translateAuthError(
            raw,
            'Не удалось выполнить вход. Проверьте данные и попробуйте ещё раз.'
          );
          throw new Error(msg);
        }

        const payload = (await res.json().catch(() => null)) as
          | AuthLoginPayload
          | AuthResponseUser
          | { data?: AuthLoginPayload | AuthResponseUser | null }
          | null;
        const data = payload && typeof payload === 'object' && 'data' in payload
          ? payload.data
          : payload;
        const loginData = data as AuthLoginPayload | AuthResponseUser | null;
        const user =
          loginData && typeof loginData === 'object' && 'user' in loginData
            ? (loginData.user as AuthResponseUser | null)
            : (loginData as AuthResponseUser | null);
        if (!user?.id) {
          throw new Error('Не удалось получить пользователя после входа.');
        }
        const loginEnvelope = (loginData ?? {}) as Partial<AuthLoginPayload>;
        const token =
          loginData && typeof loginData === 'object'
            ? loginEnvelope.access_token ||
              loginEnvelope.token ||
              loginEnvelope.auth_token ||
              loginEnvelope.jwt ||
              loginEnvelope.accessToken
            : undefined;

        const roleResolved =
          typeof user.role === 'string' && user.role.trim() !== '' ? user.role.trim() : 'user';
        const normalizedUser = {
          ...user,
          role: roleResolved,
          avatar_url: normalizeAvatarPath(user.avatar_url),
        };

        if (typeof window !== 'undefined') {
          window.localStorage.setItem('userId', String(user.id));
          if (typeof token === 'string' && token.trim()) {
            window.localStorage.setItem('authToken', token.trim());
          }
          persistAuthUserContact({
            email: normalizedUser.email,
            first_name: normalizedUser.first_name,
            last_name: normalizedUser.last_name,
          });
        }

        onAuthenticated(normalizedUser as AuthResponseUser | null);
        closeSheet();
      } else {
        const res = await fetch(`${API_PREFIX}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            login,
            email,
            password,
            last_name: lastName,
            first_name: firstName,
            middle_name: middleName || undefined,
            phone,
            city,
            street,
            house,
            apartment: apartment || undefined,
            is_blocked: false,
            role: 'user',
          }),
        });

        if (!res.ok) {
          const json = await res.json().catch(() => null);
          const raw =
            (json && (json as { error?: string; message?: string; detail?: string }).error) ||
            (json && (json as { error?: string; message?: string; detail?: string }).message) ||
            (json && (json as { error?: string; message?: string; detail?: string }).detail) ||
            null;
          const msg = translateAuthError(
            raw,
            'Не удалось выполнить запрос. Проверьте данные и попробуйте ещё раз.'
          );
          throw new Error(msg);
        }

        const created = (await res.json().catch(() => null)) as AuthResponseUser | null;
        const targetEmail = created?.email || email;

        if (targetEmail) {
          setConfirmEmail(targetEmail);
          setConfirmEmailOpen(true);
          setConfirmEmailCode('');
          setConfirmEmailStatus('sending');

          void fetch(`${API_PREFIX}/users/email-code/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: targetEmail, purpose: 'register' }),
          })
            .then(async (sendRes) => {
              if (!sendRes.ok) {
                const json = await sendRes.json().catch(() => null);
                const raw =
                  (json &&
                    (json as { error?: string; message?: string; detail?: string }).error) ||
                  (json &&
                    (json as { error?: string; message?: string; detail?: string }).message) ||
                  (json &&
                    (json as { error?: string; message?: string; detail?: string }).detail) ||
                  null;
                const msg = translateAuthError(
                  raw,
                  'Не удалось отправить код для подтверждения почты.'
                );
                setError(msg);
                setConfirmEmailStatus('idle');
                setConfirmEmailOpen(false);
                return;
              }
              setConfirmEmailStatus('idle');
              setSuccess('Мы отправили код на вашу почту. Введите его для подтверждения аккаунта.');
            })
            .catch(() => {
              setConfirmEmailStatus('idle');
              setError('Не удалось отправить код для подтверждения почты.');
              setConfirmEmailOpen(false);
            });
        } else {
          setSuccess('Аккаунт создан. Теперь войдите под своими данными.');
          setMode('login');
          if (created?.email) setIdentifier(created.email);
        }
      }
    } catch (err) {
      const fallback = 'Ошибка запроса. Попробуйте ещё раз.';
      const msg =
        err instanceof Error
          ? translateAuthError(err.message, fallback)
          : translateAuthError(null, fallback);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetCode = async () => {
    const target = forgotEmail.trim();
    if (!target) {
      setError('Введите почту.');
      return;
    }

    setError(null);
    setSuccess(null);
    setForgotStatus('sending');
    try {
      const res = await fetch(`${API_PREFIX}/users/password-reset/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: target }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        const raw =
          (json && (json as { error?: string; message?: string; detail?: string }).error) ||
          (json && (json as { error?: string; message?: string; detail?: string }).message) ||
          (json && (json as { error?: string; message?: string; detail?: string }).detail) ||
          null;
        const msg = translateAuthError(
          raw,
          'Не удалось отправить код. Проверьте почту и попробуйте ещё раз.'
        );
        throw new Error(msg);
      }

      setForgotStatus('sent');
      setSuccess('Код отправлен на почту. Проверьте входящие.');
      setForgotStep('reset');
    } catch (err) {
      setForgotStatus('idle');
      const fallback = 'Ошибка запроса. Попробуйте ещё раз.';
      const msg =
        err instanceof Error
          ? translateAuthError(err.message, fallback)
          : translateAuthError(null, fallback);
      setError(msg);
    }
  };

  const handleResetPassword = async () => {
    const email = forgotEmail.trim();
    const code = forgotCode.trim();
    const p1 = forgotNewPassword;
    const p2 = forgotNewPassword2;

    if (!email) {
      setError('Введите почту.');
      return;
    }
    if (!code) {
      setError('Введите код из письма.');
      return;
    }
    if (!p1 || p1.length < 6) {
      setError('Пароль слишком короткий (минимум 6 символов).');
      return;
    }
    if (p1 !== p2) {
      setError('Пароли не совпадают.');
      return;
    }

    setError(null);
    setSuccess(null);
    setForgotStatus('resetting');
    try {
      const res = await fetch(`${API_PREFIX}/users/password-reset/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, new_password: p1 }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        const raw =
          (json && (json as { error?: string; message?: string; detail?: string }).error) ||
          (json && (json as { error?: string; message?: string; detail?: string }).message) ||
          (json && (json as { error?: string; message?: string; detail?: string }).detail) ||
          null;
        const msg = translateAuthError(
          raw,
          'Не удалось сменить пароль. Проверьте код и попробуйте ещё раз.'
        );
        throw new Error(msg);
      }

      setSuccess('Пароль обновлён. Теперь войдите с новым паролем.');
      setForgotOpen(false);
      setForgotStatus('idle');
      setForgotStep('email');
      setForgotCode('');
      setForgotNewPassword('');
      setForgotNewPassword2('');
      setPassword('');
      setMode('login');
    } catch (err) {
      setForgotStatus('sent');
      const fallback = 'Ошибка запроса. Попробуйте ещё раз.';
      const msg =
        err instanceof Error
          ? translateAuthError(err.message, fallback)
          : translateAuthError(null, fallback);
      setError(msg);
    }
  };

  const handleConfirmEmail = async () => {
    const emailValue = confirmEmail.trim() || email.trim();
    const code = confirmEmailCode.trim();

    if (!emailValue) {
      setError('Не удалось определить почту для подтверждения.');
      return;
    }
    if (!code) {
      setError('Введите код из письма.');
      return;
    }

    setError(null);
    setSuccess(null);
    setConfirmEmailStatus('verifying');

    try {
      const res = await fetch(`${API_PREFIX}/users/email-code/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailValue,
          purpose: 'register',
          code,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        const raw =
          (json && (json as { error?: string; message?: string; detail?: string }).error) ||
          (json && (json as { error?: string; message?: string; detail?: string }).message) ||
          (json && (json as { error?: string; message?: string; detail?: string }).detail) ||
          null;
        const msg = translateAuthError(raw, 'Неверный или просроченный код.');
        throw new Error(msg);
      }

      setConfirmEmailStatus('idle');
      setConfirmEmailOpen(false);
      setSuccess('Почта подтверждена. Теперь войдите под своими данными.');
      setMode('login');
      if (emailValue) {
        setIdentifier(emailValue);
      }
    } catch (err) {
      setConfirmEmailStatus('idle');
      const fallback = 'Не удалось подтвердить почту. Попробуйте ещё раз.';
      const msg =
        err instanceof Error
          ? translateAuthError(err.message, fallback)
          : translateAuthError(null, fallback);
      setError(msg);
    }
  };

  const authInputClass = cn(
    'w-full rounded-2xl bg-transparent px-4 py-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400/30 dark:text-slate-100 dark:placeholder:text-slate-500'
  );
  const authPrimaryButtonClass = cn(
    'mt-1 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-70 bg-sky-500 hover:bg-sky-600 shadow-lg shadow-sky-500/25'
  );
  const authGhostButtonClass = cn(
    'w-full rounded-2xl px-3 py-2.5 text-xs text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
  );
  const isYandexLikeAuth = !forgotOpen && !confirmEmailOpen;
  const authViewKey = confirmEmailOpen
    ? 'confirm-email'
    : forgotOpen
      ? `forgot-${forgotStep}`
      : `auth-${mode}`;

  const handleAuthTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    authTouchStartYRef.current = event.touches[0]?.clientY ?? null;

    const target = event.target as HTMLElement | null;
    const sheetScrollable = target?.closest('[data-sheet-scrollable="true"]') as HTMLElement | null;
    authCanCloseBySwipeRef.current = !sheetScrollable || sheetScrollable.scrollTop <= 0;
  };

  const handleAuthTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const startY = authTouchStartYRef.current;
    if (startY == null) return;

    const currentY = event.touches[0]?.clientY ?? startY;
    const delta = currentY - startY;

    if (delta <= 0 || !authCanCloseBySwipeRef.current) return;

    const target = event.target as HTMLElement | null;
    const sheetScrollable = target?.closest('[data-sheet-scrollable="true"]') as HTMLElement | null;

    if (sheetScrollable && sheetScrollable.scrollTop > 0) {
      authCanCloseBySwipeRef.current = false;
      return;
    }

    if (delta > 8) {
      event.preventDefault();
    }
  };

  const handleAuthTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const startY = authTouchStartYRef.current;
    if (startY == null) return;

    const endY = event.changedTouches[0]?.clientY ?? startY;
    const delta = endY - startY;

    authTouchStartYRef.current = null;

    if (!authCanCloseBySwipeRef.current) {
      authCanCloseBySwipeRef.current = false;
      return;
    }

    authCanCloseBySwipeRef.current = false;

    if (delta > 90) {
      closeSheet();
    }
  };

  return (
    <div
      className={cn(
        'auth-panel-shell relative min-h-full overflow-hidden bg-gradient-to-b from-slate-100/90 via-slate-50/70 to-slate-100/80 px-0 py-3 dark:from-[#020617]/85 dark:via-[#0b1220]/70 dark:to-[#111827]/80',
        isYandexLikeAuth &&
          'flex flex-col justify-start pt-[max(env(safe-area-inset-top),8px)]'
      )}
      onTouchStart={handleAuthTouchStart}
      onTouchMove={handleAuthTouchMove}
      onTouchEnd={handleAuthTouchEnd}
    >
      <div className="auth-bg-layer pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <span className="auth-bg-orb auth-bg-orb-1" />
        <span className="auth-bg-orb auth-bg-orb-2" />
        <span className="auth-bg-orb auth-bg-orb-3" />
      </div>

      <div
        className={cn(
          'relative z-10 mx-auto w-full max-w-md rounded-[28px] p-4 backdrop-blur',
        )}
      >
      <div
        className={cn(
          'mb-1 flex items-center gap-3',
          !confirmEmailOpen && !forgotOpen && mode === 'login'
            ? 'justify-center'
            : 'justify-between'
        )}
      >
        <h2
          className={cn(
            'text-slate-900 dark:text-white',
            !confirmEmailOpen && !forgotOpen && mode === 'login'
              ? 'text-3xl font-bold uppercase tracking-wide text-center'
              : 'text-base font-semibold'
          )}
        >
          {confirmEmailOpen
            ? 'Подтверждение почты'
            : forgotOpen
            ? 'Восстановление пароля'
            : mode === 'login'
            ? 'Сдай кента'
            : 'Регистрация'}
        </h2>
      </div>

      <div
        className={cn(
          !confirmEmailOpen && !forgotOpen && mode === 'login'
            ? 'flex min-h-[calc(100vh-210px)] flex-col justify-center'
            : ''
        )}
      >

      {!forgotOpen && !confirmEmailOpen && !isYandexLikeAuth && (
        <div className="rounded-2xl p-1">
          <div className="flex gap-1 text-xs font-medium">
          <button
            type="button"
            className={cn(
              'flex-1 rounded-xl px-3 py-2 transition-colors',
              mode === 'login'
                ? 'bg-sky-500 text-white'
                : 'bg-transparent text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            )}
            onClick={() => setMode('login')}
          >
            Вход
          </button>
          <button
            type="button"
            className={cn(
              'flex-1 rounded-xl px-3 py-2 transition-colors',
              mode === 'register'
                ? 'bg-sky-500 text-white'
                : 'bg-transparent text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            )}
            onClick={() => setMode('register')}
          >
            Регистрация
          </button>
          </div>
        </div>
      )}

      <div key={authViewKey} className="auth-panel-view auth-panel-view-enter">
      {confirmEmailOpen ? (
        <div
          className={cn(
            'space-y-3 rounded-2xl p-3'
          )}
        >
          <p className="text-[11px] text-slate-600 dark:text-[#94a3b8]">
            На вашу почту{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              {confirmEmail || email}
            </span>{' '}
            отправлен код подтверждения. Введите его, чтобы завершить регистрацию.
          </p>

          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
              Код из письма
            </p>
            <input
              type="text"
              inputMode="numeric"
              value={confirmEmailCode}
              onChange={(e) => setConfirmEmailCode(e.target.value)}
              className={authInputClass}
              placeholder="123456"
            />
          </div>

          <button
            type="button"
            onClick={handleConfirmEmail}
            disabled={confirmEmailStatus === 'verifying'}
            className={authPrimaryButtonClass}
          >
            {confirmEmailStatus === 'verifying' ? 'Проверка…' : 'Подтвердить почту'}
          </button>

          <button
            type="button"
            onClick={() => {
              const targetEmail = confirmEmail.trim() || email.trim();
              if (!targetEmail) {
                setError('Не удалось определить почту для повторной отправки кода.');
                return;
              }
              setError(null);
              setSuccess(null);
              setConfirmEmailStatus('sending');
              void fetch(`${API_PREFIX}/users/email-code/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: targetEmail, purpose: 'register' }),
              })
                .then(async (res) => {
                  if (!res.ok) {
                    const json = await res.json().catch(() => null);
                    const raw =
                      (json &&
                        (json as { error?: string; message?: string; detail?: string }).error) ||
                      (json &&
                        (json as { error?: string; message?: string; detail?: string }).message) ||
                      (json &&
                        (json as { error?: string; message?: string; detail?: string }).detail) ||
                      null;
                    const msg = translateAuthError(
                      raw,
                      'Не удалось отправить код. Проверьте почту и попробуйте ещё раз.'
                    );
                    setError(msg);
                  } else {
                    setSuccess('Код повторно отправлен на почту.');
                  }
                })
                .catch(() => {
                  setError('Не удалось отправить код. Попробуйте ещё раз.');
                })
                .finally(() => {
                  setConfirmEmailStatus('idle');
                });
            }}
            disabled={confirmEmailStatus !== 'idle'}
            className={authGhostButtonClass}
          >
            Отправить код ещё раз
          </button>

          <button
            type="button"
            onClick={() => {
              setConfirmEmailOpen(false);
              setConfirmEmailCode('');
              setConfirmEmailStatus('idle');
            }}
            className={authGhostButtonClass}
          >
            ← Назад к регистрации
          </button>
        </div>
      ) : forgotOpen ? (
        <div
          className={cn(
            'space-y-3 rounded-2xl p-3'
          )}
        >
          {forgotStep === 'email' ? (
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
                Почта
              </p>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className={authInputClass}
                placeholder="you@example.com"
              />
              <p className="text-[11px] text-slate-500 dark:text-[#94a3b8]">
                Мы отправим код восстановления на эту почту.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
                  Почта
                </p>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className={authInputClass}
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
                  Код из письма
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  value={forgotCode}
                  onChange={(e) => setForgotCode(e.target.value)}
                  className={authInputClass}
                  placeholder="123456"
                />
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
                  Новый пароль
                </p>
                <input
                  type="password"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  className={authInputClass}
                  placeholder="Минимум 6 символов"
                />
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
                  Повтор пароля
                </p>
                <input
                  type="password"
                  value={forgotNewPassword2}
                  onChange={(e) => setForgotNewPassword2(e.target.value)}
                  className={authInputClass}
                  placeholder="Повторите пароль"
                />
              </div>
            </>
          )}

          {success && (
            <p className="text-[11px] text-emerald-700 dark:text-emerald-200 px-1 py-1">
              {success}
            </p>
          )}

          {error && (
            <p className="text-[11px] text-red-600 dark:text-red-400 px-1 py-1">
              {error}
            </p>
          )}

          {forgotStep === 'email' ? (
            <button
              type="button"
              onClick={handleSendResetCode}
              disabled={forgotStatus === 'sending'}
              className={authPrimaryButtonClass}
            >
              {forgotStatus === 'sending' ? 'Отправка…' : 'Отправить код'}
            </button>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={forgotStatus === 'resetting'}
                className={authPrimaryButtonClass}
              >
                {forgotStatus === 'resetting' ? 'Сохранение…' : 'Сменить пароль'}
              </button>
              <button
                type="button"
                onClick={handleSendResetCode}
                disabled={forgotStatus === 'sending' || forgotStatus === 'resetting'}
                className={authGhostButtonClass}
              >
                Отправить код ещё раз
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setForgotOpen(false);
              setForgotStatus('idle');
              setForgotStep('email');
              setForgotEmail('');
              setForgotCode('');
              setForgotNewPassword('');
              setForgotNewPassword2('');
              setError(null);
              setSuccess(null);
            }}
            className={authGhostButtonClass}
          >
            ← Назад ко входу
          </button>
        </div>
      ) : (
      <form
        onSubmit={handleSubmit}
        className={cn(
          'space-y-3 rounded-2xl p-3',
        )}
      >
        {mode === 'login' && (
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
              Логин / почта / телефон
            </p>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className={authInputClass}
              placeholder="Почта, логин или телефон"
            />
          </div>
        )}

        {mode === 'register' && (
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
              Логин
            </p>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              className={authInputClass}
              placeholder="Ваш логин"
            />
          </div>
        )}

        {mode === 'register' && (
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
              Почта
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={authInputClass}
              placeholder="you@example.com"
            />
          </div>
        )}

        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
            Пароль
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={authInputClass}
            placeholder={mode === 'login' ? 'Пароль' : 'Минимум 6 символов'}
          />
        </div>

        {mode === 'register' && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className={authInputClass}
                placeholder="Фамилия"
              />
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className={authInputClass}
                placeholder="Имя"
              />

              <input
                type="text"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                className={authInputClass}
                placeholder="Отчество (опц.)"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className={authInputClass}
                placeholder="Телефон"
              />

              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className={authInputClass}
                placeholder="Город"
              />
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                required
                className={authInputClass}
                placeholder="Улица"
              />

              <input
                type="text"
                value={house}
                onChange={(e) => setHouse(e.target.value)}
                required
                className={authInputClass}
                placeholder="Дом"
              />
              <input
                type="text"
                value={apartment}
                onChange={(e) => setApartment(e.target.value)}
                className={authInputClass}
                placeholder="Квартира (опц.)"
              />
            </div>
          </>
        )}

        {success && (
          <p className="text-[11px] text-emerald-700 dark:text-emerald-200 px-1 py-1">
            {success}
          </p>
        )}

        {error && (
          <p className="text-[11px] text-red-600 dark:text-red-400 px-1 py-1">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={authPrimaryButtonClass}
        >
          {loading
            ? 'Отправка...'
            : mode === 'login'
            ? 'Сдай кента'
            : 'Зарегистрироваться'}
        </button>

        {isYandexLikeAuth && mode === 'login' && (
          <button
            type="button"
            onClick={() => setMode('register')}
            className="w-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Нет аккаунта? Зарегистрироваться
          </button>
        )}

        {isYandexLikeAuth && mode === 'register' && (
          <button
            type="button"
            onClick={() => setMode('login')}
            className="w-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Уже есть аккаунт? Сдай кента
          </button>
        )}

        {mode === 'login' && (
          <button
            type="button"
            onClick={() => {
              setForgotOpen(true);
              setForgotEmail('');
              setForgotStatus('idle');
              setError(null);
              setSuccess(null);
            }}
            className={authGhostButtonClass}
          >
            Забыли пароль?
          </button>
        )}
      </form>
      )}
      </div>
      </div>
    </div>
    </div>
  );
}
