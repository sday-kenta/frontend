import * as React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, Bell, Home, Map, User, Settings, LogOut, ChevronRight, FolderOpen, MessageCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveAvatarUrl } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications] = React.useState(3);
  const [userProfile] = React.useState<{
    id: number;
    first_name?: string;
    last_name?: string;
    avatar_url?: string | null;
  } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const bottomNavItems = React.useMemo(
    () => [
      {
        to: "/",
        icon: <Home className="h-5 w-5" />,
        label: "Главная",
      },
      {
        to: "/incidents",
        icon: <FolderOpen className="h-5 w-5" />,
        label: "Обращения",
      },
      {
        to: "/map",
        icon: <Map className="h-5 w-5" />,
        label: "Карта",
      },
    ],
    []
  );

  const activeIndex = React.useMemo(
    () => bottomNavItems.findIndex((item) => item.to === location.pathname),
    [bottomNavItems, location.pathname]
  );

  const indicatorIndex = activeIndex === -1 ? 0 : activeIndex;
  const itemRefs = React.useRef<(HTMLAnchorElement | null)[]>([]);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const rafIdRef = React.useRef<number | null>(null);
  const [indicatorStyle, setIndicatorStyle] = React.useState<{
    width: number;
    left: number;
  }>({ width: 0, left: 0 });

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark");
    window.localStorage.setItem("theme-mode", "dark");
  }, []);

  const updateIndicator = React.useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      const container = containerRef.current;
      const el = itemRefs.current[indicatorIndex];

      if (!container || !el) return;

      const containerRect = container.getBoundingClientRect();
      const rect = el.getBoundingClientRect();

      const targetWidth = rect.width * 0.6;
      const left = rect.left - containerRect.left + (rect.width - targetWidth) / 2;

      setIndicatorStyle({
        width: targetWidth,
        left,
      });
    });
  }, [indicatorIndex]);

  React.useEffect(() => {
    updateIndicator();
  }, [updateIndicator, location.pathname]);

  React.useEffect(() => {
    const handleResize = () => updateIndicator();

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [updateIndicator]);


  const isAuthenticated = !!userProfile;

  const avatarInitials = React.useMemo(() => {
    if (!userProfile) return "";
    const parts = [userProfile.last_name, userProfile.first_name]
      .filter(Boolean)
      .map((s) => String(s).trim()[0]?.toUpperCase());
    return parts.join("");
  }, [userProfile]);

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

  const handleSupportClick = () => {
    console.log('Чат поддержки');
  };

  return (
    <>
      {/* Верхний header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-slate-900/80 backdrop-blur-md border-b border-white/20 dark:border-slate-800 shadow-md">
        <div className="flex h-16 items-center justify-between px-4 max-w-7xl mx-auto">
          {/* Слева - аватар */}
          <button onClick={handleAvatarClick} className="focus:outline-none group">
            <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-white/50 dark:ring-slate-700 group-hover:ring-blue-300 transition-all duration-300">
              {userProfile?.avatar_url && (
                <AvatarImage src={resolveAvatarUrl(userProfile.avatar_url) ?? ''} alt="" className="object-cover" />
              )}
              <AvatarFallback className="bg-gradient-to-br from-blue-500/90 to-blue-600/90 text-white text-sm backdrop-blur-sm">
                {avatarInitials || "👤"}
              </AvatarFallback>
            </Avatar>
          </button>

          {/* Центр пока пустой, оставляем чистый header */}
          <div className="absolute left-1/2 -translate-x-1/2" />

          {/* Справа - уведомления */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleNotificationsClick}
            className="relative text-gray-600 dark:text-slate-200 hover:text-blue-600 hover:bg-white/50 dark:hover:bg-slate-800/60 transition-all duration-300"
          >
            <Bell className="h-6 w-6" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border border-white/80 dark:border-slate-900 shadow-sm">
                {notifications}
              </span>
            )}
          </Button>
        </div>
      </header>

      {/* Небольшой отступ, чтобы контент не прятался под хедером */}
      <div className="h-4" />

      {/* Кнопка поддержки */}
      <div className="fixed bottom-28 right-6 z-40 md:bottom-8 md:right-4">
        <button
          onClick={handleSupportClick}
          className="group relative flex items-center justify-center w-12 h-12 bg-blue-500/15 dark:bg-sky-500/20 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg border border-white/30 dark:border-slate-700 transition-transform duration-300 hover:scale-105"
        >
          <div className="absolute inset-0 rounded-full bg-blue-400/15 dark:bg-sky-400/20" />
          <MessageCircle className="h-5 w-5 text-blue-600/80 dark:text-sky-300" />
        </button>

        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-gray-900/80 backdrop-blur-sm text-white text-xs py-1.5 px-3 rounded-lg whitespace-nowrap border border-white/10">
            Чат с поддержкой
            <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900/80" />
          </div>
        </div>
      </div>

      {/* Нижняя навигация */}
      <nav className="fixed bottom-2 left-3 right-3 z-30 md:hidden">
        <div className="relative">
          <div className="absolute inset-0 bg-white/25 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 dark:border-slate-800" />

          <div
            ref={containerRef}
            className="relative flex items-center justify-around h-16 px-2 overflow-hidden"
          >
            <div className="pointer-events-none absolute bottom-1 left-0 h-[3px] w-full">
              <div
                className="h-full bg-blue-500/90 rounded-full transition-all duration-200 ease-out will-change-transform"
                style={{
                  width: indicatorStyle.width,
                  transform: `translateX(${indicatorStyle.left}px)`,
                }}
              />
            </div>
            {bottomNavItems.map((item, index) => (
              <BottomNavItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                isActive={index === indicatorIndex}
                innerRef={(el: HTMLAnchorElement | null) => {
                  itemRefs.current[index] = el;
                }}
              />
            ))}
            
            {/* Бургер меню */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <button className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 dark:text-slate-200 hover:text-blue-600 dark:hover:text-sky-400 transition-colors duration-300 group">
                  <Menu className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-xs mt-1 font-bold text-gray-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-sky-400">
                    Меню
                  </span>
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] sm:w-[400px] p-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-l border-white/20 dark:border-slate-800"
              >
                <SheetHeader className="p-6 border-b border-gray-100/50 dark:border-slate-800/60">
                  <SheetTitle className="text-left text-base font-semibold text-blue-600 dark:text-sky-400">
                    Меню
                  </SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col h-[calc(100vh-80px)]">
                  <nav className="flex-1 p-4 overflow-y-auto">
                    <div className="flex flex-col gap-1">
                      {/* О проекте */}
                      <div className="px-4 py-2">
                        <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">
                          О проекте
                        </span>
                      </div>

                      <NavLink
                        to="/about"
                        icon={<Info className="h-4 w-4" />}
                        onClick={() => setIsOpen(false)}
                      >
                        О проекте
                      </NavLink>

                      {isAuthenticated && (
                        <>
                          <div className="px-4 py-2 mt-4">
                            <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">
                              Личное
                            </span>
                          </div>

                          <NavLink
                            to="/profile"
                            icon={<User className="h-4 w-4" />}
                            onClick={() => setIsOpen(false)}
                          >
                            Профиль
                          </NavLink>
                          <NavLink
                            to="/settings"
                            icon={<Settings className="h-4 w-4" />}
                            onClick={() => setIsOpen(false)}
                          >
                            Настройки
                          </NavLink>
                        </>
                      )}
                    </div>
                  </nav>

                  {/* Авторизация */}
                  <div className="p-6 border-t border-gray-100/50 dark:border-slate-800/60 bg-gradient-to-b from-white/50 to-blue-50/30 dark:from-slate-950/60 dark:to-slate-900/80">
                    {isAuthenticated ? (
                      <Button 
                        variant="outline"
                        className="w-full border-blue-200/50 text-gray-700 hover:text-blue-600 hover:border-blue-300 hover:bg-white/80 transition-all duration-300 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Выйти
                      </Button>
                    ) : (
                      <>
                        <Button 
                          className="w-full bg-gradient-to-br from-blue-500/90 to-blue-600/90 hover:from-blue-600 hover:to-blue-700 text-white mb-2 shadow-md hover:shadow-lg transition-all duration-300 backdrop-blur-sm"
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
        </div>
      </nav>

      {/* Отступ снизу, учитывая нижнюю навигацию и safe-area на телефонах */}
      <div className="h-20 md:h-0" />
    </>
  );
}

// Компонент для нижней навигации — без ripple, с полоской
const BottomNavItem = ({
  to,
  icon,
  label,
  isActive,
  innerRef,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  innerRef?: (el: HTMLAnchorElement | null) => void;
}) => (
  <Link
    ref={innerRef}
    to={to}
    className={`flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200 relative ${
      isActive
        ? "text-blue-600 dark:text-sky-400"
        : "text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-sky-400"
    }`}
  >
    <div className="relative flex flex-col items-center">
      <span
        className={`relative z-10 mb-0.5 transition-transform duration-200 ${
          isActive ? "scale-110" : ""
        }`}
      >
        {icon}
      </span>
      <span
        className={`relative z-10 text-xs font-bold text-gray-900 whitespace-nowrap transition-colors duration-200 ${
          isActive ? "text-blue-600 dark:text-sky-400" : "dark:text-slate-200"
        }`}
      >
        {label}
      </span>
    </div>
  </Link>
);

// Компонент для ссылок в меню
const NavLink = ({ to, children, icon, className = "", ...props }: any) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:text-blue-600 hover:bg-white/80 rounded-lg transition-all duration-300 group ${className}`}
    {...props}
  >
    <span className="text-gray-500 group-hover:text-blue-600 group-hover:scale-110 transition-all duration-300">{icon}</span>
    <span className="text-sm flex-1 font-medium">{children}</span>
    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
  </Link>
);