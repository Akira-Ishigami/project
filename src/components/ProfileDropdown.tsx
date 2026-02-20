import { ChevronLeft, ChevronRight, History, Settings, LogOut, MessageSquare, Briefcase, FolderTree, UserCircle2, Tag, CreditCard } from 'lucide-react';

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
  isOpen,
  onToggle,
}: ProfileDropdownProps) {

  return (
    <aside
      className={`fixed top-0 left-0 h-full bg-slate-900 z-40 shadow-2xl transition-all duration-300 ease-out ${
        isOpen ? 'w-64' : 'w-16'
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors z-50"
        title={isOpen ? 'Minimizar menu' : 'Expandir menu'}
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className={`flex-1 min-w-0 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            <h3 className="text-sm font-semibold text-white truncate">{userName}</h3>
            <p className="text-xs text-slate-400 truncate">Conta ativa</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="p-2 space-y-1 mt-4">
        {showNavigationOptions && (
          <>
            {onMessagesClick && (
              <button
                onClick={onMessagesClick}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                  activeTab === 'mensagens'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title={!isOpen ? 'Mensagens' : ''}
              >
                <MessageSquare className="w-5 h-5 flex-shrink-0" />
                <span className={`text-sm font-medium whitespace-nowrap transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                  Mensagens
                </span>
              </button>
            )}

            {onDepartmentsClick && (
              <button
                onClick={onDepartmentsClick}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                  activeTab === 'departamentos'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title={!isOpen ? 'Departamentos' : ''}
              >
                <Briefcase className="w-5 h-5 flex-shrink-0" />
                <span className={`text-sm font-medium whitespace-nowrap transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                  Departamentos
                </span>
              </button>
            )}

            {onSectorsClick && (
              <button
                onClick={onSectorsClick}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                  activeTab === 'setores'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title={!isOpen ? 'Setores' : ''}
              >
                <FolderTree className="w-5 h-5 flex-shrink-0" />
                <span className={`text-sm font-medium whitespace-nowrap transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                  Setores
                </span>
              </button>
            )}

            {onAttendantsClick && (
              <button
                onClick={onAttendantsClick}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                  activeTab === 'atendentes'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title={!isOpen ? 'Atendentes' : ''}
              >
                <UserCircle2 className="w-5 h-5 flex-shrink-0" />
                <span className={`text-sm font-medium whitespace-nowrap transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                  Atendentes
                </span>
              </button>
            )}

            {onTagsClick && (
              <button
                onClick={onTagsClick}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                  activeTab === 'tags'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title={!isOpen ? 'Tags' : ''}
              >
                <Tag className="w-5 h-5 flex-shrink-0" />
                <span className={`text-sm font-medium whitespace-nowrap transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                  Tags
                </span>
              </button>
            )}

            {onMyPlanClick && (
              <button
                onClick={onMyPlanClick}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                  activeTab === 'meu-plano'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title={!isOpen ? 'Meu Plano' : ''}
              >
                <CreditCard className="w-5 h-5 flex-shrink-0" />
                <span className={`text-sm font-medium whitespace-nowrap transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                  Meu Plano
                </span>
              </button>
            )}

            <div className="border-t border-slate-700 my-3"></div>
          </>
        )}

        <button
          onClick={onHistoryClick}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${
            activeTab === 'historico'
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
          title={!isOpen ? 'Histórico' : ''}
        >
          <History className="w-5 h-5 flex-shrink-0" />
          <span className={`text-sm font-medium whitespace-nowrap transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
            Histórico
          </span>
        </button>

        {showSettings && (
          <button
            onClick={onSettingsClick}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${
              activeTab === 'configuracoes'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title={!isOpen ? 'Configurações' : ''}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className={`text-sm font-medium whitespace-nowrap transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
              Configurações
            </span>
          </button>
        )}

        <div className="border-t border-slate-700 my-3"></div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-red-400 hover:bg-red-950/50 hover:text-red-300 transition-all duration-200"
          title={!isOpen ? 'Sair' : ''}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className={`text-sm font-medium whitespace-nowrap transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
            Sair
          </span>
        </button>
      </nav>
    </aside>
  );
}
