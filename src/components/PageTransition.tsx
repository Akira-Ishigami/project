import { useEffect, useState } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  transitionKey: string;
}

export default function PageTransition({ children, transitionKey }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [transitionKey]);

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-2'
      }`}
    >
      {children}
    </div>
  );
}
