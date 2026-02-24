import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Bell, Plus, Home, FileText, Map, Info, User, Settings, LogOut, ChevronRight, Inbox, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications] = React.useState(3); // убрал setNotifications
  const [isIncidentsOpen, setIsIncidentsOpen] = React.useState(true);
  const navigate = useNavigate();
  
  const isAuthenticated = false;

  const handleAvatarClick = () => {
    if (isAuthenticated) {
      navigate('/profile');
    } else {
      navigate('/login');
    }
  };

  const handleNotificationsClick = () => {
    navigate('/notifications');
  };

  return (
    <>
      {/* Верхний header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-blue-100/50 shadow-sm transition-all duration-300">
        <div className="flex h-16 items-center justify-between px-4 max-w-7xl mx-auto">
          {/* Слева - аватар */}
          <button onClick={handleAvatarClick} className="focus:outline-none group">
            <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-blue-100 group-hover:ring-blue-300 transition-all duration-300">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm">
                👤
              </AvatarFallback>
            </Avatar>
          </button>

          {/* По центру - логотип с нормальным шрифтом */}
          <Link to="/" className="absolute left-1/2 -translate-x-1/2 group">
              <span className="text-base font-semibold tracking-wide text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
              СДАЙ КЕНТА
            </span>
          </Link>

          {/* Справа - уведомления */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleNotificationsClick}
            className="relative text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 group"
          >
            <Bell className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-br from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                {notifications}
              </span>
            )}
          </Button>
        </div>
      </header>

      {/* Отступ */}
      <div className="h-16" />

      {/* Нижняя навигация */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/80 backdrop-blur-md border-t border-blue-100/50 shadow-lg transition-all duration-300">
        <div className="flex items-center justify-around h-16 px-2">
          <BottomNavItem to="/" icon={<Home className="h-5 w-5" />} label="Главная" />
          <BottomNavItem to="/incidents" icon={<FileText className="h-5 w-5" />} label="Все" />
          
          {/* Центральная кнопка */}
          <Link
            to="/create"
            className="flex flex-col items-center justify-center flex-1 h-full -mt-6 group"
          >
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 border-2 border-white">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-xs mt-1 font-medium text-blue-600 group-hover:text-blue-700 transition-colors duration-300">
              Создать
            </span>
          </Link>
          
          <BottomNavItem to="/map" icon={<Map className="h-5 w-5" />} label="Карта" />
          
          {/* Бургер меню */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-blue-600 transition-colors duration-300 group">
                <Menu className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-xs mt-1">Меню</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0 bg-white/95 backdrop-blur-md border-l border-blue-100">
              <SheetHeader className="p-6 border-b border-blue-100">
                <SheetTitle className="text-left text-base font-semibold text-blue-600">
                  Меню
                </SheetTitle>
              </SheetHeader>
              
              <div className="flex flex-col h-[calc(100vh-80px)]">
                <nav className="flex-1 p-4 overflow-y-auto">
                  <div className="flex flex-col gap-1">
                    {/* Основное */}
                    <div className="px-4 py-2">
                      <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">
                        Основное
                      </span>
                    </div>

                    <NavLink to="/" icon={<Home className="h-4 w-4" />} onClick={() => setIsOpen(false)}>
                      Главная
                    </NavLink>
                    
                    <NavLink to="/map" icon={<Map className="h-4 w-4" />} onClick={() => setIsOpen(false)}>
                      Карта
                    </NavLink>
                    
                    <NavLink to="/about" icon={<Info className="h-4 w-4" />} onClick={() => setIsOpen(false)}>
                      О проекте
                    </NavLink>

                    {/* Обращения */}
                    <div className="mt-4">
                      <Collapsible open={isIncidentsOpen} onOpenChange={setIsIncidentsOpen}>
                        <div className="px-4 py-2 flex items-center justify-between">
                          <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">
                            Обращения
                          </span>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-blue-50 transition-colors duration-300">
                              <ChevronDown className={`h-4 w-4 text-blue-500 transition-all duration-300 ${isIncidentsOpen ? 'rotate-180' : ''}`} />
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                        
                        <CollapsibleContent className="space-y-1 mt-1">
                          <NavLink to="/incidents" icon={<Inbox className="h-4 w-4" />} onClick={() => setIsOpen(false)} className="pl-10">
                            Все обращения
                          </NavLink>
                          
                          <NavLink to="/my-incidents" icon={<User className="h-4 w-4" />} onClick={() => setIsOpen(false)} className="pl-10">
                            Мои обращения
                          </NavLink>
                          
                          <NavLink to="/create" icon={<Plus className="h-4 w-4" />} onClick={() => setIsOpen(false)} className="pl-10">
                            Создать обращение
                          </NavLink>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                    
                    {isAuthenticated && (
                      <>
                        <div className="px-4 py-2 mt-4">
                          <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">
                            Личное
                          </span>
                        </div>
                        
                        <NavLink to="/profile" icon={<User className="h-4 w-4" />} onClick={() => setIsOpen(false)}>
                          Профиль
                        </NavLink>
                        <NavLink to="/settings" icon={<Settings className="h-4 w-4" />} onClick={() => setIsOpen(false)}>
                          Настройки
                        </NavLink>
                      </>
                    )}
                  </div>
                </nav>

                {/* Авторизация */}
                <div className="p-6 border-t border-blue-100 bg-gradient-to-b from-white to-blue-50/30">
                  {isAuthenticated ? (
                    <Button 
                      variant="outline"
                      className="w-full border-blue-200 text-gray-700 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300"
                      onClick={() => setIsOpen(false)}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Выйти
                    </Button>
                  ) : (
                    <>
                      <Button 
                        className="w-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white mb-2 shadow-md hover:shadow-lg transition-all duration-300"
                        onClick={() => {
                          setIsOpen(false);
                          navigate('/login');
                        }}
                      >
                        Войти
                      </Button>
                      <p className="text-sm text-center text-gray-600">
                        Нет аккаунта?{" "}
                        <button 
                          className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300"
                          onClick={() => {
                            setIsOpen(false);
                            navigate('/register');
                          }}
                        >
                          Зарегистрироваться
                        </button>
                      </p>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Отступ снизу */}
      <div className="h-16 md:h-0" />
    </>
  );
}

// Компонент для нижней навигации
const BottomNavItem = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => {
  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-blue-600 transition-all duration-300 group"
    >
      <span className="group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300">{icon}</span>
      <span className="text-xs mt-1 group-hover:text-blue-600 transition-colors duration-300">{label}</span>
    </Link>
  );
};

// Компонент для ссылок в меню
const NavLink = ({ to, children, icon, className = "", ...props }: any) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-300 group ${className}`}
    {...props}
  >
    <span className="text-gray-500 group-hover:text-blue-600 group-hover:scale-110 transition-all duration-300">{icon}</span>
    <span className="text-sm flex-1">{children}</span>
    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
  </Link>
);