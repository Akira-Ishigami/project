import React from 'react';
import { Message } from '../lib/supabase';

interface SystemMessageProps {
  message: Message;
}

export const SystemMessage: React.FC<SystemMessageProps> = ({ message }) => {
  const isTransfer = message.message_type === 'system_transfer';

  if (!isTransfer) {
    return null;
  }

  return (
    <div className="flex justify-center items-center my-6 px-4">
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-lg px-4 py-3 text-center max-w-2xl shadow-md border border-slate-600">
        <p className="text-slate-100 text-sm font-medium leading-relaxed">
          📋 {message.message}
        </p>
        <p className="text-slate-400 text-xs mt-2">
          {new Date(message.created_at).toLocaleTimeString('pt-BR', {
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
