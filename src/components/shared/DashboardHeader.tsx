import { MessageSquare, LogOut, Menu, Bell, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface DashboardHeaderProps {
  userName: string;
  userRole: string;
  onToggleSidebar: () => void;
  onSignOut: () => void;
  sidebarOpen: boolean;
  showNotifications?: boolean;
  unreadCount?: number;
  onToggleNotifications?: () => void;
}

export default function DashboardHeader({
  userName,
  userRole,
  onToggleSidebar,
  onSignOut,
  sidebarOpen,
  showNotifications = false,
  unreadCount = 0,
  onToggleNotifications
}: DashboardHeaderProps) {
  const { settings, darkMode, toggleDarkMode } = useTheme();

  const displayName = settings.displayName || 'ChatFlow';
  const hasLogo = settings.logoUrl && settings.logoUrl.trim() !== '';

  return (
    <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-sm border-b border-slate-200/80 dark:border-slate-700/80 sticky top-0 z-30 transition-colors duration-300">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all duration-200"
              title={sidebarOpen ? "Fechar menu" : "Abrir menu"}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200 overflow-hidden ${
              hasLogo
                ? 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600'
                : 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30'
            }`}>
              {hasLogo ? (
                <img
                  src={settings.logoUrl}
                  alt="Logo"
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <MessageSquare className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white transition-colors duration-200">{displayName}</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5 transition-colors duration-200">{userRole}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all duration-200"
              title={darkMode ? "Modo claro" : "Modo escuro"}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {showNotifications && onToggleNotifications && (
              <button
                onClick={onToggleNotifications}
                className="relative p-2.5 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all duration-200"
                title="Notificações"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 dark:bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg transition-colors duration-200">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-blue-500/30">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{userName}</span>
            </div>

            <button
              onClick={onSignOut}
              className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all duration-200"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
