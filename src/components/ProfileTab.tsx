import { useEffect, useState, useRef } from 'react';
import type { FC, FormEvent, ChangeEvent } from 'react';
import { Lock, Check, X, Camera } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { resolveAvatarUrl } from '@/lib/utils';

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

const ProfileTab: FC<ProfileTabProps> = ({ userId, onAvatarChange }) => {
  // Используем тот же прокси, что и в админке: /v1 -> VITE_API_PROXY_TARGET
  const API_PREFIX = '/v1';

  const [initialProfile, setInitialProfile] = useState<UserProfile | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmCode, setConfirmCode] = useState('');
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [passwordPanelOpen, setPasswordPanelOpen] = useState(false);
  const [pwdStatus, setPwdStatus] = useState<'idle' | 'sending' | 'saving'>('idle');
  const [pwdCode, setPwdCode] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdNew2, setPwdNew2] = useState('');
  const [pwdMessage, setPwdMessage] = useState<string | null>(null);

  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          throw new Error('Failed to load profile');
        }
        const json = await res.json();
        console.log('PROFILE RESPONSE', json);
        // Бэк может вернуть объект, массив или обёртку { data: {...} }
        const raw: any = Array.isArray(json) ? json[0] : (json?.data ?? json);
        const user: UserProfile = {
          ...raw,
          avatar_url: raw?.avatar_url ?? raw?.avatar ?? raw?.avatarUrl ?? null,
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
      setInitialProfile(updated);
      setProfile(updated);
      onAvatarChange?.(updated.avatar_url ?? null);

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
    return msg;
  };

  const handleSendPasswordCode = async () => {
    if (!profile?.email) return;
    setPwdMessage(null);
    setPwdStatus('sending');
    try {
      const res = await fetch(`${API_PREFIX}/users/password-reset/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(translateApiError(json, 'Не удалось отправить код на почту.'));
      }
      setPwdMessage('Код отправлен на вашу почту.');
    } catch (e) {
      setPwdMessage(e instanceof Error ? e.message : 'Не удалось отправить код на почту.');
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
      setPasswordPanelOpen(false);
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

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (file.size > 2 * 1024 * 1024) {
      setStatus('error');
      setStatusMessage('Файл слишком большой (макс. 2 МБ).');
      return;
    }
    const ok = /^image\/(jpeg|jpg|png)$/i.test(file.type);
    if (!ok) {
      setStatus('error');
      setStatusMessage('Разрешены только JPEG и PNG.');
      return;
    }
    e.target.value = '';
    try {
      setAvatarUploading(true);
      setStatusMessage(null);
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch(`${API_PREFIX}/users/${profile.id}/avatar`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string })?.message || 'Ошибка загрузки');
      }
      const profileRes = await fetch(`${API_PREFIX}/users/${profile.id}`);
      if (profileRes.ok) {
        const json = await profileRes.json();
        const raw: any = Array.isArray(json) ? json[0] : (json?.data ?? json);
        const newUrl = raw?.avatar_url ?? raw?.avatar ?? raw?.avatarUrl ?? profile.avatar_url;
        setProfile((p) => (p ? { ...p, avatar_url: newUrl } : p));
        setInitialProfile((p) => (p ? { ...p, avatar_url: newUrl } : p));
        onAvatarChange?.(newUrl ?? null);
      }
      setStatus('success');
      setStatusMessage('Аватар обновлён.');
    } catch (err) {
      setStatus('error');
      setStatusMessage(err instanceof Error ? err.message : 'Не удалось загрузить аватар.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const initials = profile
    ? [profile.last_name, profile.first_name]
        .filter(Boolean)
        .map((s) => s.trim()[0]?.toUpperCase())
        .join('')
    : '';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-transparent px-3 py-2.5">
        <label className="relative cursor-pointer group/avatar">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            className="sr-only"
            onChange={handleAvatarChange}
            disabled={avatarUploading || !profile}
          />
          <Avatar className="h-11 w-11 shadow-md shadow-sky-500/40 ring-2 ring-white/50 dark:ring-slate-700">
            {profile?.avatar_url && <AvatarImage src={resolveAvatarUrl(profile.avatar_url) ?? ''} alt="" className="object-cover" />}
            <AvatarFallback className="bg-gradient-to-br from-sky-500 to-blue-600 text-sm font-semibold text-white">
              {initials || '👤'}
            </AvatarFallback>
          </Avatar>
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity">
            <Camera className="h-5 w-5 text-white" />
          </span>
          {avatarUploading && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </span>
          )}
        </label>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
            Профиль
          </h2>
          <p className="truncate text-xs text-slate-600 dark:text-[#cbd5f5]/80">
            {profile?.email || 'Настройка контактных данных'}
          </p>
        </div>
      </div>

      <p className="text-sm text-slate-700 dark:text-[#cbd5f5]">
        Здесь вы можете изменить данные своего профиля.
      </p>

      {isLoading && (
        <div className="mt-1 rounded-2xl border border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-[#020617] p-4 text-sm text-slate-700 dark:text-[#94a3b8]">
          Загрузка данных профиля…
        </div>
      )}

      {!isLoading && !profile && (
        <div className="mt-1 rounded-2xl border border-red-500/40 bg-red-50 p-4 text-sm text-red-700 dark:bg-red-500/5 dark:text-red-200">
          Не удалось загрузить профиль пользователя.
        </div>
      )}

      {!isLoading && profile && (
        <form
          onSubmit={handleSubmit}
          className="mt-1 rounded-2xl border border-slate-200/90 bg-white shadow-sm shadow-slate-200/70 dark:border-white/10 dark:bg-[#020617] p-4 space-y-3"
        >
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
            Логин
          </p>
          <Input
            value={profile.login}
            disabled
            className="bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/10 text-base text-slate-900 dark:text-slate-50"
          />
        </div>

        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
            Почта
          </p>
          <Input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile((p) => (p ? { ...p, email: e.target.value } : null))}
            className="bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-white/10 text-base text-slate-900 dark:text-slate-50"
            placeholder="you@example.com"
            required
          />
          {hasEmailChanged && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              При изменении почты понадобится подтверждение.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-slate-500 dark:text-[#94a3b8]">
              Фамилия
            </p>
            <Input
              type="text"
              value={profile.last_name}
              onChange={(e) =>
                setProfile((p) => (p ? { ...p, last_name: e.target.value } : p))
              }
              className="bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-white/10 text-base text-slate-900 dark:text-slate-50"
              placeholder="Фамилия"
            />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-slate-500 dark:text-[#94a3b8]">
              Имя
            </p>
            <Input
              type="text"
              value={profile.first_name}
              onChange={(e) =>
                setProfile((p) => (p ? { ...p, first_name: e.target.value } : p))
              }
              className="bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-white/10 text-base text-slate-900 dark:text-slate-50"
              placeholder="Имя"
            />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-slate-500 dark:text-[#94a3b8]">
              Отчество
            </p>
            <Input
              type="text"
              value={profile.middle_name}
              onChange={(e) =>
                setProfile((p) => (p ? { ...p, middle_name: e.target.value } : p))
              }
              className="bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-white/10 text-base text-slate-900 dark:text-slate-50"
              placeholder="Отчество"
            />
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] uppercase tracking-wide">
            Номер телефона
          </p>
          <Input
            type="tel"
            value={profile.phone}
            onChange={(e) =>
              setProfile((p) =>
                p ? { ...p, phone: formatPhone(e.target.value) } : p,
              )
            }
            className="bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-white/10 text-base text-slate-900 dark:text-slate-50"
            placeholder="+79991234567"
          />
        </div>

        <div className="space-y-2">
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-slate-500 dark:text-[#94a3b8]">
              Город
            </p>
            <Input
              type="text"
              value={profile.city}
              onChange={(e) =>
                setProfile((p) => (p ? { ...p, city: e.target.value } : p))
              }
              className="bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-white/10 text-base text-slate-900 dark:text-slate-50"
              placeholder="Город"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-slate-500 dark:text-[#94a3b8]">
                Улица
              </p>
              <Input
                type="text"
                value={profile.street}
                onChange={(e) =>
                  setProfile((p) => (p ? { ...p, street: e.target.value } : p))
                }
                className="bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-white/10 text-base text-slate-900 dark:text-slate-50"
                placeholder="Улица"
              />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-slate-500 dark:text-[#94a3b8]">
                Дом
              </p>
              <Input
                type="text"
                value={profile.house}
                onChange={(e) =>
                  setProfile((p) => (p ? { ...p, house: e.target.value } : p))
                }
                className="bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-white/10 text-base text-slate-900 dark:text-slate-50"
                placeholder="Дом"
              />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-slate-500 dark:text-[#94a3b8]">
                Квартира
              </p>
              <Input
                type="text"
                value={profile.apartment}
                onChange={(e) =>
                  setProfile((p) => (p ? { ...p, apartment: e.target.value } : p))
                }
                className="bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-white/10 text-base text-slate-900 dark:text-slate-50"
                placeholder="Кв."
              />
            </div>
          </div>
        </div>

        <div className="pt-1">
          <div className="w-full rounded-2xl border border-slate-200 bg-white text-slate-900 dark:bg-[#020617] dark:border-white/10 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium dark:text-white">Смена пароля</p>
                <p className="text-xs text-slate-600 dark:text-[#94a3b8]">
                  Код придёт на вашу почту: {profile.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPasswordPanelOpen((v) => !v);
                  setPwdMessage(null);
                }}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
              >
                {passwordPanelOpen ? 'Скрыть' : 'Открыть'}
              </button>
            </div>
          </div>

          {passwordPanelOpen && (
            <div className="mt-2 rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#020617] p-4 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  disabled={pwdStatus !== 'idle'}
                  onClick={handleSendPasswordCode}
                  className="w-full sm:w-auto sm:flex-1 rounded-xl bg-sky-500 hover:bg-sky-600 text-xs font-semibold text-white shadow-md shadow-sky-500/40"
                >
                  {pwdStatus === 'sending' ? 'Отправка…' : 'Отправить код'}
                </Button>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
                  Код из письма
                </p>
                <Input
                  type="text"
                  value={pwdCode}
                  onChange={(e) => setPwdCode(e.target.value)}
                  className="bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-white/10 text-base text-slate-900 dark:text-slate-50"
                  placeholder="123456"
                />
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
                  Новый пароль
                </p>
                <Input
                  type="password"
                  value={pwdNew}
                  onChange={(e) => setPwdNew(e.target.value)}
                  className="bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-white/10 text-base text-slate-900 dark:text-slate-50"
                  placeholder="Минимум 6 символов"
                />
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
                  Повтор пароля
                </p>
                <Input
                  type="password"
                  value={pwdNew2}
                  onChange={(e) => setPwdNew2(e.target.value)}
                  className="bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-white/10 text-base text-slate-900 dark:text-slate-50"
                  placeholder="Повторите пароль"
                />
              </div>

              {pwdMessage && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-white/10 dark:bg-black/30 dark:text-[#cbd5f5]">
                  {pwdMessage}
                </div>
              )}

              <Button
                type="button"
                disabled={pwdStatus !== 'idle'}
                onClick={handleChangePassword}
                className="w-full rounded-xl bg-sky-500 hover:bg-sky-600 text-xs font-semibold text-white shadow-md shadow-sky-500/40"
              >
                {pwdStatus === 'saving' ? 'Сохранение…' : 'Сменить пароль'}
              </Button>
            </div>
          )}
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

        <div className="pt-1 flex justify-end">
          <Button
            type="submit"
            disabled={isSaving}
            className="w-full md:w-auto px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-xs font-semibold text-white shadow-md shadow-sky-500/40"
          >
            {isSaving ? 'Сохранение…' : 'Сохранить изменения'}
          </Button>
        </div>
      </form>
      )}

      {isConfirmOpen && (
        <div className="fixed inset-0 z-[950] flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-2xl dark:border-white/10 dark:bg-[#020617]">
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
                    className="bg-slate-50 border-slate-200 text-sm text-slate-900 dark:bg-black/40 dark:border-white/15 dark:text-slate-50"
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
