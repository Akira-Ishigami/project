import { ReactNode } from 'react';

interface TabContentProps {
  children: ReactNode;
  isActive: boolean;
  isTransitioning?: boolean;
}

export default function TabContent({ children, isActive, isTransitioning = false }: TabContentProps) {
  if (!isActive) return null;

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        isTransitioning
          ? 'opacity-0 translate-y-1'
          : 'opacity-100 translate-y-0'
      }`}
    >
      {children}
    </div>
  );
}
