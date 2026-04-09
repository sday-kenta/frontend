import { useEffect, useState } from 'react';
import type { FC, FormEvent } from 'react';
import { Lock, KeyRound, Check, X, User, Mail, Phone, House } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn, normalizeAvatarPath } from '@/lib/utils';
import { ApiError, api, withApiBase } from '@/lib/api';

type UserProfile = {
  id: number;
  login: string;
  email: string;
  last_name: string;
  first_name: string;
  middle_name: string;
  phone: string;
  city: string;
  street: string;
  house: string;
  apartment: string;
  is_blocked: boolean;
  role: string;
  created_at: string;
  updated_at: string;
  avatar_url?: string | null;
};

type ProfileTabProps = {
  userId: number;
  onAvatarChange?: (url: string | null) => void;
  onOpenMyReports?: () => void;
  onOpenSettings?: () => void;
};

function formatPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (!digits) return '';

  const a = digits[0] ?? '';
  const bbb = digits.slice(1, 4);
  const ccc = digits.slice(4, 7);
  const dd = digits.slice(7, 9);
  const ee = digits.slice(9, 11);

  let result = `+${a}`;

  if (bbb) {
    result += ` (${bbb}`;
    if (bbb.length === 3) {
      result += ')';
    }
  }

  if (ccc) {
    result += bbb.length === 3 ? ` ${ccc}` : ccc;
  }

  if (dd) {
    result += `-${dd}`;
  }

  if (ee) {
    result += `-${ee}`;
  }

  return result;
}

const ProfileTab: FC<ProfileTabProps> = ({
  userId,
  onAvatarChange,
  onOpenMyReports: _onOpenMyReports,
  onOpenSettings: _onOpenSettings,
}) => {
  // В dev работает через proxy, в production через VITE_API_BASE_URL.
  const API_PREFIX = withApiBase('/v1');

  const [initialProfile, setInitialProfile] = useState<UserProfile | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmCode, setConfirmCode] = useState('');
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<'profile' | 'password'>('profile');
  const [pwdStatus, setPwdStatus] = useState<'idle' | 'sending' | 'saving'>('idle');
  const [pwdCode, setPwdCode] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdNew2, setPwdNew2] = useState('');
  const [pwdMessage, setPwdMessage] = useState<string | null>(null);

  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const hasEmailChanged =
    !!profile && !!initialProfile && profile.email !== initialProfile.email;
  const hasPhoneChanged =
    !!profile && !!initialProfile && profile.phone !== initialProfile.phone;
  const hasSensitiveChange = hasEmailChanged || hasPhoneChanged;

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setStatus('idle');
    setStatusMessage(null);

    fetch(`${API_PREFIX}/users/${userId}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Не удалось загрузить профиль.');
        }
        const json = await res.json();
        console.log('PROFILE RESPONSE', json);
        // Бэк может вернуть объект, массив или обёртку { data: {...} }
        const raw: any = Array.isArray(json) ? json[0] : (json?.data ?? json);
        const user: UserProfile = {
          ...raw,
          avatar_url: normalizeAvatarPath(raw?.avatar_url ?? null),
        };
        return user;
      })
      .then((user: UserProfile) => {
        if (!isMounted) return;
        setInitialProfile(user);
        setProfile(user);
        onAvatarChange?.(user.avatar_url ?? null);
      })
      .catch(() => {
        if (!isMounted) return;
        setStatus('error');
        setStatusMessage('Не удалось загрузить профиль пользователя.');
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [API_PREFIX, userId]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setStatus('idle');
    setStatusMessage(null);
    setConfirmError(null);

    if (!profile) return;

    if (hasSensitiveChange) {
      setIsConfirmOpen(true);
      // Если меняем почту — отправляем код на ТЕКУЩУЮ (старую) почту
      if (hasEmailChanged) {
        const currentEmail = initialProfile?.email;
        if (!currentEmail) return;
        void fetch(`${API_PREFIX}/users/email-code/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentEmail, purpose: 'change_email' }),
        }).then(async (res) => {
          if (!res.ok) {
            const json = await res.json().catch(() => null);
            const msg =
              (json && (json as { error?: string }).error) ||
              'Не удалось отправить код на почту.';
            setStatus('error');
            setStatusMessage(msg);
          }
        });
      }
    } else {
      void handleSaveProfile();
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    try {
      setIsSaving(true);

      const res = await fetch(`${API_PREFIX}/users/${profile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (!res.ok) {
        throw new Error('Не удалось сохранить изменения.');
      }

      const updated = (await res.json()) as UserProfile;
      const normalizedUpdated: UserProfile = {
        ...updated,
        avatar_url: normalizeAvatarPath(updated.avatar_url),
      };
      setInitialProfile(normalizedUpdated);
      setProfile(normalizedUpdated);
      onAvatarChange?.(normalizedUpdated.avatar_url ?? null);

      setStatus('success');
      setStatusMessage('Данные профиля обновлены.');
    } catch {
      setStatus('error');
      setStatusMessage('Не удалось сохранить изменения. Попробуйте ещё раз.');
    } finally {
      setIsSaving(false);
      setConfirmCode('');
      setIsConfirmOpen(false);
    }
  };

  const translateApiError = (json: any, fallback: string) => {
    const msg = (json?.error ?? json?.message ?? json?.detail ?? '') as string;
    if (!msg) return fallback;
    const low = msg.toLowerCase();
    if (low.includes('invalid code')) return 'Неверный код.';
    if (low.includes('code expired')) return 'Код просрочен. Запросите новый.';
    if (low.includes('invalid credentials')) return 'Неверные данные для входа.';
    if (low.includes('user is blocked')) return 'Пользователь заблокирован.';
    if (low.includes('email already exists') || low.includes('email already exist')) {
      return 'Пользователь с такой почтой уже зарегистрирован.';
    }
    if (low.includes('phone already exists') || low.includes('phone already exist')) {
      return 'Пользователь с таким телефоном уже зарегистрирован.';
    }
    return msg;
  };
  const getErrorText = (err: unknown, fallback: string) =>
    err instanceof ApiError || err instanceof Error ? err.message : fallback;

  const handleSendPasswordCode = async () => {
    if (!profile?.email) {
      setPwdMessage('Не удалось определить почту для отправки кода.');
      return;
    }
    setPwdMessage(null);
    setPwdStatus('sending');
    try {
      await api.sendPasswordResetCode({ email: profile.email });
      setPwdMessage('Код отправлен на вашу почту.');
    } catch (e) {
      setPwdMessage(getErrorText(e, 'Не удалось отправить код на почту.'));
    } finally {
      setPwdStatus('idle');
    }
  };

  const handleChangePassword = async () => {
    if (!profile?.email) return;
    setPwdMessage(null);
    const code = pwdCode.trim();
    if (!code) {
      setPwdMessage('Введите код из письма.');
      return;
    }
    if (!pwdNew || pwdNew.length < 6) {
      setPwdMessage('Пароль слишком короткий (минимум 6 символов).');
      return;
    }
    if (pwdNew !== pwdNew2) {
      setPwdMessage('Пароли не совпадают.');
      return;
    }

    setPwdStatus('saving');
    try {
      const res = await fetch(`${API_PREFIX}/users/password-reset/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email,
          code,
          new_password: pwdNew,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(translateApiError(json, 'Не удалось сменить пароль. Проверьте код.'));
      }
      setPwdCode('');
      setPwdNew('');
      setPwdNew2('');
      setPwdMessage('Пароль успешно изменён.');
      setActiveProfileTab('profile');
    } catch (e) {
      setPwdMessage(e instanceof Error ? e.message : 'Не удалось сменить пароль.');
    } finally {
      setPwdStatus('idle');
    }
  };

  const handleConfirm = async () => {
    setConfirmError(null);
    if (!confirmCode.trim()) {
      setConfirmError('Введите код подтверждения.');
      return;
    }
    // Если меняем почту — сначала проверяем код, который пришёл на текущую (старую) почту
    if (profile && hasEmailChanged) {
      const currentEmail = initialProfile?.email;
      if (!currentEmail) {
        setConfirmError('Не удалось определить текущую почту для подтверждения.');
        return;
      }
      const verifyRes = await fetch(`${API_PREFIX}/users/email-code/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentEmail,
          purpose: 'change_email',
          code: confirmCode.trim(),
        }),
      });
      if (!verifyRes.ok) {
        const json = await verifyRes.json().catch(() => null);
        setConfirmError(translateApiError(json, 'Неверный код.'));
        return;
      }
    }
    await handleSaveProfile();
  };

  const sectionCardClass =
    'rounded-3xl bg-white/95 p-4 shadow-sm ring-1 ring-slate-200/80 dark:bg-zinc-900/65 dark:ring-white/10';
  const fieldLabelClass =
    'text-[11px] font-semibold tracking-wide text-slate-500 dark:text-[#94a3b8]';
  const filledInputClass =
    'rounded-2xl border-slate-200/80 bg-slate-50/90 text-base text-slate-900 dark:border-white/10 dark:bg-zinc-950/70 dark:text-slate-50';
  const hasUnsavedChanges =
    !!profile &&
    !!initialProfile &&
    (
      profile.email !== initialProfile.email ||
      profile.phone !== initialProfile.phone ||
      profile.last_name !== initialProfile.last_name ||
      profile.first_name !== initialProfile.first_name ||
      profile.middle_name !== initialProfile.middle_name ||
      profile.city !== initialProfile.city ||
      profile.street !== initialProfile.street ||
      profile.house !== initialProfile.house ||
      profile.apartment !== initialProfile.apartment
    );

  return (
    <div className="space-y-4">
      

      <p className="px-1 text-xs text-slate-600 dark:text-[#94a3b8]">
        {activeProfileTab === 'profile'
          ? 'Личные данные и контакты аккаунта'
          : 'Смена пароля: код на почту и новый пароль'}
      </p>



      <div className="rounded-2xl bg-slate-100 p-1 dark:bg-white/5">
        <div className="grid grid-cols-2 gap-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveProfileTab('profile')}
            className={cn(
              'rounded-xl px-3 py-2 transition-colors',
              activeProfileTab === 'profile'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-zinc-900/80 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            )}
          >
            Профиль
          </button>
          <button
            type="button"
            onClick={() => setActiveProfileTab('password')}
            className={cn(
              'rounded-xl px-3 py-2 transition-colors',
              activeProfileTab === 'password'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-zinc-900/80 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            )}
          >
            Смена пароля
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="rounded-3xl bg-white/95 p-4 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200/80 dark:bg-zinc-900/65 dark:text-[#94a3b8] dark:ring-white/10">
          Загрузка данных профиля…
        </div>
      )}

      {!isLoading && !profile && (
        <div className="rounded-3xl border border-red-500/40 bg-red-50 p-4 text-sm text-red-700 dark:bg-red-500/5 dark:text-red-200">
          Не удалось загрузить профиль пользователя.
        </div>
      )}

      {!isLoading && profile && activeProfileTab === 'profile' && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className={sectionCardClass}>
          <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-white">
            <Mail className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />
            Контактные данные
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <p className={fieldLabelClass}>
                Логин
              </p>
              <Input
                value={profile.login}
                disabled
                className={filledInputClass}
              />
              <p className="text-[11px] text-slate-500 dark:text-[#94a3b8]">
                Логин изменить нельзя.
              </p>
            </div>

            <div className="space-y-1">
              <p className={fieldLabelClass}>
                Почта
              </p>
              <Input
                type="email"
                autoComplete="email"
                value={profile.email}
                onChange={(e) =>
                  setProfile((p) => (p ? { ...p, email: e.target.value } : null))
                }
                className={filledInputClass}
                placeholder="you@example.com"
                required
              />
              {hasEmailChanged && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  Для смены почты понадобится подтверждение.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className={cn(sectionCardClass, 'space-y-3')}>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-white">
            <User className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />
            Личные данные
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="space-y-1">
            <p className={fieldLabelClass}>
              Фамилия
            </p>
            <Input
              type="text"
              autoComplete="family-name"
              value={profile.last_name}
              onChange={(e) =>
                setProfile((p) => (p ? { ...p, last_name: e.target.value } : p))
              }
              className={filledInputClass}
              placeholder="Фамилия"
            />
            </div>
            <div className="space-y-1">
            <p className={fieldLabelClass}>
              Имя
            </p>
            <Input
              type="text"
              autoComplete="given-name"
              value={profile.first_name}
              onChange={(e) =>
                setProfile((p) => (p ? { ...p, first_name: e.target.value } : p))
              }
              className={filledInputClass}
              placeholder="Имя"
            />
            </div>
            <div className="space-y-1">
            <p className={fieldLabelClass}>
              Отчество
            </p>
            <Input
              type="text"
              autoComplete="additional-name"
              value={profile.middle_name}
              onChange={(e) =>
                setProfile((p) => (p ? { ...p, middle_name: e.target.value } : p))
              }
              className={filledInputClass}
              placeholder="Отчество"
            />
            </div>
          </div>

        <div className="space-y-1">
          <p className={cn(fieldLabelClass, 'flex items-center gap-1')}>
            <Phone className="h-3 w-3" />
            Номер телефона
          </p>
          <Input
            type="tel"
            autoComplete="tel"
            value={profile.phone}
            onChange={(e) =>
              setProfile((p) =>
                p ? { ...p, phone: formatPhone(e.target.value) } : p,
              )
            }
            className={filledInputClass}
            placeholder="+79991234567"
          />
        </div>
        </div>

        <div className={cn(sectionCardClass, 'space-y-3')}>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-white">
            <House className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />
            Адрес
          </p>
          <div className="space-y-1">
            <p className={fieldLabelClass}>
              Город
            </p>
            <Input
              type="text"
              autoComplete="address-level2"
              value={profile.city}
              onChange={(e) =>
                setProfile((p) => (p ? { ...p, city: e.target.value } : p))
              }
              className={filledInputClass}
              placeholder="Город"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="space-y-1">
              <p className={fieldLabelClass}>
                Улица
              </p>
              <Input
                type="text"
                autoComplete="street-address"
                value={profile.street}
                onChange={(e) =>
                  setProfile((p) => (p ? { ...p, street: e.target.value } : p))
                }
                className={filledInputClass}
                placeholder="Улица"
              />
            </div>
            <div className="space-y-1">
              <p className={fieldLabelClass}>
                Дом
              </p>
              <Input
                type="text"
                autoComplete="address-line2"
                value={profile.house}
                onChange={(e) =>
                  setProfile((p) => (p ? { ...p, house: e.target.value } : p))
                }
                className={filledInputClass}
                placeholder="Дом"
              />
            </div>
            <div className="space-y-1">
              <p className={fieldLabelClass}>
                Квартира
              </p>
              <Input
                type="text"
                autoComplete="address-line2"
                value={profile.apartment}
                onChange={(e) =>
                  setProfile((p) => (p ? { ...p, apartment: e.target.value } : p))
                }
                className={filledInputClass}
                placeholder="Кв."
              />
            </div>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`mt-1 rounded-lg border px-3 py-2 text-xs ${
              status === 'success'
                ? 'border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200'
                : 'border-red-500/40 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-200'
            }`}
          >
            {statusMessage}
          </div>
        )}

        {hasUnsavedChanges && !statusMessage && (
          <div className="rounded-lg border border-amber-300/60 bg-amber-50/70 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
            Есть несохранённые изменения.
          </div>
        )}

        <div className="pt-1 flex justify-end">
          <Button
            type="submit"
            disabled={isSaving || !hasUnsavedChanges}
            className="w-full rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-600 disabled:bg-slate-300 disabled:text-slate-600 dark:disabled:bg-white/10 dark:disabled:text-slate-400 md:w-auto"
          >
            {isSaving ? 'Сохранение…' : hasUnsavedChanges ? 'Сохранить изменения' : 'Изменений нет'}
          </Button>
        </div>
        </form>
      )}

      {!isLoading && profile && activeProfileTab === 'password' && (
        <div className="space-y-4">
          <div className={sectionCardClass}>
            <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-white">
              <Lock className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />
              Код на почту
            </div>
            <p className="mb-3 text-xs leading-relaxed text-slate-600 dark:text-[#94a3b8]">
              Отправим код подтверждения на{' '}
              <span className="font-medium text-slate-800 dark:text-slate-200">{profile.email}</span>
            </p>
            <Button
              type="button"
              disabled={pwdStatus !== 'idle'}
              onClick={handleSendPasswordCode}
              className="w-full rounded-2xl bg-sky-500 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 hover:bg-sky-600 disabled:bg-slate-300 disabled:text-slate-600 disabled:shadow-none dark:disabled:bg-white/10 dark:disabled:text-slate-400"
            >
              {pwdStatus === 'sending' ? 'Отправка…' : 'Отправить код'}
            </Button>
          </div>

          <div className={cn(sectionCardClass, 'space-y-3')}>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-white">
              <KeyRound className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />
              Новый пароль
            </p>

            <div className="space-y-1">
              <p className={fieldLabelClass}>Код из письма</p>
              <Input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={pwdCode}
                onChange={(e) => setPwdCode(e.target.value)}
                className={filledInputClass}
                placeholder="Например, 123456"
              />
            </div>

            <div className="space-y-1">
              <p className={fieldLabelClass}>Новый пароль</p>
              <Input
                type="password"
                autoComplete="new-password"
                value={pwdNew}
                onChange={(e) => setPwdNew(e.target.value)}
                className={filledInputClass}
                placeholder="Минимум 6 символов"
              />
            </div>

            <div className="space-y-1">
              <p className={fieldLabelClass}>Повтор пароля</p>
              <Input
                type="password"
                autoComplete="new-password"
                value={pwdNew2}
                onChange={(e) => setPwdNew2(e.target.value)}
                className={filledInputClass}
                placeholder="Повторите пароль"
              />
            </div>

            {pwdMessage && (
              <div
                className={cn(
                  'rounded-lg border px-3 py-2 text-xs',
                  /успешно|отправлен/i.test(pwdMessage)
                    ? 'border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200'
                    : /Не удалось|неверн|коротк|совпадают|Введите/i.test(pwdMessage)
                      ? 'border-red-500/40 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-200'
                      : 'border-slate-200/80 bg-slate-50/90 text-slate-700 dark:border-white/10 dark:bg-zinc-950/70 dark:text-[#cbd5f5]'
                )}
              >
                {pwdMessage}
              </div>
            )}

            <div className="pt-1 flex justify-end">
              <Button
                type="button"
                disabled={pwdStatus !== 'idle'}
                onClick={handleChangePassword}
                className="w-full rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 hover:bg-sky-600 disabled:bg-slate-300 disabled:text-slate-600 disabled:shadow-none dark:disabled:bg-white/10 dark:disabled:text-slate-400 md:w-auto"
              >
                {pwdStatus === 'saving' ? 'Сохранение…' : 'Сменить пароль'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isConfirmOpen && (
        <div className="fixed inset-0 z-[950] flex items-center justify-center bg-black/40 dark:bg-black/60">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-2xl dark:border-white/10 dark:bg-zinc-900">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-amber-100 p-1.5 dark:bg-amber-500/15">
                <Lock className="h-4 w-4 text-amber-500 dark:text-amber-300" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Подтверждение изменения данных
                </h2>
                <p className="mt-1 text-xs text-slate-600 dark:text-[#94a3b8]">
                  Для безопасности введите код подтверждения.
                </p>

                <div className="mt-3 space-y-1.5">
                  <label className="text-[11px] font-medium text-slate-600 dark:text-[#94a3b8] uppercase tracking-wide flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-slate-500 dark:text-[#64748b]" />
                    Код подтверждения
                  </label>
                  <Input
                    type="text"
                    autoFocus
                    value={confirmCode}
                    onChange={(e) => {
                      setConfirmCode(e.target.value);
                      setConfirmError(null);
                    }}
                    className="bg-slate-50 border-slate-200 text-base md:text-sm text-slate-900 dark:bg-black/40 dark:border-white/15 dark:text-slate-50"
                    placeholder="Например, 123456"
                  />
                </div>

                {confirmError && (
                  <div className="mt-2 rounded-lg border border-red-500/40 bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-200">
                    {confirmError}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsConfirmOpen(false);
                      setConfirmCode('');
                      setConfirmError(null);
                    }}
                    className="text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-[#cbd5f5] dark:hover:text-white dark:hover:bg-white/5"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Отмена
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleConfirm}
                    disabled={isSaving}
                    className="text-xs px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Подтвердить
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileTab;
