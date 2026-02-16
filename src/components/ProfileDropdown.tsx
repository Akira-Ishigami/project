import { useState, useRef, useEffect } from 'react';
import { User, History, Settings, LogOut, ChevronDown, MessageSquare, Briefcase, FolderTree, UserCircle2, Tag } from 'lucide-react';

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
  showNavigationOptions?: boolean;
  activeTab?: string;
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
  showNavigationOptions = false,
  activeTab,
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 transition-all"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
          {userName ? userName[0].toUpperCase() : <User className="w-5 h-5" />}
        </div>
        <span className="font-medium text-slate-700 hidden md:block">{userName}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform hidden md:block ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-slideUp">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-900">{userName}</p>
            <p className="text-xs text-slate-500 mt-0.5">Conta ativa</p>
          </div>

          {showNavigationOptions && (
            <>
              {onMessagesClick && (
                <button
                  onClick={() => handleMenuClick(onMessagesClick)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    activeTab === 'mensagens'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <MessageSquare className={`w-5 h-5 ${activeTab === 'mensagens' ? 'text-blue-600' : 'text-blue-600'}`} />
                  <span className="font-medium">Mensagens</span>
                  {activeTab === 'mensagens' && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-blue-600"></span>
                  )}
                </button>
              )}

              {onDepartmentsClick && (
                <button
                  onClick={() => handleMenuClick(onDepartmentsClick)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    activeTab === 'departamentos'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Briefcase className={`w-5 h-5 ${activeTab === 'departamentos' ? 'text-blue-600' : 'text-slate-600'}`} />
                  <span className="font-medium">Departamentos</span>
                  {activeTab === 'departamentos' && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-blue-600"></span>
                  )}
                </button>
              )}

              {onSectorsClick && (
                <button
                  onClick={() => handleMenuClick(onSectorsClick)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    activeTab === 'setores'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <FolderTree className={`w-5 h-5 ${activeTab === 'setores' ? 'text-blue-600' : 'text-slate-600'}`} />
                  <span className="font-medium">Setores</span>
                  {activeTab === 'setores' && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-blue-600"></span>
                  )}
                </button>
              )}

              {onAttendantsClick && (
                <button
                  onClick={() => handleMenuClick(onAttendantsClick)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    activeTab === 'atendentes'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <UserCircle2 className={`w-5 h-5 ${activeTab === 'atendentes' ? 'text-blue-600' : 'text-slate-600'}`} />
                  <span className="font-medium">Atendentes</span>
                  {activeTab === 'atendentes' && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-blue-600"></span>
                  )}
                </button>
              )}

              {onTagsClick && (
                <button
                  onClick={() => handleMenuClick(onTagsClick)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    activeTab === 'tags'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Tag className={`w-5 h-5 ${activeTab === 'tags' ? 'text-blue-600' : 'text-slate-600'}`} />
                  <span className="font-medium">Tags</span>
                  {activeTab === 'tags' && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-blue-600"></span>
                  )}
                </button>
              )}

              <div className="border-t border-slate-100 my-2"></div>
            </>
          )}

          <button
            onClick={() => handleMenuClick(onHistoryClick)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
              activeTab === 'historico'
                ? 'bg-blue-50 text-blue-600'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <History className={`w-5 h-5 ${activeTab === 'historico' ? 'text-blue-600' : 'text-blue-600'}`} />
            <span className="font-medium">Histórico</span>
            {activeTab === 'historico' && (
              <span className="ml-auto w-2 h-2 rounded-full bg-blue-600"></span>
            )}
          </button>

          <button
            onClick={() => handleMenuClick(onSettingsClick)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
              activeTab === 'configuracoes'
                ? 'bg-blue-50 text-blue-600'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Settings className={`w-5 h-5 ${activeTab === 'configuracoes' ? 'text-blue-600' : 'text-slate-600'}`} />
            <span className="font-medium">Configurações</span>
            {activeTab === 'configuracoes' && (
              <span className="ml-auto w-2 h-2 rounded-full bg-blue-600"></span>
            )}
          </button>

          <div className="border-t border-slate-100 mt-2 pt-2">
            <button
              onClick={() => handleMenuClick(onLogout)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sair</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
