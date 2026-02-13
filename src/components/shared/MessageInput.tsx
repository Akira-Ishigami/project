import { Send, Paperclip, Image as ImageIcon, Loader2 } from 'lucide-react';
import { EmojiPicker } from '../EmojiPicker';

interface MessageInputProps {
  messageText: string;
  onMessageChange: (text: string) => void;
  onSend: () => void;
  onFileSelect: () => void;
  onImageSelect: () => void;
  onPaste?: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  sending: boolean;
  uploadingFile: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function MessageInput({
  messageText,
  onMessageChange,
  onSend,
  onFileSelect,
  onImageSelect,
  onPaste,
  sending,
  uploadingFile,
  disabled = false,
  placeholder = "Digite uma mensagem..."
}: MessageInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm border-t border-slate-200/80 p-4 shadow-lg">
      <div className="flex items-end gap-2">
        <button
          onClick={onFileSelect}
          disabled={disabled}
          className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Anexar arquivo"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <button
          onClick={onImageSelect}
          disabled={disabled}
          className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Enviar imagem"
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        <div className="flex-1 relative">
          <textarea
            value={messageText}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={onPaste}
            disabled={disabled}
            placeholder={placeholder}
            className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:shadow-md resize-none min-h-[48px] max-h-[120px] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            rows={1}
          />
          <div className="absolute right-2 bottom-2">
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                onMessageChange(messageText + emoji);
              }}
            />
          </div>
        </div>

        <button
          onClick={onSend}
          disabled={sending || uploadingFile || disabled || !messageText.trim()}
          className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 shadow-md"
        >
          {sending || uploadingFile ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
