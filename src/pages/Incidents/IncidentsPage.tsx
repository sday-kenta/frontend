import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router';
import { FolderOpen, Home, User } from 'lucide-react';

export default function IncidentsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const itemClass = (path: string) =>
    `flex flex-col items-center flex-1 text-center ${
      isActive(path) ? 'text-sky-400' : 'text-[#94a3b8] hover:text-white'
    }`;

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white pb-28">
      <div className="max-w-xl mx-auto px-4 pt-6">
        <h1 className="text-xl font-semibold">Обращения</h1>
        <p className="text-sm text-[#94a3b8] mt-1">
          Заглушка страницы. Тут будет список доносов и фильтры.
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-[#1a1a1a] p-4">
          <p className="text-sm text-[#94a3b8]">
            Пока нет данных. Добавим список обращений позже.
          </p>
        </div>
      </div>

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

