import React, { useState } from 'react';
import { Smile } from 'lucide-react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect }) => {
  const [showPicker, setShowPicker] = useState(false);

  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
    '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
    '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
    '😌', '😔', '😑', '😐', '😶', '🥱', '🤫', '🤭',
    '🤫', '😏', '😒', '😞', '😔', '😟', '😕', '🙁',
    '😲', '😳', '😥', '😦', '😧', '😨', '😰', '😢',
    '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫',
    '🥺', '😤', '😡', '😠', '🤬', '😈', '👿', '💀',
    '😎', '🤓', '🤩', '😏', '😒', '😞', '😔', '😟',
    '👍', '👎', '👋', '🙏', '💪', '✌️', '👌', '🤞',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
    '🎉', '🎊', '🎈', '🎁', '⭐', '✨', '🌟', '💫',
    '👏', '🤲', '🤝', '🙌', '👐', '🤲', '💝', '💗',
    '🔥', '💥', '⚡', '💧', '🌊', '🌈', '☀️', '🌙',
    '✅', '❌', '⚠️', '🚀', '💯', '🎯', '📱', '💻',
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="text-gray-500 hover:text-blue-500 transition-colors"
        title="Emojis"
      >
        <Smile className="w-5 h-5" />
      </button>

      {showPicker && (
        <div className="absolute bottom-10 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-80 z-50">
          <div className="grid grid-cols-8 gap-2 max-h-60 overflow-y-auto">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onSelect(emoji);
                  setShowPicker(false);
                }}
                className="text-2xl hover:bg-gray-100 p-2 rounded transition-colors cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
