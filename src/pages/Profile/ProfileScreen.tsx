import React from "react";
import { Camera } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface StoredProfile {
  nickname: string;
  avatarDataUrl: string | null;
}

const STORAGE_KEY = "user-profile";

const ProfileScreen: React.FC = () => {
  const [nickname, setNickname] = React.useState("");
  const [avatarDataUrl, setAvatarDataUrl] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDirty, setIsDirty] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as Partial<StoredProfile>;
      if (parsed.nickname) {
        setNickname(parsed.nickname);
      }
      if (parsed.avatarDataUrl) {
        setAvatarDataUrl(parsed.avatarDataUrl);
      }
    } catch {
      // Если вдруг что-то сломалось в localStorage — тихо игнорируем
    }
  }, []);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setAvatarDataUrl(result);
        setIsDirty(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarReset = () => {
    const payload: StoredProfile = {
      nickname: nickname.trim(),
      avatarDataUrl: null,
    };

    setAvatarDataUrl(null);
    setIsDirty(true);

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent("profile-updated", { detail: payload }));
    } catch {
      // игнорируем ошибки при сбросе
    }
  };

  const handleNicknameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(event.target.value);
    setIsDirty(true);
  };

  const handleSave = () => {
    const payload: StoredProfile = {
      nickname: nickname.trim(),
      avatarDataUrl,
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent("profile-updated", { detail: payload }));
      setIsSaving(true);
      setTimeout(() => {
        setIsSaving(false);
        setIsDirty(false);
      }, 400);
    } catch {
      // Если не удалось сохранить — просто оставляем состояние
    }
  };

  const initials = React.useMemo(() => {
    if (!nickname.trim()) return "👤";
    return nickname.trim()[0]?.toUpperCase() ?? "👤";
  }, [nickname]);

  return (
    <div className="max-w-xl mx-auto px-4 pt-2 pb-6 space-y-3">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-50 mb-0.5">
          Профиль
        </h1>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20 ring-2 ring-white/60 dark:ring-slate-800 shadow-md">
              {avatarDataUrl ? (
                <AvatarImage
                  src={avatarDataUrl}
                  alt="Аватар пользователя"
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>

            <label
              htmlFor="avatar-input"
              className="absolute -right-1 -bottom-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/80 dark:border-slate-900 bg-blue-600 text-white shadow-md cursor-pointer hover:bg-blue-700 transition-colors"
            >
              <Camera className="h-4 w-4" />
              <input
                id="avatar-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </label>
          </div>

          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-gray-900 dark:text-slate-50">
              Аватар
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Загрузите квадратное изображение для лучшего отображения.
            </p>
            {avatarDataUrl && (
              <button
                type="button"
                onClick={handleAvatarReset}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors"
              >
                Сбросить аватар
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="nickname"
            className="block text-sm font-medium text-gray-700 dark:text-slate-200"
          >
            Отображаемый никнейм
          </label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={handleNicknameChange}
            placeholder="Например, @kent или ваше имя"
            className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/80 px-3 py-2 text-sm text-gray-900 dark:text-slate-50 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/80"
          />
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-xs text-gray-400 dark:text-slate-500">
            Данные профиля временно хранятся только локально в вашем браузере.
          </p>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="px-4"
          >
            {isSaving ? "Сохранено" : "Сохранить"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;

