import React from 'react';
import { Message } from '../lib/supabase';
import { ArrowRightLeft } from 'lucide-react';

interface SystemMessageProps {
  message: Message;
}

export const SystemMessage: React.FC<SystemMessageProps> = ({ message }) => {
  const isTransfer = message.message_type === 'system_transfer';

  if (!isTransfer) {
    return null;
  }

  return (
    <div className="flex justify-center items-center my-4 px-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-6 py-3 text-center max-w-3xl shadow-sm">
        <div className="flex items-center justify-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-blue-600" />
          <p className="text-blue-900 text-sm font-medium leading-relaxed">
            {message.message}
          </p>
        </div>
        <p className="text-blue-600 text-xs mt-1.5">
          {new Date(message.created_at).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </p>
      </div>
    </div>
  );
};

export default SystemMessage;
