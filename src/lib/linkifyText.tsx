import React from 'react';

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export function linkifyText(text: string): React.ReactNode {
  const parts = text.split(URL_REGEX);

  return parts.map((part, index) => {
    if (part.match(URL_REGEX)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:opacity-80 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}
