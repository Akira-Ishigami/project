import { Search, User, Pin, AlertCircle } from 'lucide-react';
import { ReactNode } from 'react';

interface Contact {
  phoneNumber: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  pinned?: boolean;
}

interface ContactsSidebarProps {
  sidebarOpen: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  contacts: Contact[];
  selectedContact: string | null;
  onSelectContact: (phoneNumber: string) => void;
  onContextMenu?: (e: React.MouseEvent, phoneNumber: string) => void;
  formatTime: (dateString: string) => string;
  formatPhone: (phoneNumber: string) => string;
  error?: string | null;
  filterSlot?: ReactNode;
  emptyMessage?: string;
  onCloseSidebar?: () => void;
}

export default function ContactsSidebar({
  sidebarOpen,
  searchTerm,
  onSearchChange,
  contacts,
  selectedContact,
  onSelectContact,
  onContextMenu,
  formatTime,
  formatPhone,
  error,
  filterSlot,
  emptyMessage = "Nenhum contato encontrado",
  onCloseSidebar
}: ContactsSidebarProps) {
  return (
    <div
      className={`${
        sidebarOpen ? 'flex' : 'hidden'
      } md:flex w-full md:w-[360px] bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-r border-slate-200/80 dark:border-slate-700/80 flex-col shadow-xl transition-colors duration-300`}
    >
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800 px-5 py-3 flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" />
          <p className="text-red-700 dark:text-red-300 text-sm flex-1">{error}</p>
        </div>
      )}

      {filterSlot && (
        <div className="px-4 py-4 border-b border-slate-200/80 dark:border-slate-700/80 bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-800 dark:to-slate-750 transition-colors duration-300">
          {filterSlot}
        </div>
      )}

      <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-700/80 transition-colors duration-300">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors duration-200" />
          <input
            type="text"
            placeholder="Pesquisar contato..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 text-sm pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-700 focus:shadow-md transition-all duration-200 placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 px-4 text-center py-12">
            <User className="w-16 h-16 mb-4 text-slate-300 dark:text-slate-600" />
            <p className="font-medium text-slate-600 dark:text-slate-400">{emptyMessage}</p>
          </div>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.phoneNumber}
              onClick={() => {
                onSelectContact(contact.phoneNumber);
                if (onCloseSidebar) onCloseSidebar();
              }}
              onContextMenu={(e) => onContextMenu?.(e, contact.phoneNumber)}
              className={`px-4 py-3.5 border-b border-slate-100 dark:border-slate-700/50 cursor-pointer transition-all duration-200 ${
                selectedContact === contact.phoneNumber
                  ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/20 border-l-4 border-l-blue-600 dark:border-l-blue-400 shadow-sm'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:shadow-sm hover:translate-x-0.5'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-base flex-shrink-0 shadow-md shadow-blue-500/30 transform hover:scale-110 transition-transform duration-200">
                  {contact.name ? contact.name[0].toUpperCase() : <User className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm">
                        {contact.name || formatPhone(contact.phoneNumber)}
                      </h3>
                      {contact.pinned && (
                        <Pin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-2 flex-shrink-0">
                      {formatTime(contact.lastMessageTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-slate-600 dark:text-slate-400 truncate flex-1">
                      {contact.lastMessage}
                    </p>
                    {contact.unreadCount > 0 && (
                      <span className="ml-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/40 animate-pulse">
                        {contact.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
