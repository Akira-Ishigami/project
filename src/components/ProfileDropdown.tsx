import { useEffect } from 'react';
import { History, Settings, LogOut, MessageSquare, Briefcase, FolderTree, UserCircle2, Tag, CreditCard, X } from 'lucide-react';

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
  onClose: () => void;
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
  onClose,
}: ProfileDropdownProps) {

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleMenuClick = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900 z-50 shadow-2xl transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">{userName}</h3>
                <p className="text-xs text-slate-400 truncate">Conta ativa</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1">
          {showNavigationOptions && (
            <>
              {onMessagesClick && (
                <button
                  onClick={() => handleMenuClick(onMessagesClick)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    activeTab === 'mensagens'
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Mensagens</span>
                </button>
              )}

              {onDepartmentsClick && (
                <button
                  onClick={() => handleMenuClick(onDepartmentsClick)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    activeTab === 'departamentos'
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Briefcase className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Departamentos</span>
                </button>
              )}

              {onSectorsClick && (
                <button
                  onClick={() => handleMenuClick(onSectorsClick)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    activeTab === 'setores'
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <FolderTree className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Setores</span>
                </button>
              )}

              {onAttendantsClick && (
                <button
                  onClick={() => handleMenuClick(onAttendantsClick)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    activeTab === 'atendentes'
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <UserCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Atendentes</span>
                </button>
              )}

              {onTagsClick && (
                <button
                  onClick={() => handleMenuClick(onTagsClick)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    activeTab === 'tags'
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Tag className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Tags</span>
                </button>
              )}

              {onMyPlanClick && (
                <button
                  onClick={() => handleMenuClick(onMyPlanClick)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    activeTab === 'meu-plano'
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Meu Plano</span>
                </button>
              )}

              <div className="border-t border-slate-700 my-3"></div>
            </>
          )}

          <button
            onClick={() => handleMenuClick(onHistoryClick)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
              activeTab === 'historico'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <History className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">Histórico</span>
          </button>

          {showSettings && (
            <button
              onClick={() => handleMenuClick(onSettingsClick)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                activeTab === 'configuracoes'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">Configurações</span>
            </button>
          )}

          <div className="border-t border-slate-700 my-3 pt-3">
            <button
              onClick={() => handleMenuClick(onLogout)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-red-400 hover:bg-red-950/50 hover:text-red-300 transition-all duration-200"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">Sair</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
