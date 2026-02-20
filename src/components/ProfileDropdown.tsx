import { Menu, X, History, Settings, LogOut, MessageSquare, Briefcase, FolderTree, UserCircle2, Tag, CreditCard } from 'lucide-react';

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

  const handleNavClick = (callback: () => void) => {
    callback();
    if (isOpen) {
      onToggle();
    }
  };

  return (
    <>
      {/* Overlay escuro quando menu aberto */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={onToggle}
        />
      )}

      {/* Sidebar fixa minimizada */}
      <aside className="fixed top-0 left-0 h-full w-16 bg-slate-900 z-50 shadow-2xl flex flex-col">
        {/* Botao hamburguer */}
        <div className="p-3 border-b border-slate-800">
          <button
            onClick={onToggle}
            className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center justify-center text-white transition-colors"
            title={isOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Icones de navegacao */}
        <nav className="p-2 space-y-1 mt-2 flex-1">
          {showNavigationOptions && (
            <>
              {onMessagesClick && (
                <button
                  onClick={() => handleNavClick(onMessagesClick)}
                  className={`w-full flex items-center justify-center p-3 rounded-lg transition-all duration-200 ${
                    activeTab === 'mensagens'
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                  title="Mensagens"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              )}

              {onDepartmentsClick && (
                <button
                  onClick={() => handleNavClick(onDepartmentsClick)}
                  className={`w-full flex items-center justify-center p-3 rounded-lg transition-all duration-200 ${
                    activeTab === 'departamentos'
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                  title="Departamentos"
                >
                  <Briefcase className="w-5 h-5" />
                </button>
              )}

              {onSectorsClick && (
                <button
                  onClick={() => handleNavClick(onSectorsClick)}
                  className={`w-full flex items-center justify-center p-3 rounded-lg transition-all duration-200 ${
                    activeTab === 'setores'
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                  title="Setores"
                >
                  <FolderTree className="w-5 h-5" />
                </button>
              )}

              {onAttendantsClick && (
                <button
                  onClick={() => handleNavClick(onAttendantsClick)}
                  className={`w-full flex items-center justify-center p-3 rounded-lg transition-all duration-200 ${
                    activeTab === 'atendentes'
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                  title="Atendentes"
                >
                  <UserCircle2 className="w-5 h-5" />
                </button>
              )}

              {onTagsClick && (
                <button
                  onClick={() => handleNavClick(onTagsClick)}
                  className={`w-full flex items-center justify-center p-3 rounded-lg transition-all duration-200 ${
                    activeTab === 'tags'
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                  title="Tags"
                >
                  <Tag className="w-5 h-5" />
                </button>
              )}

              {onMyPlanClick && (
                <button
                  onClick={() => handleNavClick(onMyPlanClick)}
                  className={`w-full flex items-center justify-center p-3 rounded-lg transition-all duration-200 ${
                    activeTab === 'meu-plano'
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                  title="Meu Plano"
                >
                  <CreditCard className="w-5 h-5" />
                </button>
              )}

              <div className="border-t border-slate-700 my-3"></div>
            </>
          )}

          <button
            onClick={() => handleNavClick(onHistoryClick)}
            className={`w-full flex items-center justify-center p-3 rounded-lg transition-all duration-200 ${
              activeTab === 'historico'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Histórico"
          >
            <History className="w-5 h-5" />
          </button>

          {showSettings && (
            <button
              onClick={() => handleNavClick(onSettingsClick)}
              className={`w-full flex items-center justify-center p-3 rounded-lg transition-all duration-200 ${
                activeTab === 'configuracoes'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Configurações"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </nav>

        {/* Botao sair no rodape */}
        <div className="p-2 border-t border-slate-700">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center p-3 rounded-lg text-red-400 hover:bg-red-950/50 hover:text-red-300 transition-all duration-200"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Menu expandido com overlay */}
      <div
        className={`fixed top-0 left-16 h-full w-56 bg-slate-900 z-50 shadow-2xl transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header com nome do usuario */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white truncate">{userName}</h3>
              <p className="text-xs text-slate-400 truncate">Conta ativa</p>
            </div>
          </div>
        </div>

        {/* Itens de navegacao expandidos */}
        <nav className="p-3 space-y-1">
          {showNavigationOptions && (
            <>
              {onMessagesClick && (
                <button
                  onClick={() => handleNavClick(onMessagesClick)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
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
                  onClick={() => handleNavClick(onDepartmentsClick)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
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
                  onClick={() => handleNavClick(onSectorsClick)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
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
                  onClick={() => handleNavClick(onAttendantsClick)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
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
                  onClick={() => handleNavClick(onTagsClick)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
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
                  onClick={() => handleNavClick(onMyPlanClick)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
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
            onClick={() => handleNavClick(onHistoryClick)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
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
              onClick={() => handleNavClick(onSettingsClick)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                activeTab === 'configuracoes'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">Configurações</span>
            </button>
          )}

          <div className="border-t border-slate-700 my-3"></div>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-red-400 hover:bg-red-950/50 hover:text-red-300 transition-all duration-200"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </nav>
      </div>
    </>
  );
}
