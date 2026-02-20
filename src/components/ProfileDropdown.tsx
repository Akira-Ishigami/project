import { History, Settings, LogOut, MessageSquare, Briefcase, FolderTree, UserCircle2, Tag, CreditCard } from 'lucide-react';

interface ProfileDropdownProps {
  userName: string;
  onHistoryClick: () => void;
  onSettingsClick: () => void;
  onLogout: () => void;
  onMessagesClick?: () => void;
  onDepartmentsClick?: () => void;
  onSectorsClick?: () => void;
  onAttendantsClick?: () => void;
  onTagsClick?: () => void;
  onMyPlanClick?: () => void;
  showNavigationOptions?: boolean;
  showSettings?: boolean;
  activeTab?: string;
  isOpen: boolean;
  onToggle: () => void;
}

export default function ProfileDropdown({
  userName,
  onHistoryClick,
  onSettingsClick,
  onLogout,
  onMessagesClick,
  onDepartmentsClick,
  onSectorsClick,
  onAttendantsClick,
  onTagsClick,
  onMyPlanClick,
  showNavigationOptions = false,
  showSettings = true,
  activeTab,
}: ProfileDropdownProps) {

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-slate-900 z-50 shadow-lg">
      <div className="h-full flex items-center justify-between px-4">
        <div className="flex items-center gap-1">
          {showNavigationOptions && (
            <>
              {onMessagesClick && (
                <button
                  onClick={onMessagesClick}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    activeTab === 'mensagens'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">Mensagens</span>
                  {activeTab === 'mensagens' && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full" />
                  )}
                </button>
              )}

              {onDepartmentsClick && (
                <button
                  onClick={onDepartmentsClick}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    activeTab === 'departamentos'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">Departamentos</span>
                  {activeTab === 'departamentos' && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full" />
                  )}
                </button>
              )}

              {onSectorsClick && (
                <button
                  onClick={onSectorsClick}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    activeTab === 'setores'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <FolderTree className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">Setores</span>
                  {activeTab === 'setores' && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full" />
                  )}
                </button>
              )}

              {onAttendantsClick && (
                <button
                  onClick={onAttendantsClick}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    activeTab === 'atendentes'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <UserCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">Atendentes</span>
                  {activeTab === 'atendentes' && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full" />
                  )}
                </button>
              )}

              {onTagsClick && (
                <button
                  onClick={onTagsClick}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    activeTab === 'tags'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Tag className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">Tags</span>
                  {activeTab === 'tags' && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full" />
                  )}
                </button>
              )}

              {onMyPlanClick && (
                <button
                  onClick={onMyPlanClick}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    activeTab === 'meu-plano'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">Meu Plano</span>
                  {activeTab === 'meu-plano' && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full" />
                  )}
                </button>
              )}

              <div className="w-px h-6 bg-slate-700 mx-2 hidden sm:block" />
            </>
          )}

          <button
            onClick={onHistoryClick}
            className={`relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
              activeTab === 'historico'
                ? 'bg-blue-500/20 text-blue-400'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">Historico</span>
            {activeTab === 'historico' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>

          {showSettings && (
            <button
              onClick={onSettingsClick}
              className={`relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                activeTab === 'configuracoes'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Configuracoes</span>
              {activeTab === 'configuracoes' && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-white hidden md:inline">{userName}</span>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-950/50 hover:text-red-300 transition-all duration-200"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
