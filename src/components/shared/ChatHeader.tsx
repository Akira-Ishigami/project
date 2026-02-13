import { User, Menu, Tag, ArrowRightLeft, Building2 } from 'lucide-react';

interface ChatHeaderProps {
  contactName: string;
  contactPhone: string;
  onToggleSidebar: () => void;
  onOpenTransferModal?: () => void;
  onOpenTagModal?: () => void;
  tags?: Array<{ id: string; name: string; color: string }>;
  departmentBadge?: {
    show: boolean;
    text: string;
  };
}

export default function ChatHeader({
  contactName,
  contactPhone,
  onToggleSidebar,
  onOpenTransferModal,
  onOpenTagModal,
  tags = [],
  departmentBadge
}: ChatHeaderProps) {
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-sm flex-shrink-0">
          {contactName ? contactName[0].toUpperCase() : <User className="w-5 h-5" />}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-slate-900 truncate">
            {contactName || contactPhone}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5 truncate">
            {contactPhone}
          </p>

          {(departmentBadge?.show || tags.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {departmentBadge?.show && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full border border-amber-200">
                  <Building2 className="w-3 h-3" />
                  {departmentBadge.text}
                </span>
              )}

              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  <Tag className="w-3 h-3" />
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {onOpenTransferModal && (
          <button
            onClick={onOpenTransferModal}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all flex items-center gap-2 shadow-sm"
            title="Transferir departamento"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Transferir</span>
          </button>
        )}

        {onOpenTagModal && (
          <button
            onClick={onOpenTagModal}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all flex items-center gap-2 shadow-sm"
            title="Adicionar tag"
          >
            <Tag className="w-4 h-4" />
            <span className="hidden sm:inline">Tags</span>
          </button>
        )}
      </div>
    </div>
  );
}
