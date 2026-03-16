import { useState, useMemo, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router';
import { FolderOpen, Home, User, Mail, Lock, Check, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type UserProfile = {
  login: string;
  email: string;
  fullName: string;
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();

  // В реальном приложении эти данные стоит брать из auth‑контекста / API
  const initialProfile = useMemo<UserProfile>(
    () => ({
      login: 'demo_user',
      email: 'user@example.com',
      fullName: 'Иван Иванов',
    }),
    [],
  );

  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [isSaving, setIsSaving] = useState(false);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const isActive = (path: string) => location.pathname === path;
  const itemClass = (path: string) =>
    `flex flex-col items-center flex-1 text-center ${
      isActive(path) ? 'text-sky-400' : 'text-[#94a3b8] hover:text-white'
    }`;

  const hasEmailChanged = profile.email !== initialProfile.email;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setStatus('idle');
    setStatusMessage(null);

    if (hasEmailChanged) {
      setIsConfirmOpen(true);
    } else {
      void handleSaveProfile();
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      // Здесь должен быть вызов API обновления профиля
      await new Promise((resolve) => setTimeout(resolve, 700));

      setStatus('success');
      setStatusMessage('Данные профиля обновлены.');
    } catch (error) {
      setStatus('error');
      setStatusMessage('Не удалось сохранить изменения. Попробуйте ещё раз.');
    } finally {
      setIsSaving(false);
      setConfirmPassword('');
      setIsConfirmOpen(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmPassword.trim()) {
      setStatus('error');
      setStatusMessage('Введите пароль для подтверждения.');
      return;
    }
    await handleSaveProfile();
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white pb-28">
      <div className="max-w-xl mx-auto px-4 pt-6">
        <h1 className="text-xl font-semibold">Аккаунт</h1>
        <p className="text-sm text-[#94a3b8] mt-1">
          Здесь вы можете изменить данные своего профиля.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-2xl border border-white/10 bg-[#1a1a1a] p-4 space-y-5"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide">
              Логин
            </label>
            <div className="relative">
              <Input
                value={profile.login}
                disabled
                className="bg-black/40 border-white/10 text-sm pr-10"
              />
              <span className="absolute inset-y-0 right-3 flex items-center text-[10px] text-[#64748b] uppercase tracking-wide">
                Нельзя изменить
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-[#64748b]" />
              Почта
            </label>
            <Input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              className="bg-black/30 border-white/10 text-sm"
              placeholder="you@example.com"
              required
            />
            {hasEmailChanged && (
              <p className="text-xs text-amber-400/90">
                При изменении почты понадобится подтверждение.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide">
              Имя и фамилия
            </label>
            <Input
              type="text"
              value={profile.fullName}
              onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
              className="bg-black/30 border-white/10 text-sm"
              placeholder="Как к вам обращаться"
            />
          </div>

          {statusMessage && (
            <div
              className={`mt-1 rounded-lg border px-3 py-2 text-xs ${
                status === 'success'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                  : 'border-red-500/40 bg-red-500/10 text-red-200'
              }`}
            >
              {statusMessage}
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-sm font-medium shadow-lg shadow-sky-500/25"
            >
              {isSaving ? 'Сохранение…' : 'Сохранить изменения'}
            </Button>
          </div>
        </form>
      </div>

      {/* Модалка подтверждения изменения чувствительных данных */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-[950] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#020617] px-5 py-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-amber-500/15 p-1.5">
                <Lock className="h-4 w-4 text-amber-300" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold">Подтверждение изменения почты</h2>
                <p className="mt-1 text-xs text-[#94a3b8]">
                  Для безопасности введите текущий пароль. После подтверждения ваша новая
                  почта будет привязана к аккаунту.
                </p>

                <div className="mt-3 space-y-1.5">
                  <label className="text-[11px] font-medium text-[#94a3b8] uppercase tracking-wide flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-[#64748b]" />
                    Пароль
                  </label>
                  <Input
                    type="password"
                    autoFocus
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-black/40 border-white/15 text-sm"
                    placeholder="Введите пароль"
                  />
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsConfirmOpen(false);
                      setConfirmPassword('');
                    }}
                    className="text-xs text-[#cbd5f5] hover:text-white hover:bg-white/5"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Отмена
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleConfirm}
                    disabled={isSaving}
                    className="text-xs px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600"
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

      {/* Нижний навбар */}
      <div className="fixed inset-x-0 bottom-0 z-[900] pb-4">
        <div className="glass-dock w-full rounded-t-[28px] rounded-b-none px-4 pt-3 pb-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <button type="button" onClick={() => navigate('/')} className={itemClass('/')}>
              <Home className="h-4 w-4 mb-0.5" />
              <span>Главная</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/incidents')}
              className={itemClass('/incidents')}
            >
              <FolderOpen className="h-4 w-4 mb-0.5" />
              <span>Обращения</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className={itemClass('/profile')}
            >
              <User className="h-4 w-4 mb-0.5" />
              <span>Аккаунт</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

