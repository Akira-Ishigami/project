import { MessageSquare, LogOut, Menu, Bell } from 'lucide-react';

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
  return (
    <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/80 sticky top-0 z-30">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200"
              title={sidebarOpen ? "Fechar menu" : "Abrir menu"}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 transform hover:scale-105 transition-transform duration-200">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">ChatFlow</h1>
              <p className="text-slate-500 text-sm mt-0.5">{userRole}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showNotifications && onToggleNotifications && (
              <button
                onClick={onToggleNotifications}
                className="relative p-2.5 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200"
                title="Notificações"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-slate-700">{userName}</span>
            </div>

            <button
              onClick={onSignOut}
              className="p-2.5 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200"
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
